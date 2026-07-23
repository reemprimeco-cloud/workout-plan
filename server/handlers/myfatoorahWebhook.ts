/**
 * MyFatoorah Webhook Handler — POST /api/webhooks/myfatoorah
 *
 * On successful payment:
 *   1. Validates webhook secret
 *   2. Verifies payment with MyFatoorah API
 *   3a. NEW customer → auto-generates PRIME-XXXX-XXXX key, saves to DB, emails it
 *   3b. RETURNING customer → extends existing key expiry, emails renewal
 *   4. Upserts the subscription record in the DB
 */
import type { Request, Response } from "express";
import { createHash, timingSafeEqual } from "crypto";
import { eq, and, or } from "drizzle-orm";
import { ENV } from "../_core/env";
import { getPaymentStatus } from "../_core/myfatoorah";
import { getDb, getAccessCodeByEmail, extendSubscription, createAccessCode, getUserByOpenId } from "../db";
import { subscriptions, billingHistory } from "../../drizzle/schema";
import { sendRenewalEmail } from "../_core/email";
import { sendLicenseEmail } from "../_core/email";
import { generateLicenseKey } from "./licenseUtils";

type SubscriptionPlan = "free" | "prime_plus" | "prime_pro";
type BillingPeriod = "monthly" | "yearly";

/**
 * Constant-time string comparison (PF-004). SHA-256 both sides to a fixed
 * 32-byte length so timingSafeEqual never throws on length mismatch and no
 * length information leaks via an early return.
 */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

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
    // ── Authenticate the caller (PF-004) ──────────────────────────────────
    // Fail CLOSED: if no webhook secret is configured we cannot authenticate
    // the request, so reject rather than accept every caller (the previous
    // `ENV.key && secret !== ENV.key` guard skipped verification entirely
    // when the env var was unset). The comparison is constant-time.
    if (!ENV.myfatoorahWebhookKey) {
      console.error("[MFWebhook] MYFATOORAH_WEBHOOK_SECRET not configured — rejecting webhook");
      return res.status(500).json({ error: "webhook-not-configured" });
    }
    const secretHeader = req.headers["webhook-secret"] ?? req.headers["x-webhook-secret"];
    const providedSecret = Array.isArray(secretHeader) ? secretHeader[0] : secretHeader;
    if (!providedSecret || !safeEqual(providedSecret, ENV.myfatoorahWebhookKey)) {
      console.warn("[MFWebhook] Invalid secret");
      return res.status(401).json({ error: "invalid-secret" });
    }

    const body      = req.body;
    const invoiceId = String(body?.Data?.InvoiceId ?? body?.InvoiceId ?? "");
    if (!invoiceId) return res.status(400).json({ error: "missing-invoice-id" });

    const payment      = await getPaymentStatus(invoiceId);
    const status       = String(payment?.status ?? "");
    const userId       = String(payment?.userId ?? "");
    // PF-005: the recipient of the license key must be derived from the
    // VERIFIED payment identity (CustomerReference === the paying user's
    // openId, returned by getPaymentStatus), not from the attacker-
    // controllable webhook body. Fall back to the body email only when the
    // account has no email on file, and log any discrepancy.
    const bodyEmail = (body?.Data?.CustomerEmail ?? body?.CustomerEmail ?? "").toLowerCase().trim();
    let email = bodyEmail;
    if (userId) {
      const payingUser = await getUserByOpenId(userId);
      const trustedEmail = payingUser?.email?.toLowerCase().trim();
      if (trustedEmail) {
        if (bodyEmail && bodyEmail !== trustedEmail) {
          console.warn("[MFWebhook] Webhook body email differs from account email — using verified account email");
        }
        email = trustedEmail;
      }
    }
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

    // ── Idempotency guard (PF-013) ────────────────────────────────────────
    // MyFatoorah retries webhooks on any non-2xx (and sometimes on 2xx). A
    // "paid" billingHistory row for this invoice means we already processed
    // it; re-processing would extend a returning customer's key a second time
    // and insert a duplicate paid billing row. Skip idempotently.
    {
      const db = await getDb();
      if (db) {
        const alreadyPaid = await db.select().from(billingHistory)
          .where(and(eq(billingHistory.invoiceId, invoiceId), eq(billingHistory.status, "paid")))
          .limit(1);
        if (alreadyPaid.length > 0) {
          console.log(`[MFWebhook] Invoice ${invoiceId} already processed — idempotent skip`);
          return res.json({ ok: true, idempotent: true });
        }
      }
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

    // Extend existing key OR auto-generate a new one for new customers
    let licenseCode: string | null = null;
    let newExpiry:   Date   | null = null;

    if (email) {
      const existing = await getAccessCodeByEmail(email);
      if (existing) {
        // Returning customer — extend their existing key
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
        // New customer — auto-generate a fresh PRIME-XXXX-XXXX license key
        const newKey = generateLicenseKey();
        const expiryDays = period === "yearly" ? 365 : 30;
        const keyExpiry = new Date(Date.now() + expiryDays * 86400_000);
        await createAccessCode({
          code: newKey,
          customerName,
          customerEmail: email,
          note: `Auto-generated via MyFatoorah payment. Invoice: ${invoiceId}`,
          isActive: true,
          expiresAt: keyExpiry,
        });
        licenseCode = newKey;
        newExpiry   = keyExpiry;
        console.log(`[MFWebhook] Generated new key ${licenseCode} for ${email}, expires ${keyExpiry.toDateString()}`);
        // Email the new license key to the customer
        await sendLicenseEmail({
          to: email,
          customerName,
          licenseKey: licenseCode,
          orderNumber: invoiceId,
        });
      }
    }

    // Upsert subscription record
    const expiry = newExpiry ?? new Date(Date.now() + PERIOD_DAYS[period] * 86400_000);
    const db = await getDb();
    if (db && userId) {
      // PF-013: the subscription upsert and the billing delete+insert are a
      // single logical unit — wrap them in a transaction so a partial failure
      // can't leave the subscription updated without a paid billing record
      // (or vice versa). NOTE: the access-code create/extend + customer email
      // above still run outside this transaction; folding them in (and sending
      // the email strictly after commit) is a follow-up that needs DB testing.
      await db.transaction(async (tx) => {
        const existingSub = await tx.select().from(subscriptions)
          .where(eq(subscriptions.userId, userId)).limit(1);
        if (existingSub.length > 0) {
          await tx.update(subscriptions)
            .set({
              plan,
              status: "active",
              period,
              paymentStatus: "paid",
              paymentProvider: "myfatoorah",
              startsAt: new Date(),
              expiresAt: expiry,
              invoiceId,
              licenseKey: licenseCode,
              email: email || existingSub[0].email,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.userId, userId));
        } else {
          await tx.insert(subscriptions).values({
            userId,
            plan,
            status: "active",
            period,
            paymentStatus: "paid",
            paymentProvider: "myfatoorah",
            startsAt: new Date(),
            expiresAt: expiry,
            invoiceId,
            licenseKey: licenseCode,
            email: email || null,
          });
        }

        // Remove any pending records for the same user or invoice before inserting paid record
        await tx.delete(billingHistory)
          .where(
            and(
              eq(billingHistory.status, 'pending'),
              or(
                eq(billingHistory.userId, userId),
                eq(billingHistory.invoiceId, invoiceId)
              )
            )
          );

        await tx.insert(billingHistory).values({
          userId, plan, period,
          amount: String(amount), currency,
          status: "paid",
          invoiceId,
          paymentRef: String(payment?.transactionId ?? ""),
        });
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
    // PF-015: log details server-side, return a generic body (don't leak
    // internals / stack traces to the caller).
    console.error("[MFWebhook] Error:", err);
    return res.status(500).json({ error: "internal-error" });
  }
}

// Alias for backward compatibility
export { myfatoorahWebhookHandler as handleMyfatoorahWebhook };
