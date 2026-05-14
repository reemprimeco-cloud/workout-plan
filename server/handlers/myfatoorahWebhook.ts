/**
 * MyFatoorah Webhook Handler — POST /api/webhooks/myfatoorah
 *
 * On successful payment:
 *   1. Validates webhook secret
 *   2. Verifies payment with MyFatoorah API
 *   3. Finds existing license key by customer email
 *   4. Extends expiresAt on the SAME key (no new key generated)
 *   5. Emails the customer their existing key with new expiry
 *   6. Upserts the subscription record in the DB
 */
import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";
import { getPaymentStatus } from "../_core/myfatoorah";
import { getDb, getAccessCodeByEmail, extendSubscription } from "../db";
import { subscriptions, billingHistory } from "../../drizzle/schema";
import { sendRenewalEmail } from "../_core/email";

type SubscriptionPlan = "free" | "prime_plus" | "prime_pro";
type BillingPeriod = "monthly" | "yearly";

const PERIOD_DAYS: Record<BillingPeriod, number> = { monthly: 30, yearly: 365 };

function detectPlanFromAmount(amount: number): { plan: SubscriptionPlan; period: BillingPeriod } {
  if (amount >= 35) return { plan: "prime_pro",  period: "yearly"  };
  if (amount >= 20) return { plan: "prime_plus", period: "yearly"  };
  if (amount >= 4)  return { plan: "prime_pro",  period: "monthly" };
  return                   { plan: "prime_plus", period: "monthly" };
}

export async function myfatoorahWebhookHandler(req: Request, res: Response) {
  console.log("[MFWebhook] Incoming webhook");

  try {
    const secret = req.headers["webhook-secret"] ?? req.headers["x-webhook-secret"];
    if (ENV.myFatoorahWebhookSecret && secret !== ENV.myFatoorahWebhookSecret) {
      console.warn("[MFWebhook] Invalid secret");
      return res.status(401).json({ error: "invalid-secret" });
    }

    const body      = req.body;
    const invoiceId = String(body?.Data?.InvoiceId ?? body?.InvoiceId ?? "");
    if (!invoiceId) return res.status(400).json({ error: "missing-invoice-id" });

    const payment      = await getPaymentStatus(invoiceId);
    const status       = String(payment?.status ?? "");
    const userId       = String(payment?.userId ?? "");
    const email = (body?.Data?.CustomerEmail ?? body?.CustomerEmail ?? "").toLowerCase().trim();
    const amount       = Number(payment?.amount ?? 0);
    const currency     = "KWD";
    const customerName = String(body?.Data?.CustomerName ?? body?.CustomerName ?? "Customer");

    console.log(`[MFWebhook] Status: ${status} | Email: ${email || "(none)"} | Amount: ${amount}`);

    if (status !== "Paid") {
      if (["Failed", "Expired"].includes(status) && userId) {
        const db = await getDb();
        if (db) {
          const { plan, period } = detectPlanFromAmount(amount);
          await db.insert(billingHistory).values({
            userId, plan, period,
            amount: String(amount), currency,
            status: "failed",
            invoiceId,
            paymentRef: null,
          });
        }
      }
      return res.json({ ok: true, skipped: `status: ${status}` });
    }

    // Detect plan from pending subscription record or amount
    let plan: SubscriptionPlan = "prime_plus";
    let period: BillingPeriod  = "monthly";
    try {
      const db = await getDb();
      if (db) {
        const pending = await db.select().from(subscriptions)
          .where(eq(subscriptions.invoiceId, invoiceId))
          .limit(1);
        if (pending[0]?.plan && pending[0]?.period) {
          plan   = pending[0].plan   as SubscriptionPlan;
          period = pending[0].period as BillingPeriod;
        } else {
          const d = detectPlanFromAmount(amount);
          plan = d.plan; period = d.period;
        }
      }
    } catch {
      const d = detectPlanFromAmount(amount);
      plan = d.plan; period = d.period;
    }

    // Extend existing license key by email
    let licenseCode: string | null = null;
    let newExpiry:   Date   | null = null;

    if (email) {
      const existing = await getAccessCodeByEmail(email);
      if (existing) {
        const dbPlan = (period === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly";
        newExpiry   = await extendSubscription(existing.id, dbPlan);
        licenseCode = existing.code;
        console.log(`[MFWebhook] Extended key ${licenseCode} until ${newExpiry?.toDateString()}`);
        if (newExpiry) {
          await sendRenewalEmail({
            to: email,
            customerName,
            licenseKey: licenseCode,
            plan,
            period,
            newExpiresAt: newExpiry,
            orderNumber: invoiceId,
          });
        }
      } else {
        console.warn(`[MFWebhook] No license key found for ${email}`);
      }
    }

    // Upsert subscription record
    const expiry = newExpiry ?? new Date(Date.now() + PERIOD_DAYS[period] * 86400_000);
    const db = await getDb();
    if (db && userId) {
      const existingSub = await db.select().from(subscriptions)
        .where(eq(subscriptions.userId, userId)).limit(1);
      if (existingSub.length > 0) {
        await db.update(subscriptions)
          .set({ plan, status: "active", period, startsAt: new Date(), expiresAt: expiry, invoiceId, licenseKey: licenseCode })
          .where(eq(subscriptions.userId, userId));
      } else {
        await db.insert(subscriptions).values({
          userId, plan, status: "active", period,
          startsAt: new Date(), expiresAt: expiry,
          invoiceId, licenseKey: licenseCode,
        });
      }

      await db.insert(billingHistory).values({
        userId, plan, period,
        amount: String(amount), currency,
        status: "paid",
        invoiceId,
        paymentRef: String(payment?.transactionId ?? ""),
      });
    }

    return res.json({
      ok: true,
      licenseExtended: !!licenseCode,
      licenseCode,
      newExpiry: expiry.toISOString(),
      plan,
      period,
    });

  } catch (err: any) {
    console.error("[MFWebhook] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// Alias for backward compatibility
export { myfatoorahWebhookHandler as handleMyfatoorahWebhook };
