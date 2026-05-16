/**
 * Subscription Router
 * Handles plan info, checkout creation, subscription status, billing history.
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getSubscription, upsertSubscription, getBillingHistory,
  PLANS, isSubscriptionActive, planHasFeature, getDb,
} from "../db";
import { like } from "drizzle-orm";
import { accessCodes } from "../../drizzle/schema";
import { createInvoice } from "../_core/myfatoorah";
import { createAccessCode, getAccessCodeByEmail } from "../db";  // eslint-disable-line
import { generateLicenseKey } from "../handlers/licenseUtils";
import { sendLicenseEmail } from "../_core/email";
import { ENV } from "../_core/env";

export const subscriptionRouter = router({

  /** Start a 7-day free trial — generates a real license key, no payment needed */
  startFreeTrial: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.openId ?? String(ctx.user.id);
    const email  = ctx.user.email ?? "";
    const name   = ctx.user.name  ?? "Prime Fit User";

    // Check if already had a trial (has a license key with plan='monthly' and usedAt set)
    if (email) {
      const existing = await getAccessCodeByEmail(email);
      if (existing?.usedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "لقد استخدمت تجربتك المجانية مسبقاً — You have already used your free trial",
        });
      }
    }

    // Generate 7-day license key
    const licenseKey = generateLicenseKey();
    const expiresAt  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await createAccessCode({
      code:          licenseKey,
      customerName:  name,
      customerEmail: email || null,
      note:          `Free trial — auto-generated for user ${userId}`,
      isActive:      true,
      expiresAt,
    });

    // Send email with the key
    if (email) {
      await sendLicenseEmail({
        to:          email,
        customerName: name,
        licenseKey,
        orderNumber: "TRIAL",
      }).catch(() => {}); // non-fatal
    }

    return { success: true, licenseKey, expiresAt: expiresAt.toISOString() };
  }),

  /** Get all available plans */
  getPlans: publicProcedure.query(() => {
    return Object.values(PLANS).map(p => ({
      id:           p.id,
      nameAr:       p.nameAr,
      nameEn:       p.nameEn,
      priceMonthly: p.priceMonthly,
      priceYearly:  p.priceYearly,
      currency:     p.currency,
      features:     p.features,
    }));
  }),

  /** Get current user's subscription status */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.openId ?? String(ctx.user.id);

    // Admin users get full prime_pro access automatically
    if (ctx.user.role === 'admin') {
      return {
        plan:      "prime_pro" as const,
        status:    "active" as const,
        isActive:  true,
        isTrial:   false,
        expiresAt: null,
        features:  PLANS.prime_pro.features,
        daysLeft:  null,
      };
    }

    const sub    = await getSubscription(userId);

    if (!sub || !isSubscriptionActive(sub)) {
      return {
        plan:      "free" as const,
        status:    "active" as const,
        isActive:  true,
        isTrial:   false,
        expiresAt: null,
        features:  PLANS.free.features,
        daysLeft:  null,
      };
    }

    const expiresAt = sub.expiresAt ? new Date(sub.expiresAt) : null;
    const daysLeft  = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400_000) : null;
    const isTrial   = sub.status === "trialing";

    return {
      plan:      sub.plan,
      status:    sub.status,
      isActive:  true,
      isTrial,
      period:    sub.period,
      expiresAt: sub.expiresAt,
      daysLeft,
      features:  PLANS[sub.plan]?.features ?? PLANS.free.features,
    };
  }),

  /** Create a MyFatoorah checkout and return the payment URL */
  createCheckout: protectedProcedure
    .input(z.object({
      plan:   z.enum(["prime_plus", "prime_pro"]),
      period: z.enum(["monthly", "yearly"]),
      lang:   z.enum(["ar", "en"]).default("ar"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ENV.myfatoorahApiKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payment gateway not configured" });
      }

      const userId       = ctx.user.openId ?? String(ctx.user.id);
      const customerName  = ctx.user.name  ?? "Prime Fit User";
      const customerEmail = ctx.user.email ?? "";

      if (!customerEmail) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email required for payment. Please update your profile." });
      }

      const baseUrl    = ENV.isProduction ? `https://${ENV.appDomain}` : "http://localhost:5000";
      const successUrl = `${baseUrl}/subscription/success`;
      const errorUrl   = `${baseUrl}/subscription/error`;

      // Create a pending subscription record so webhook can find the plan
      await upsertSubscription({
        user_id:    userId,
        plan:       input.plan,
        status:     "pending",
        period:     input.period,
        starts_at:  new Date().toISOString(),
        expires_at: null,
        invoice_id: null,
        trial_ends_at: null,
      });

      const invoice = await createInvoice({
        userId,
        plan:        input.plan,
        period:      input.period,
        customerName,
        customerEmail,
        successUrl,
        errorUrl,
      });

      // Save invoice ID to pending subscription
      await upsertSubscription({
        user_id:    userId,
        plan:       input.plan,
        status:     "pending",
        period:     input.period,
        starts_at:  new Date().toISOString(),
        expires_at: null,
        invoice_id: invoice.invoiceId,
        trial_ends_at: null,
      });

      return { paymentUrl: invoice.invoiceUrl ?? (invoice as any).paymentUrl ?? "", invoiceId: invoice.invoiceId };
    }),

  /** Get billing history */
  getBillingHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.openId ?? String(ctx.user.id);
    return getBillingHistory(userId);
  }),

  /** Poll for license key after payment — used by SubscriptionResult page */
  getKeyByInvoice: publicProcedure
    .input(z.object({ paymentId: z.string().optional(), invoiceId: z.string().optional() }))
    .query(async ({ input }) => {
      if (!input.paymentId && !input.invoiceId) return { licenseKey: null };
      const db = await getDb();
      if (!db) return { licenseKey: null };
      // Look up access code by note containing the invoiceId
      const results = await db.select().from(accessCodes)
        .where(like(accessCodes.note, `%${input.invoiceId ?? input.paymentId}%`))
        .limit(1);
      return { licenseKey: results[0]?.code ?? null };
    }),

  /** Check if user has access to a specific feature */
  checkFeature: protectedProcedure
    .input(z.object({ feature: z.enum(["aiCoach", "advancedAnalytics", "challenges", "premiumCommunity"]) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.openId ?? String(ctx.user.id);
      const sub    = await getSubscription(userId);
      if (!sub || !isSubscriptionActive(sub)) return { hasAccess: false, plan: "free" };
      return { hasAccess: planHasFeature(sub.plan, input.feature), plan: sub.plan };
    }),
});
