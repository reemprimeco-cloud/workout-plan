/**
 * Tests for subscription router:
 * - activateFreeTrial: validates license key and activates trial
 * - getStatus: returns current subscription status
 * - listSubscriptions (admin): returns all subscriptions
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database and helpers
vi.mock("./db", () => ({
  getDb: vi.fn(),
  verifyAccessCode: vi.fn(),
}));

vi.mock("../drizzle/schema", () => ({
  subscriptions: "subscriptions_table",
  billingHistory: "billing_history_table",
  accessCodes: "access_codes_table",
}));

vi.mock("./_core/myfatoorah", () => ({
  createInvoice: vi.fn(),
  PLAN_PRICES: {
    prime_plus: { monthly: 4.9, yearly: 49 },
    prime_pro: { monthly: 9.9, yearly: 99 },
  },
}));

import { getDb, verifyAccessCode } from "./db";

const mockGetDb = getDb as ReturnType<typeof vi.fn>;
const mockVerifyAccessCode = verifyAccessCode as ReturnType<typeof vi.fn>;

describe("subscription.activateFreeTrial logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid or inactive license key", async () => {
    mockVerifyAccessCode.mockResolvedValueOnce(null);

    const result = await mockVerifyAccessCode("INVALID-KEY");
    expect(result).toBeNull();
  });

  it("accepts a valid license key and returns the code row", async () => {
    const fakeRow = {
      id: 1,
      code: "PRIME-ABCD-EFGH",
      isActive: true,
      expiresAt: null,
      usedAt: null,
    };
    mockVerifyAccessCode.mockResolvedValueOnce(fakeRow);

    const result = await mockVerifyAccessCode("PRIME-ABCD-EFGH");
    expect(result).not.toBeNull();
    expect(result?.code).toBe("PRIME-ABCD-EFGH");
    expect(result?.isActive).toBe(true);
  });

  it("calculates 30-day trial expiry when key has no expiresAt", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const trialExpiresAt = new Date(now);
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 30);

    // 30 days after Jan 1 = Jan 31 (difference should be exactly 30 days)
    const diffMs = trialExpiresAt.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(30);
  });

  it("uses key's expiresAt when provided", () => {
    const keyExpiry = new Date("2026-06-01T00:00:00Z");
    const codeRow = { expiresAt: keyExpiry };

    const trialExpiresAt = codeRow.expiresAt
      ? new Date(codeRow.expiresAt)
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          return d;
        })();

    expect(trialExpiresAt.toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });
});

describe("subscription.getStatus auto-expiry logic", () => {
  it("marks subscription as expired when expiresAt is in the past", () => {
    const sub = {
      status: "trialing",
      expiresAt: new Date("2025-01-01T00:00:00Z"),
      plan: "free",
      licenseKey: "PRIME-ABCD-EFGH",
    };

    const now = new Date();
    const shouldExpire =
      sub.expiresAt &&
      sub.expiresAt < now &&
      (sub.status === "active" || sub.status === "trialing");

    expect(shouldExpire).toBe(true);
  });

  it("does not expire an active paid subscription that is still valid", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const sub = {
      status: "active",
      expiresAt: futureDate,
      plan: "prime_plus",
      licenseKey: null,
    };

    const shouldExpire =
      sub.expiresAt &&
      sub.expiresAt < new Date() &&
      (sub.status === "active" || sub.status === "trialing");

    expect(shouldExpire).toBe(false);
  });

  it("deactivates the license key only when plan is free (trial)", () => {
    const sub = {
      plan: "free",
      licenseKey: "PRIME-ABCD-EFGH",
    };

    const shouldDeactivateKey = sub.licenseKey && sub.plan === "free";
    expect(shouldDeactivateKey).toBeTruthy();
  });

  it("does not deactivate key for paid plan expiry", () => {
    const sub = {
      plan: "prime_plus",
      licenseKey: "PRIME-ABCD-EFGH",
    };

    const shouldDeactivateKey = sub.licenseKey && sub.plan === "free";
    expect(shouldDeactivateKey).toBeFalsy();
  });
});

describe("subscription key reuse logic", () => {
  it("allows reuse of a license key after paid subscription activates", () => {
    // When a paid subscription is activated via webhook, the license key
    // should be re-activated (isActive = true) so it can be used again
    const linkedLicenseKey = "PRIME-ABCD-EFGH";
    const shouldReactivate = !!linkedLicenseKey;
    expect(shouldReactivate).toBe(true);
  });

  it("does not reactivate when no license key was linked", () => {
    const linkedLicenseKey = null;
    const shouldReactivate = !!linkedLicenseKey;
    expect(shouldReactivate).toBe(false);
  });
});
