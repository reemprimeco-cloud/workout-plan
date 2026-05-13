import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { subscriptions, billingHistory } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { createInvoice, PLAN_PRICES, type PlanId, type Period } from "../_core/myfatoorah";

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

  // Get current user's subscription status
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const userId = ctx.user.openId;
    const rows = await database
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (rows.length === 0) {
      return { plan: "free", status: "active", expiresAt: null };
    }

    const sub = rows[0];

    // Auto-expire if past expiresAt
    if (sub.expiresAt && sub.expiresAt < new Date() && sub.status === "active") {
      await database
        .update(subscriptions)
        .set({ status: "expired" })
        .where(eq(subscriptions.userId, userId));
      return { ...sub, status: "expired" };
    }

    return sub;
  }),

  // Create a checkout URL for a plan
  createCheckout: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["prime_plus", "prime_pro"]),
        period: z.enum(["monthly", "yearly"]),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { invoiceId, invoiceUrl } = await createInvoice({
        userId: ctx.user.openId,
        plan: input.plan as PlanId,
        period: input.period as Period,
        customerName: ctx.user.name ?? "Prime Fit User",
        customerEmail: ctx.user.email ?? "",
        successUrl: `${input.origin}/subscription/success?invoiceId=${encodeURIComponent("PENDING")}`,
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
