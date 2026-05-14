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
import { ENV } from "../_core/env";
import { createAccessCode, getAccessCodeByOrderId } from "../db";
import { sendLicenseEmail } from "../_core/email";
import { generateLicenseKey, detectPlan, planToExpiry, hasPrimeFitProduct, PRIME_FIT_PRODUCT_ID } from "./licenseUtils";

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


export async function wooCommerceWebhookHandler(req: Request, res: Response) {
  // ── Step 0: Log everything incoming for debugging ─────────────────────────
  console.log("[WooWebhook] Incoming request");
  console.log("[WooWebhook] Headers:", JSON.stringify({
    topic: req.headers["x-wc-webhook-topic"],
    source: req.headers["x-wc-webhook-source"],
    signature: req.headers["x-wc-webhook-signature"] ? "present" : "missing",
    delivery: req.headers["x-wc-webhook-delivery-id"],
  }));
  console.log("[WooWebhook] Body status:", req.body ? "present" : "empty");

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

    console.log("[WooWebhook] Topic:", topic, "| Order status:", order?.status, "| Order ID:", order?.id);

    // ── 2. Only handle order events ────────────────────────────────────────
    if (!topic.startsWith("order.")) {
      return res.json({ ok: true, skipped: "not-an-order-event" });
    }

    const status: string = order?.status ?? "";
    const orderId: number = order?.id ?? 0;

    if (!TRIGGER_STATUSES.has(status)) {
      return res.json({ ok: true, skipped: `status-not-triggered (${status})` });
    }

    // ── Only process Prime Fit orders ──────────────────────────────────────
    if (!hasPrimeFitProduct(order)) {
      console.log(`[WooWebhook] Order #${orderId} does not contain Prime Fit product — skipping`);
      return res.json({ ok: true, skipped: "not-prime-fit-product" });
    }

    if (!orderId) {
      return res.status(400).json({ error: "missing-order-id" });
    }

    // ── 3. Extract customer info ────────────────────────────────────────────
    const billing = order?.billing ?? {};
    const customerEmail: string = billing.email ?? order?.customer?.email ?? "";
    const customerName: string = [billing.first_name, billing.last_name]
      .filter(Boolean).join(" ") || order?.customer?.username || "Customer";

    console.log(`[WooWebhook] Customer: ${customerName} <${customerEmail}>`);

    if (!customerEmail) {
      console.warn(`[WooWebhook] Order #${orderId} has no customer email`);
      return res.status(400).json({ error: "missing-customer-email" });
    }

    // ── 4. Idempotency check ───────────────────────────────────────────────
    let existing = null;
    try {
      existing = await getAccessCodeByOrderId(orderId);
    } catch (dbErr: any) {
      // orderId column may not exist yet if migration hasn't run
      console.warn("[WooWebhook] Idempotency check failed (migration pending?):", dbErr.message);
    }

    if (existing) {
      console.log(`[WooWebhook] Order #${orderId} already has code — skipping`);
      return res.json({ ok: true, skipped: "already-issued", code: existing.code });
    }

    // ── 5. Generate & save license key ─────────────────────────────────────
    const licenseKey = generateLicenseKey();
    const plan       = detectPlan(order?.line_items ?? []);
    const expiresAt  = planToExpiry(plan);
    console.log(`[WooWebhook] Plan: ${plan} | Expires: ${expiresAt?.toISOString() ?? "never"}`);

    try {
      await createAccessCode({
        code: licenseKey, customerName, customerEmail,
        note: `Auto-generated for WooCommerce order #${orderId} (status: ${status}) — plan: ${plan}`,
        isActive: true, orderId, expiresAt,
      });
    } catch (dbErr: any) {
      console.warn("[WooWebhook] Insert with orderId failed, retrying without:", dbErr.message);
      await createAccessCode({
        code: licenseKey, customerName, customerEmail,
        note: `Auto-generated for WooCommerce order #${orderId} (status: ${status}) — plan: ${plan}`,
        isActive: true, expiresAt,
      });
    }

    console.log(`[WooWebhook] ✅ License ${licenseKey} saved for order #${orderId}`);

    // ── 6. Email the license key ───────────────────────────────────────────
    const emailSent = await sendLicenseEmail({
      to: customerEmail,
      customerName,
      licenseKey,
      orderNumber: orderId,
    });

    console.log(`[WooWebhook] Email sent: ${emailSent}`);

    return res.json({ ok: true, orderId, licenseKey, emailSent, customerEmail });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("[WooWebhook] ❌ Unhandled error:", error.message, error.stack);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }
}
