import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb, verifyAccessCode, createAccessCode } from "../db";
import { subscriptions, billingHistory, accessCodes } from "../../drizzle/schema";
import { resendKeyEmail } from "../_core/email";
import { eq, and, desc } from "drizzle-orm";
import { createInvoice, getPaymentStatusByPaymentId, PLAN_PRICES, type PlanId, type Period } from "../_core/myfatoorah";
import { generateLicenseKey } from "../handlers/licenseUtils";
import { isOwnerEmail } from "../_core/env";

/// App Store price tiers for the iOS subscription products, in USD — the
/// web checkout (MyFatoorah) prices in KWD and is a separate ladder.
const APPLE_USD_PRICES = {
  prime_plus: { monthly: 9.99, yearly: 89.99 },
  prime_pro: { monthly: 19.99, yearly: 179.99 },
} as const;

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
          // "community" was removed: the feature isn't shipped in the iOS
          // app, and this list renders directly on its paywall — selling an
          // absent feature is an App Review 2.3.1 rejection.
          features: ["basic_tracking", "workout_guide", "ai_coach", "ai_programs", "stats"],
          prices: PLAN_PRICES.prime_plus,
        },
        {
          id: "prime_pro",
          nameEn: "Prime Pro",
          nameAr: "برايم برو",
          descriptionEn: "Everything in Plus + priority support",
          descriptionAr: "كل شيء في بلس + دعم أولوية",
          features: ["basic_tracking", "workout_guide", "ai_coach", "ai_programs", "stats", "priority_support", "custom_programs"],
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

    // If not authenticated, return none — unauthenticated users cannot access the app
    if (!ctx.user) {
      return { plan: "free", status: "none", expiresAt: null, licenseKey: null };
    }

    // The owner is never a customer of their own app. Resolved here rather than
    // by writing a lifetime row at signup because a row is overwritable — an
    // App Store or MyFatoorah webhook firing against the owner's account would
    // silently downgrade it — whereas this check runs on every read and cannot
    // be clobbered by payment state.
    if (isOwnerEmail(ctx.user.email)) {
      return { plan: "prime_pro", status: "active", expiresAt: null, licenseKey: null };
    }

    const userId = ctx.user.openId;
    const rows = await database
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (rows.length === 0) {
      // No subscription row at all — user must subscribe before accessing the app
      return { plan: "free", status: "none", expiresAt: null, licenseKey: null };
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
            period: "free_trial",
            paymentStatus: "free",
            paymentProvider: "free",
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
          period: "free_trial",
          paymentStatus: "free",
          paymentProvider: "free",
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
  // PF-006: was a publicProcedure that returned ANY customer's license key
  // for a supplied (sequential, guessable) invoiceId — an unauthenticated
  // enumeration/IDOR. Now requires a session and only returns the key when
  // the invoice belongs to the caller. The success page is reached after a
  // protected checkout, so the caller is already authenticated.
  getKeyByInvoice: protectedProcedure
    .input(z.object({
      invoiceId: z.string().optional(),
      paymentId: z.string().optional(),
    }).refine(d => d.invoiceId || d.paymentId, { message: "invoiceId or paymentId required" }))
    .query(async ({ ctx, input }) => {
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

      // Primary: the subscription row records both the invoice and the owning
      // user (userId === openId). Bind on both so only the payer can read it.
      const subRows = await database
        .select()
        .from(subscriptions)
        .where(and(
          eq(subscriptions.invoiceId, resolvedInvoiceId),
          eq(subscriptions.userId, ctx.user.openId),
        ))
        .limit(1);
      if (subRows[0]?.licenseKey) return { licenseKey: subRows[0].licenseKey };

      // Fallback: the auto-generated access code for this invoice, but only
      // when it was issued to the caller's own email.
      const userEmail = ctx.user.email?.toLowerCase().trim();
      if (userEmail) {
        const notePattern = `Auto-generated via MyFatoorah payment. Invoice: ${resolvedInvoiceId}`;
        const codeRows = await database
          .select()
          .from(accessCodes)
          .where(eq(accessCodes.note, notePattern))
          .limit(1);
        if (codeRows[0] && codeRows[0].customerEmail?.toLowerCase().trim() === userEmail) {
          return { licenseKey: codeRows[0].code };
        }
      }

      return { licenseKey: null };
    }),

  // Activate a free subscription directly (no license key required)
  // Called after login/signup when user selected the free plan on the pricing page
  // ONE free trial per account — any previous subscription row (even expired) blocks re-use
  activateFreeSubscription: protectedProcedure
    .mutation(async ({ ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const userId = ctx.user.openId;

      // Block if user already has ANY subscription row (active, expired, cancelled, etc.)
      // This prevents re-using the free trial after it expires
      const existing = await database
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (existing.length > 0) {
        const sub = existing[0];
        if (sub.status === "active" || sub.status === "trialing") {
          // Already has active subscription — return current state
          return { success: true, alreadyActive: true, plan: sub.plan, status: sub.status };
        }
        // Previously had a subscription (expired/cancelled) — block free trial re-use
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "لقد استخدمت تجربتك المجانية مسبقاً. يرجى الاشتراك للاستمرار — Your free trial has already been used. Please subscribe to continue.",
        });
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      if (existing.length > 0) {
        await database
          .update(subscriptions)
          .set({
            plan: "free",
            status: "trialing",
            period: "free_trial",
            paymentStatus: "free",
            paymentProvider: "free",
            startsAt: now,
            expiresAt,
            licenseKey: null,
            updatedAt: now,
          })
          .where(eq(subscriptions.userId, userId));
      } else {
        await database.insert(subscriptions).values({
          userId,
          plan: "free",
          status: "trialing",
          period: "free_trial",
          paymentStatus: "free",
          paymentProvider: "free",
          startsAt: now,
          expiresAt,
          licenseKey: null,
          email: ctx.user.email ?? null,
        });
      }

      console.log(`[Subscription] Free 7-day trial activated for user ${userId}, expires ${expiresAt.toISOString()}`);
      return { success: true, alreadyActive: false, plan: "free", status: "trialing", expiresAt };
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

  // Record a paid App Store subscription — called by the iOS app after
  // StoreKit 2 verifies the transaction on-device (Apple-signed JWS; that
  // verification is itself cryptographic proof of payment, so this is a
  // record/activate step, not a second payment check). Apple's own web
  // checkout equivalent (MyFatoorah) can't be used inside the iOS app per
  // App Store guidelines, so this is the paid-plan path for that client only.
  // Idempotent against StoreKit's transaction redelivery (e.g.
  // Transaction.updates replaying on relaunch) via `transactionId`.
  verifyAppleTransaction: protectedProcedure
    .input(z.object({
      plan: z.enum(["prime_plus", "prime_pro"]),
      period: z.enum(["monthly", "yearly"]),
      productId: z.string().min(1),
      transactionId: z.string().min(1),
      originalTransactionId: z.string().min(1),
      purchaseDate: z.string(),
      expiresDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const expiresAt = new Date(input.expiresDate);
      const startsAt = new Date(input.purchaseDate);
      if (Number.isNaN(expiresAt.getTime()) || Number.isNaN(startsAt.getTime())) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid purchaseDate/expiresDate" });
      }

      const userId = ctx.user.openId;

      const alreadyRecorded = await database
        .select()
        .from(billingHistory)
        .where(eq(billingHistory.invoiceId, input.transactionId))
        .limit(1);

      const existing = await database
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      const commonFields = {
        plan: input.plan,
        status: "active" as const,
        period: input.period,
        startsAt,
        expiresAt,
        paymentStatus: "paid" as const,
        paymentProvider: "apple" as const,
        transactionId: input.originalTransactionId,
        autoRenew: true,
      };

      if (existing.length > 0) {
        await database
          .update(subscriptions)
          .set({ ...commonFields, updatedAt: new Date() })
          .where(eq(subscriptions.userId, userId));
      } else {
        await database.insert(subscriptions).values({
          userId,
          ...commonFields,
          email: ctx.user.email ?? null,
        });
      }

      if (alreadyRecorded.length === 0) {
        await database.insert(billingHistory).values({
          userId,
          plan: input.plan,
          period: input.period,
          amount: String(APPLE_USD_PRICES[input.plan][input.period]),
          currency: "USD",
          status: "paid",
          invoiceId: input.transactionId,
          paymentRef: input.originalTransactionId,
        });
      }

      console.log(`[Subscription] Apple IAP verified for user ${userId}: ${input.plan}/${input.period}, expires ${expiresAt.toISOString()}`);
      return { success: true, plan: input.plan, status: "active" as const, expiresAt };
    }),
});
