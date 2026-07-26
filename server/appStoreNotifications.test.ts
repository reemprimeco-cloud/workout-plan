/**
 * Tests for the App Store Server Notifications V2 handler.
 *
 * Focus is the two pieces of judgement the handler encodes, since the
 * signature verification itself is Apple's library and is exercised there:
 *
 *  - `planFromProductId`, which must survive either App Store Connect naming
 *    convention because product IDs cannot be renamed once registered.
 *  - the entitlement outcome mapping, where the costly mistakes are cutting
 *    access early on a cancellation (the user paid through the period) or
 *    leaving access on after a refund.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("../drizzle/schema", () => ({
  subscriptions: { id: "id", transactionId: "transactionId" },
  billingHistory: { id: "id", invoiceId: "invoiceId" },
}));
vi.mock("./_core/appleRootCerts", () => ({
  getAppleRootCertificates: vi.fn(async () => [Buffer.from("root")]),
}));

import { NotificationTypeV2, Subtype } from "@apple/app-store-server-library";
import { planFromProductId, resolveOutcome } from "./handlers/appStoreNotifications";

describe("planFromProductId", () => {
  it("maps reverse-DNS product IDs", () => {
    expect(planFromProductId("com.primefit.ios.primeplus.monthly")).toEqual({
      plan: "prime_plus",
      period: "monthly",
    });
    expect(planFromProductId("com.primefit.ios.primepro.yearly")).toEqual({
      plan: "prime_pro",
      period: "yearly",
    });
  });

  it("maps snake_case product IDs", () => {
    // The same app may have been registered with either convention in App
    // Store Connect, and a registered product ID can never be renamed.
    expect(planFromProductId("prime_plus_yearly")).toEqual({
      plan: "prime_plus",
      period: "yearly",
    });
    expect(planFromProductId("prime_pro_monthly")).toEqual({
      plan: "prime_pro",
      period: "monthly",
    });
  });

  it("is case-insensitive", () => {
    expect(planFromProductId("PrimePro.Monthly")).toEqual({
      plan: "prime_pro",
      period: "monthly",
    });
  });

  it("prefers pro over plus so 'pro' is never read as 'plus'", () => {
    expect(planFromProductId("prime_pro_monthly")?.plan).toBe("prime_pro");
  });

  it("returns null rather than guessing on unknown or partial products", () => {
    expect(planFromProductId(undefined)).toBeNull();
    expect(planFromProductId("")).toBeNull();
    expect(planFromProductId("com.primefit.ios.lifetime")).toBeNull();
    // Recognisable plan but no period — guessing a period would silently
    // bill-classify a yearly plan as monthly in billing history.
    expect(planFromProductId("prime_plus")).toBeNull();
  });
});

describe("resolveOutcome", () => {
  it("grants access on subscribe and renew", () => {
    expect(resolveOutcome(NotificationTypeV2.SUBSCRIBED, Subtype.INITIAL_BUY)).toMatchObject({
      status: "active",
      autoRenew: true,
    });
    expect(resolveOutcome(NotificationTypeV2.DID_RENEW, undefined)).toMatchObject({
      status: "active",
      autoRenew: true,
    });
  });

  it("does NOT cut access when the user turns auto-renew off", () => {
    // The costly mistake: Apple sends this the moment someone cancels, but
    // they have paid through the end of the period. Revoking here would take
    // away time they bought. Access ends later, on EXPIRED.
    const outcome = resolveOutcome(
      NotificationTypeV2.DID_CHANGE_RENEWAL_STATUS,
      Subtype.AUTO_RENEW_DISABLED
    );
    expect(outcome.autoRenew).toBe(false);
    expect(outcome.status).toBeUndefined();
    expect(outcome.expireNow).toBeUndefined();
  });

  it("re-arms auto-renew when the user turns it back on", () => {
    expect(
      resolveOutcome(NotificationTypeV2.DID_CHANGE_RENEWAL_STATUS, Subtype.AUTO_RENEW_ENABLED)
    ).toMatchObject({ autoRenew: true });
  });

  it("revokes access immediately on refund, ignoring expiresDate", () => {
    const outcome = resolveOutcome(NotificationTypeV2.REFUND, undefined);
    expect(outcome).toMatchObject({
      status: "cancelled",
      autoRenew: false,
      expireNow: true,
      refunded: true,
    });
  });

  it("revokes access immediately when an entitlement is revoked", () => {
    expect(resolveOutcome(NotificationTypeV2.REVOKE, undefined)).toMatchObject({
      status: "cancelled",
      expireNow: true,
    });
  });

  it("expires on EXPIRED and GRACE_PERIOD_EXPIRED", () => {
    for (const type of [NotificationTypeV2.EXPIRED, NotificationTypeV2.GRACE_PERIOD_EXPIRED]) {
      expect(resolveOutcome(type, undefined)).toMatchObject({
        status: "expired",
        autoRenew: false,
      });
    }
  });

  it("keeps access during a billing-retry grace period", () => {
    expect(
      resolveOutcome(NotificationTypeV2.DID_FAIL_TO_RENEW, Subtype.GRACE_PERIOD)
    ).toMatchObject({ status: "active" });
  });

  it("marks a billing failure without grace period as pending, not expired", () => {
    // Apple sends EXPIRED separately once retries are exhausted; pre-empting
    // it here would cut off a user whose payment may still succeed.
    expect(resolveOutcome(NotificationTypeV2.DID_FAIL_TO_RENEW, undefined)).toMatchObject({
      status: "pending",
    });
  });

  it("restores access when Apple reverses a refund", () => {
    expect(resolveOutcome(NotificationTypeV2.REFUND_REVERSED, undefined)).toMatchObject({
      status: "active",
    });
  });

  it("leaves entitlement untouched for non-entitlement notifications", () => {
    for (const type of [
      NotificationTypeV2.TEST,
      NotificationTypeV2.PRICE_INCREASE,
      NotificationTypeV2.CONSUMPTION_REQUEST,
      NotificationTypeV2.METADATA_UPDATE,
      NotificationTypeV2.DID_CHANGE_RENEWAL_PREF,
    ]) {
      expect(resolveOutcome(type, undefined)).toEqual({});
    }
  });

  it("ignores unknown future notification types rather than changing state", () => {
    expect(resolveOutcome("SOME_FUTURE_TYPE", undefined)).toEqual({});
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});
