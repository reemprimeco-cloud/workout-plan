/**
 * App Store Server Notifications V2 — POST /api/webhooks/app-store
 *
 * Apple's authoritative channel for subscription lifecycle events that happen
 * outside the app: renewals, expirations, cancellations, refunds, billing
 * failures and revocations. Without it, server-side subscription state only
 * ever reflects the moment of purchase — a user who cancels or is refunded
 * keeps access indefinitely, and a renewal never extends `expiresAt`.
 *
 * Trust model
 * -----------
 * The request body is `{ signedPayload: "<JWS>" }`. The JWS is signed by
 * Apple and carries its certificate chain in the `x5c` header. Verification
 * is delegated to Apple's own `SignedDataVerifier`, which validates the chain
 * up to a pinned Apple root, checks validity dates, performs OCSP revocation
 * checks, and enforces that the payload's `bundleId` (and `appAppleId` in
 * production) match this app. Anything that fails verification is rejected —
 * there is no unauthenticated path through this handler.
 *
 * The endpoint additionally **never creates** a subscription. It only updates
 * a row already keyed by `originalTransactionId`, which can only have been
 * written by `subscription.verifyAppleTransaction` after StoreKit verified the
 * purchase on-device. A notification can therefore downgrade, expire or renew
 * an existing entitlement, but can never manufacture one.
 */
import type { Request, Response } from "express";
import {
  SignedDataVerifier,
  Environment,
  NotificationTypeV2,
  Subtype,
} from "@apple/app-store-server-library";
import type {
  ResponseBodyV2DecodedPayload,
  JWSTransactionDecodedPayload,
  JWSRenewalInfoDecodedPayload,
} from "@apple/app-store-server-library";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { subscriptions, billingHistory } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { getAppleRootCertificates } from "../_core/appleRootCerts";

type SubscriptionPlan = "prime_plus" | "prime_pro";
type BillingPeriod = "monthly" | "yearly";
type SubscriptionStatus = "active" | "expired" | "cancelled" | "trialing" | "pending";

const APPLE_USD_PRICES: Record<SubscriptionPlan, Record<BillingPeriod, number>> = {
  prime_plus: { monthly: 9.99, yearly: 89.99 },
  prime_pro: { monthly: 19.99, yearly: 179.99 },
};

/**
 * Derive plan + period from Apple's product identifier.
 *
 * Matched by substring rather than an exact lookup table so the mapping holds
 * for either naming convention (`com.primefit.ios.primeplus.monthly` or
 * `prime_plus_monthly`) — the App Store product IDs are created by hand in
 * App Store Connect and cannot be renamed once registered, so the server
 * should not be brittle about their exact shape. Returns null when the
 * product is unrecognised, which is logged rather than guessed.
 */
export function planFromProductId(
  productId: string | undefined
): { plan: SubscriptionPlan; period: BillingPeriod } | null {
  if (!productId) return null;
  const id = productId.toLowerCase();
  const plan: SubscriptionPlan | null = id.includes("pro")
    ? "prime_pro"
    : id.includes("plus")
      ? "prime_plus"
      : null;
  const period: BillingPeriod | null = id.includes("year")
    ? "yearly"
    : id.includes("month")
      ? "monthly"
      : null;
  if (!plan || !period) return null;
  return { plan, period };
}

/** Verifier is keyed by environment — Sandbox and Production chain differently. */
const verifierCache = new Map<string, SignedDataVerifier>();

async function getVerifier(environment: Environment): Promise<SignedDataVerifier> {
  const key = String(environment);
  const existing = verifierCache.get(key);
  if (existing) return existing;

  const bundleId = ENV.appleNotificationsBundleId || ENV.appleBundleIds[0];
  if (!bundleId) {
    throw new Error(
      "APPLE_NOTIFICATIONS_BUNDLE_ID (or APPLE_BUNDLE_IDS) must be set to verify App Store notifications"
    );
  }
  const roots = await getAppleRootCertificates();
  // appAppleId is required by Apple's verifier for Production and must be
  // omitted for Sandbox.
  const appAppleId =
    environment === Environment.PRODUCTION && ENV.appleAppId
      ? Number(ENV.appleAppId)
      : undefined;
  if (environment === Environment.PRODUCTION && appAppleId === undefined) {
    throw new Error("APPLE_APP_ID must be set to verify Production App Store notifications");
  }

  const verifier = new SignedDataVerifier(
    roots,
    /* enableOnlineChecks */ true,
    environment,
    bundleId,
    appAppleId
  );
  verifierCache.set(key, verifier);
  return verifier;
}

/**
 * Verify the JWS against both environments.
 *
 * The environment is inside the signed payload, so it cannot be trusted
 * before verification and cannot be read to choose a verifier. Production is
 * attempted first; Sandbox is tried only if that fails, so a sandbox-signed
 * payload can never be accepted as production data. If both fail the
 * notification is rejected.
 */
async function verifyNotification(signedPayload: string): Promise<ResponseBodyV2DecodedPayload> {
  const attempts: Environment[] = [Environment.PRODUCTION, Environment.SANDBOX];
  let lastError: unknown;
  for (const environment of attempts) {
    try {
      const verifier = await getVerifier(environment);
      return await verifier.verifyAndDecodeNotification(signedPayload);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * The subscription state a notification implies.
 *
 * Two rules drive this mapping and are worth stating explicitly:
 *
 *  - **Turning off auto-renew is not a loss of access.** Apple sends
 *    DID_CHANGE_RENEWAL_STATUS/AUTO_RENEW_DISABLED at the moment the user
 *    cancels, but they have paid through the end of the period. Access is cut
 *    later, by EXPIRED. Cutting it here would remove time the user bought.
 *  - **A refund is immediate.** REFUND and REVOKE mean the money is gone or
 *    the entitlement was withdrawn, so access ends now regardless of
 *    `expiresDate`.
 */
export function resolveOutcome(
  notificationType: string | undefined,
  subtype: string | undefined
): { status?: SubscriptionStatus; autoRenew?: boolean; expireNow?: boolean; refunded?: boolean } {
  switch (notificationType) {
    case NotificationTypeV2.SUBSCRIBED:
    case NotificationTypeV2.DID_RENEW:
    case NotificationTypeV2.OFFER_REDEEMED:
    case NotificationTypeV2.RENEWAL_EXTENDED:
      return { status: "active", autoRenew: true };

    case NotificationTypeV2.DID_CHANGE_RENEWAL_STATUS:
      return subtype === Subtype.AUTO_RENEW_DISABLED
        ? { autoRenew: false }          // keeps access until expiresAt
        : { autoRenew: true };

    case NotificationTypeV2.DID_CHANGE_RENEWAL_PREF:
      // Plan up/downgrade. The new product is applied from the transaction;
      // status and access are unchanged.
      return {};

    case NotificationTypeV2.DID_FAIL_TO_RENEW:
      // In billing retry. GRACE_PERIOD means Apple still grants access, so
      // stay active; without it the subscription is effectively lapsed and
      // EXPIRED follows, but reflect the failure now.
      return subtype === Subtype.GRACE_PERIOD ? { status: "active" } : { status: "pending" };

    case NotificationTypeV2.EXPIRED:
    case NotificationTypeV2.GRACE_PERIOD_EXPIRED:
      return { status: "expired", autoRenew: false };

    case NotificationTypeV2.REFUND:
      return { status: "cancelled", autoRenew: false, expireNow: true, refunded: true };

    case NotificationTypeV2.REVOKE:
      // Family Sharing access withdrawn.
      return { status: "cancelled", autoRenew: false, expireNow: true };

    case NotificationTypeV2.REFUND_REVERSED:
      // Apple reversed a refund it previously granted — entitlement is back.
      return { status: "active" };

    default:
      // TEST, PRICE_INCREASE, CONSUMPTION_REQUEST, METADATA_UPDATE, … carry no
      // entitlement change. Acknowledged without touching the subscription.
      return {};
  }
}

export async function appStoreNotificationHandler(req: Request, res: Response) {
  const signedPayload = (req.body as { signedPayload?: unknown } | undefined)?.signedPayload;
  if (typeof signedPayload !== "string" || signedPayload.length === 0) {
    console.error("[AppStoreWebhook] Missing signedPayload");
    return res.status(400).json({ error: "missing-signed-payload" });
  }

  let payload: ResponseBodyV2DecodedPayload;
  try {
    payload = await verifyNotification(signedPayload);
  } catch (err) {
    // Fail closed. An unverifiable payload is indistinguishable from a forged
    // one, so it never reaches the database. 401 also tells Apple to retry,
    // which is what we want if this was a transient trust-anchor fetch failure.
    console.error("[AppStoreWebhook] Signature verification failed:", err);
    return res.status(401).json({ error: "verification-failed" });
  }

  const { notificationType, subtype, notificationUUID } = payload;
  console.log(
    `[AppStoreWebhook] ${notificationType}${subtype ? `/${subtype}` : ""} uuid=${notificationUUID}`
  );

  // App Store Connect's "Test" button and any notification without transaction
  // data carry no entitlement change — acknowledge so Apple marks delivery
  // successful and stops retrying.
  if (notificationType === NotificationTypeV2.TEST || !payload.data?.signedTransactionInfo) {
    return res.status(200).json({ received: true });
  }

  let transaction: JWSTransactionDecodedPayload;
  let renewal: JWSRenewalInfoDecodedPayload | undefined;
  try {
    const environment = (payload.data.environment ?? Environment.PRODUCTION) as Environment;
    const verifier = await getVerifier(environment);
    transaction = await verifier.verifyAndDecodeTransaction(payload.data.signedTransactionInfo);
    if (payload.data.signedRenewalInfo) {
      renewal = await verifier.verifyAndDecodeRenewalInfo(payload.data.signedRenewalInfo);
    }
  } catch (err) {
    console.error("[AppStoreWebhook] Failed to verify transaction info:", err);
    return res.status(401).json({ error: "transaction-verification-failed" });
  }

  const originalTransactionId = transaction.originalTransactionId;
  if (!originalTransactionId) {
    console.error("[AppStoreWebhook] Transaction has no originalTransactionId");
    return res.status(200).json({ received: true });
  }

  const db = await getDb();
  if (!db) {
    // Transient — 500 so Apple retries rather than dropping the event.
    console.error("[AppStoreWebhook] DB unavailable");
    return res.status(500).json({ error: "db-unavailable" });
  }

  // Deliberately a lookup, never an upsert: entitlements originate from a
  // StoreKit-verified purchase recorded by subscription.verifyAppleTransaction,
  // so a notification for an unknown transaction is a state we cannot safely
  // act on.
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.transactionId, originalTransactionId))
    .limit(1);

  if (existing.length === 0) {
    // 200, not an error: retrying will not make the row appear. Logged loudly
    // because a real subscriber in this state would be paying without access.
    console.error(
      `[AppStoreWebhook] No subscription for originalTransactionId=${originalTransactionId} ` +
        `(${notificationType}) — the purchase was never recorded by verifyAppleTransaction`
    );
    return res.status(200).json({ received: true, matched: false });
  }

  const subscription = existing[0];
  const outcome = resolveOutcome(notificationType, subtype);
  const mapped = planFromProductId(transaction.productId);
  if (!mapped) {
    console.error(`[AppStoreWebhook] Unrecognised productId "${transaction.productId}" — plan left unchanged`);
  }

  const updates: Partial<typeof subscriptions.$inferInsert> = { updatedAt: new Date() };

  if (outcome.status) updates.status = outcome.status;
  if (outcome.autoRenew !== undefined) updates.autoRenew = outcome.autoRenew;
  if (outcome.refunded) updates.paymentStatus = "refunded";
  if (mapped) {
    updates.plan = mapped.plan;
    updates.period = mapped.period;
  }

  if (outcome.expireNow) {
    updates.expiresAt = new Date();
  } else if (transaction.expiresDate) {
    updates.expiresAt = new Date(transaction.expiresDate);
  }

  // Apple's renewal info is authoritative for the *next* period's intent, and
  // is the only place an auto-renew change is reflected on notifications that
  // don't carry the subtype.
  if (renewal?.autoRenewStatus !== undefined && outcome.autoRenew === undefined) {
    updates.autoRenew = renewal.autoRenewStatus === 1;
  }

  await db.update(subscriptions).set(updates).where(eq(subscriptions.id, subscription.id));

  // Record renewals in billing history, keyed on Apple's per-period
  // transactionId so redelivery of the same notification cannot double-insert.
  const isPaidEvent =
    notificationType === NotificationTypeV2.DID_RENEW ||
    notificationType === NotificationTypeV2.SUBSCRIBED;
  if (isPaidEvent && mapped && transaction.transactionId) {
    const already = await db
      .select({ id: billingHistory.id })
      .from(billingHistory)
      .where(eq(billingHistory.invoiceId, transaction.transactionId))
      .limit(1);
    if (already.length === 0) {
      await db.insert(billingHistory).values({
        userId: subscription.userId,
        plan: mapped.plan,
        period: mapped.period,
        amount: String(APPLE_USD_PRICES[mapped.plan][mapped.period]),
        currency: "USD",
        status: "paid",
        invoiceId: transaction.transactionId,
        paymentRef: originalTransactionId,
      });
    }
  }

  console.log(
    `[AppStoreWebhook] Updated user=${subscription.userId} → ` +
      `${JSON.stringify({ ...updates, updatedAt: undefined })}`
  );
  return res.status(200).json({ received: true, matched: true });
}
