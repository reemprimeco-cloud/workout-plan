/**
 * WooCommerce Webhook Handler — POST /api/webhooks/woocommerce
 *
 * Triggered by WooCommerce when an order status changes to:
 *   - "processing"  (payment received, fulfillment pending)
 *   - "completed"   (order fully fulfilled)
 *
 * On trigger:
 *   1. Validates the HMAC-SHA256 signature from WooCommerce
 *   2. Checks the order status
 *   3. Checks if a code was already issued for this order (idempotent)
 *   4. Auto-generates a PRIME-XXXX-XXXX license key
 *   5. Saves it to the access_codes table
 *   6. Emails the code to the customer instantly
 */

import type { Request, Response } from "express";
import crypto from "crypto";
import { nanoid } from "nanoid";
import { ENV } from "../_core/env";
import { createAccessCode, getAccessCodeByOrderId } from "../db";
import { sendLicenseEmail } from "../_core/email";

// Statuses that trigger license delivery
const TRIGGER_STATUSES = new Set(["processing", "completed"]);

/** Verify WooCommerce HMAC-SHA256 webhook signature */
function verifyWooSignature(rawBody: Buffer, signature: string): boolean {
  if (!ENV.wooWebhookSecret) {
    console.warn("[WooWebhook] WOO_WEBHOOK_SECRET not set — skipping signature check");
    return true; // Allow in dev; enforce in prod
  }
  const expected = crypto
    .createHmac("sha256", ENV.wooWebhookSecret)
    .update(rawBody)
    .digest("base64");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

/** Generate a license key in format PRIME-XXXX-XXXX */
function generateLicenseKey(): string {
  const part = () => nanoid(4).toUpperCase().replace(/[^A-Z0-9]/g, "X").padEnd(4, "X");
  return `PRIME-${part()}-${part()}`;
}

export async function wooCommerceWebhookHandler(req: Request, res: Response) {
  try {
    // ── 1. Signature verification ───────────────────────────────────────────
    const signature = req.headers["x-wc-webhook-signature"] as string ?? "";
    const rawBody: Buffer = (req as any).rawBody ?? Buffer.from(JSON.stringify(req.body));

    if (!verifyWooSignature(rawBody, signature)) {
      console.warn("[WooWebhook] Invalid signature — rejecting request");
      return res.status(401).json({ error: "invalid-signature" });
    }

    const topic = req.headers["x-wc-webhook-topic"] as string ?? "";
    const order = req.body;

    // ── 2. Only handle order.created / order.updated events ────────────────
    if (!topic.startsWith("order.")) {
      return res.json({ ok: true, skipped: "not-an-order-event" });
    }

    const status: string = order?.status ?? "";
    const orderId: number = order?.id ?? 0;

    if (!TRIGGER_STATUSES.has(status)) {
      return res.json({ ok: true, skipped: `status-not-triggered (${status})` });
    }

    if (!orderId) {
      return res.status(400).json({ error: "missing-order-id" });
    }

    // ── 3. Extract customer info ────────────────────────────────────────────
    const billing = order?.billing ?? {};
    const customerEmail: string = billing.email ?? order?.customer?.email ?? "";
    const customerName: string = [billing.first_name, billing.last_name]
      .filter(Boolean).join(" ") || order?.customer?.username || "Customer";

    if (!customerEmail) {
      console.warn(`[WooWebhook] Order #${orderId} has no customer email — cannot deliver license`);
      return res.status(400).json({ error: "missing-customer-email" });
    }

    // ── 4. Idempotency — don't issue duplicate codes for same order ─────────
    const existing = await getAccessCodeByOrderId(orderId);
    if (existing) {
      console.log(`[WooWebhook] Order #${orderId} already has code ${existing.code} — skipping`);
      return res.json({ ok: true, skipped: "already-issued", code: existing.code });
    }

    // ── 5. Generate & save license key ─────────────────────────────────────
    const licenseKey = generateLicenseKey();

    await createAccessCode({
      code: licenseKey,
      customerName,
      customerEmail,
      note: `Auto-generated for WooCommerce order #${orderId} (status: ${status})`,
      isActive: true,
      orderId, // stored for idempotency
    });

    console.log(`[WooWebhook] ✅ License ${licenseKey} issued for order #${orderId} (${customerEmail})`);

    // ── 6. Email the license key to the customer ───────────────────────────
    const emailSent = await sendLicenseEmail({
      to: customerEmail,
      customerName,
      licenseKey,
      orderNumber: orderId,
    });

    return res.json({
      ok: true,
      orderId,
      licenseKey,
      emailSent,
      customerEmail,
    });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("[WooWebhook] Error:", error.message);
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
