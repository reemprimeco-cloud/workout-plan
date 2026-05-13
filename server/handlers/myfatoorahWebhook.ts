import type { Request, Response } from "express";
import { getDb } from "../db";
import { subscriptions, billingHistory, accessCodes } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature, getPaymentStatus, PLAN_PRICES, type PlanId, type Period } from "../_core/myfatoorah";

interface MyfatoorahWebhookPayload {
  Event: number;         // 1 = payment success, 2 = payment failed
  CountryIso: string;
  Data: {
    InvoiceId: number;
    InvoiceStatus: "Paid" | "Failed" | "Pending";
    CustomerReference: string;  // our userId
    InvoiceValue: number;
    PaymentGateway?: string;
    ReferenceId?: string;
  };
}

export async function handleMyfatoorahWebhook(req: Request, res: Response) {
  try {
    const rawBody: Buffer = req.body;
    const signature = (req.headers["signature"] as string) || "";

    // Verify signature if provided
    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      console.warn("[MyFatoorah Webhook] Invalid signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const payload: MyfatoorahWebhookPayload = JSON.parse(rawBody.toString());
    console.log("[MyFatoorah Webhook] Event:", payload.Event, "InvoiceId:", payload.Data?.InvoiceId);

    const invoiceId = String(payload.Data?.InvoiceId);
    const userId = payload.Data?.CustomerReference;

    if (!invoiceId || !userId) {
      res.status(400).json({ error: "Missing invoiceId or userId" });
      return;
    }

    // Fetch full payment status from MyFatoorah to confirm
    const paymentStatus = await getPaymentStatus(invoiceId);
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    if (paymentStatus.status === "Paid") {
      const { plan, period } = resolvePlanFromAmount(paymentStatus.amount);

      const now = new Date();
      const expiresAt = new Date(now);
      if (period === "yearly") {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // Upsert subscription
      const existing = await database
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      const linkedLicenseKey = existing.length > 0 ? existing[0].licenseKey : null;

      if (existing.length > 0) {
        await database
          .update(subscriptions)
          .set({ plan, period, status: "active", startsAt: now, expiresAt, invoiceId, updatedAt: now })
          .where(eq(subscriptions.userId, userId));
      } else {
        await database.insert(subscriptions).values({
          userId, plan, period, status: "active", startsAt: now, expiresAt, invoiceId,
        });
      }

      // Re-activate the linked license key if user had a free trial key
      if (linkedLicenseKey) {
        await database
          .update(accessCodes)
          .set({ isActive: true })
          .where(eq(accessCodes.code, linkedLicenseKey));
        console.log(`[MyFatoorah Webhook] Re-activated license key ${linkedLicenseKey} after paid subscription for user ${userId}`);
      }

      // Record billing history
      await database.insert(billingHistory).values({
        userId,
        plan,
        period,
        amount: String(paymentStatus.amount),
        currency: "KWD",
        status: "paid",
        invoiceId,
        paymentRef: paymentStatus.transactionId,
      });

      console.log(
        `[MyFatoorah Webhook] ✅ Subscription activated: user=${userId} plan=${plan} period=${period} expires=${expiresAt.toISOString()}`
      );
    } else if (paymentStatus.status === "Failed") {
      const { plan, period } = resolvePlanFromAmount(paymentStatus.amount);
      await database.insert(billingHistory).values({
        userId,
        plan,
        period,
        amount: String(paymentStatus.amount),
        currency: "KWD",
        status: "failed",
        invoiceId,
      });
      console.log(`[MyFatoorah Webhook] ❌ Payment failed: user=${userId} invoiceId=${invoiceId}`);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[MyFatoorah Webhook] Error:", err);
    res.status(500).json({ error: "Internal server error", detail: String(err) });
  }
}

function resolvePlanFromAmount(amount: number): { plan: PlanId; period: Period } {
  for (const [planKey, prices] of Object.entries(PLAN_PRICES)) {
    for (const [periodKey, price] of Object.entries(prices)) {
      if (Math.abs(price - amount) < 0.01) {
        return { plan: planKey as PlanId, period: periodKey as Period };
      }
    }
  }
  return { plan: "prime_plus", period: "monthly" };
}
