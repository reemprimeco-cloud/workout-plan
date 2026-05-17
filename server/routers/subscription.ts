import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb, verifyAccessCode, createAccessCode } from "../db";
import { subscriptions, billingHistory, accessCodes } from "../../drizzle/schema";
import { resendKeyEmail } from "../_core/email";
import { eq, desc } from "drizzle-orm";
import { createInvoice, getPaymentStatusByPaymentId, PLAN_PRICES, type PlanId, type Period } from "../_core/myfatoorah";
import { generateLicenseKey } from "../handlers/licenseUtils";

export const subscriptionRouter = router({
  // Get available plans with prices
  getPlans: publicProcedure.query(() => {
    return {
      plans: [
        {
          id: "free",
          nameEn: "Free",
          nameAr: "مجاني",
          descriptionEn: "Basic access to Prime Fit",
          descriptionAr: "وصول أساسي لـ Prime Fit",
          features: ["basic_tracking", "workout_guide"],
          prices: { monthly: 0, yearly: 0 },
        },
        {
          id: "prime_plus",
          nameEn: "Prime Plus",
          nameAr: "برايم بلس",
          descriptionEn: "Full access with AI coach",
          descriptionAr: "وصول كامل مع المدرب الذكي",
          features: ["basic_tracking", "workout_guide", "ai_coach", "community", "stats"],
          prices: PLAN_PRICES.prime_plus,
        },
        {
          id: "prime_pro",
          nameEn: "Prime Pro",
          nameAr: "برايم برو",
          descriptionEn: "Everything in Plus + priority support",
          descriptionAr: "كل شيء في بلس + دعم أولوية",
          features: ["basic_tracking", "workout_guide", "ai_coach", "community", "stats", "priority_support", "custom_programs"],
          prices: PLAN_PRICES.prime_pro,
        },
      ],
    };
  }),

  // Start a free 7-day trial — generates a PRIME-XXXX-XXXX key with no payment required.
  // One trial per email address to prevent abuse.
  startFreeTrial: publicProcedure
    .input(z.object({
      customerName: z.string().min(1).max(100).default("Prime Fit User"),
      customerEmail: z.string().email(),
      customerPhone: z.string().max(30).optional(),
    }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Prevent duplicate free trials by email
      if (input.customerEmail) {
        const email = input.customerEmail.toLowerCase().trim();
        const existing = await database
          .select()
          .from(accessCodes)
          .where(eq(accessCodes.customerEmail, email))
          .limit(1);
        if (existing.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "لقد استخدمت تجربتك المجانية مسبقاً — You have already used your free trial",
          });
        }
      }

      // Generate a fresh 7-day license key
      const newKey = generateLicenseKey();
      const expiresAt = new Date(Date.now() + 7 * 86400_000); // 7 days

      await createAccessCode({
        code: newKey,
        customerName: input.customerName,
        customerEmail: input.customerEmail?.toLowerCase().trim() ?? null,
        note: `Free 7-day trial`,
        isActive: true,
        expiresAt,
      });

      console.log(`[FreeTrial] Generated key ${newKey} for ${input.customerEmail ?? "(no email)"}, expires ${expiresAt.toDateString()}`);

      // Send email with the license key
      if (input.customerEmail) {
        try {
          await resendKeyEmail({
            to: input.customerEmail,
            customerName: input.customerName || "Prime Fit User",
            licenseKey: newKey,
            expiresAt,
          });
          console.log(`[FreeTrial] Email sent to ${input.customerEmail}`);
        } catch (emailErr) {
          // Don't fail the request if email fails — key was already created
          console.error(`[FreeTrial] Email failed for ${input.customerEmail}:`, emailErr);
        }
      }

      return {
        success: true,
        licenseKey: newKey,
        expiresAt,
        message: "تم إنشاء مفتاح التجربة المجانية بنجاح",
      };
    }),

  // Get current user's subscription status (public so unauthenticated users can check before login)
  getStatus: publicProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // If not authenticated, return free plan
    if (!ctx.user) {
      return { plan: "free", status: "active", expiresAt: null, licenseKey: null };
    }

    const userId = ctx.user.openId;
    const rows = await database
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (rows.length === 0) {
      return { plan: "free", status: "active", expiresAt: null, licenseKey: null };
    }

    const sub = rows[0];

    // Auto-expire if past expiresAt
    if (sub.expiresAt && sub.expiresAt < new Date() && (sub.status === "active" || sub.status === "trialing")) {
      await database
        .update(subscriptions)
        .set({ status: "expired" })
        .where(eq(subscriptions.userId, userId));

      // Deactivate linked license key if this was a free trial
      if (sub.licenseKey && sub.plan === "free") {
        await database
          .update(accessCodes)
          .set({ isActive: false })
          .where(eq(accessCodes.code, sub.licenseKey));
        console.log(`[Subscription] Auto-deactivated free trial key ${sub.licenseKey} for user ${userId}`);
      }

      return { ...sub, status: "expired" };
    }

    return sub;
  }),

  // Activate a free trial using a PRIME-XXXX-XXXX license key
  activateFreeTrial: protectedProcedure
    .input(z.object({ licenseKey: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const userId = ctx.user.openId;
      const key = input.licenseKey.trim().toUpperCase();

      // Verify the license key is valid and active
      const codeRow = await verifyAccessCode(key);
      if (!codeRow) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired license key",
        });
      }

      // Check if user already has an active paid subscription
      const existing = await database
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (existing.length > 0) {
        const sub = existing[0];
        if (sub.status === "active" && sub.plan !== "free") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You already have an active paid subscription",
          });
        }
        if (sub.status === "trialing") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You already have an active free trial",
          });
        }
      }

      // Set free trial expiry: use key's expiresAt if set, otherwise 30 days
      const now = new Date();
      let trialExpiresAt: Date;
      if (codeRow.expiresAt) {
        trialExpiresAt = new Date(codeRow.expiresAt);
      } else {
        trialExpiresAt = new Date(now);
        trialExpiresAt.setDate(trialExpiresAt.getDate() + 30);
      }

      if (existing.length > 0) {
        await database
          .update(subscriptions)
          .set({
            plan: "free",
            status: "trialing",
            startsAt: now,
            expiresAt: trialExpiresAt,
            licenseKey: key,
            updatedAt: now,
          })
          .where(eq(subscriptions.userId, userId));
      } else {
        await database.insert(subscriptions).values({
          userId,
          plan: "free",
          status: "trialing",
          period: "monthly",
          startsAt: now,
          expiresAt: trialExpiresAt,
          licenseKey: key,
        });
      }

      console.log(`[Subscription] Free trial activated for user ${userId} with key ${key}, expires ${trialExpiresAt.toISOString()}`);

      return {
        success: true,
        expiresAt: trialExpiresAt,
        message: "Free trial activated successfully",
      };
    }),

  // Create a checkout URL for a plan
  createCheckout: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["prime_plus", "prime_pro"]),
        period: z.enum(["monthly", "yearly"]),
        origin: z.string().url(),
        customerName: z.string().min(1).max(100).optional(),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().max(30).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Create invoice — MyFatoorah appends ?paymentId=xxx to the CallBackUrl automatically.
      // We embed the invoiceId in successUrl so the success page can look up the license key.
      // Since invoiceId is returned by createInvoice, we use a two-step approach:
      // 1) create invoice with a temp URL, 2) return the real invoiceId to the frontend,
      //    which then navigates to /subscription/success?invoiceId=<id> after payment.
      const { invoiceId, invoiceUrl } = await createInvoice({
        userId: ctx.user.openId,
        plan: input.plan as PlanId,
        period: input.period as Period,
        customerName: input.customerName?.trim() || ctx.user.name || "Prime Fit User",
        // Use form-provided email, then user email, then a placeholder (MyFatoorah requires valid email)
        customerEmail: input.customerEmail?.trim() || ctx.user.email?.trim() || `user-${ctx.user.openId.slice(-8)}@primefit.app`,
        customerPhone: input.customerPhone?.trim() || undefined,
        successUrl: `${input.origin}/subscription/success`,
        errorUrl: `${input.origin}/subscription/error`,
      });

      // Record pending billing entry
      await database.insert(billingHistory).values({
        userId: ctx.user.openId,
        plan: input.plan,
        period: input.period,
        amount: String(PLAN_PRICES[input.plan][input.period]),
        currency: "KWD",
        status: "pending",
        invoiceId,
      });

      return { invoiceId, invoiceUrl };
    }),

  // Get license key after payment — used on the success page to show the key immediately.
  // Accepts either invoiceId (from our DB) or paymentId (appended by MyFatoorah to CallBackUrl).
  getKeyByInvoice: publicProcedure
    .input(z.object({
      invoiceId: z.string().optional(),
      paymentId: z.string().optional(),
    }).refine(d => d.invoiceId || d.paymentId, { message: "invoiceId or paymentId required" }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return { licenseKey: null };

      // Resolve invoiceId from paymentId if needed
      let resolvedInvoiceId = input.invoiceId;
      if (!resolvedInvoiceId && input.paymentId) {
        try {
          const status = await getPaymentStatusByPaymentId(input.paymentId);
          resolvedInvoiceId = status.invoiceId;
        } catch {
          return { licenseKey: null };
        }
      }
      if (!resolvedInvoiceId) return { licenseKey: null };

      // Check access codes linked to this invoice via note field
      const notePattern = `Auto-generated via MyFatoorah payment. Invoice: ${resolvedInvoiceId}`;
      const codeRows = await database
        .select()
        .from(accessCodes)
        .where(eq(accessCodes.note, notePattern))
        .limit(1);
      if (codeRows[0]) return { licenseKey: codeRows[0].code };

      // Fallback: check subscriptions table for this invoiceId
      const subRows = await database
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.invoiceId, resolvedInvoiceId))
        .limit(1);
      return { licenseKey: subRows[0]?.licenseKey ?? null };
    }),

  // Get billing history for current user
  getBillingHistory: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const rows = await database
      .select()
      .from(billingHistory)
      .where(eq(billingHistory.userId, ctx.user.openId))
      .orderBy(desc(billingHistory.createdAt))
      .limit(20);

    return rows;
  }),
});
