/**
 * Tests for owner-account entitlement (`isOwnerEmail`).
 *
 * The owner runs the app rather than subscribing to it, so their access must
 * survive a lapsed trial, a missing subscription row, and any payment webhook
 * that would otherwise rewrite their plan. These tests pin the matching rules
 * that guarantee it — and, just as importantly, pin that an unset OWNER_EMAIL
 * grants nothing, since a permissive default here would hand every account a
 * free Prime Pro.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const ORIGINAL_OWNER_EMAIL = process.env.OWNER_EMAIL;

/** ENV is captured at module load, so the module must be re-evaluated per case. */
async function loadIsOwnerEmail(ownerEmail: string | undefined) {
  if (ownerEmail === undefined) {
    delete process.env.OWNER_EMAIL;
  } else {
    process.env.OWNER_EMAIL = ownerEmail;
  }
  vi.resetModules();
  const mod = await import("./_core/env");
  return mod.isOwnerEmail;
}

describe("isOwnerEmail", () => {
  beforeEach(() => {
    delete process.env.OWNER_EMAIL;
  });

  afterEach(() => {
    if (ORIGINAL_OWNER_EMAIL === undefined) {
      delete process.env.OWNER_EMAIL;
    } else {
      process.env.OWNER_EMAIL = ORIGINAL_OWNER_EMAIL;
    }
  });

  it("matches the configured owner", async () => {
    const isOwnerEmail = await loadIsOwnerEmail("owner@example.com");
    expect(isOwnerEmail("owner@example.com")).toBe(true);
  });

  it("ignores case and surrounding whitespace on both sides", async () => {
    // The owner signs up once, in whatever casing their keyboard produced, and
    // sets the env var later from memory. Requiring the two to match exactly
    // would revoke their access over a capital letter.
    const isOwnerEmail = await loadIsOwnerEmail(" Owner@Example.COM ");
    expect(isOwnerEmail("owner@example.com")).toBe(true);
    expect(isOwnerEmail("  OWNER@example.com  ")).toBe(true);
  });

  it("supports several owners in one comma-separated value", async () => {
    const isOwnerEmail = await loadIsOwnerEmail("first@example.com, second@example.com");
    expect(isOwnerEmail("first@example.com")).toBe(true);
    expect(isOwnerEmail("second@example.com")).toBe(true);
  });

  it("rejects a non-owner", async () => {
    const isOwnerEmail = await loadIsOwnerEmail("owner@example.com");
    expect(isOwnerEmail("member@example.com")).toBe(false);
  });

  it("rejects a substring of the owner address", async () => {
    // Guards against a future switch to `includes()`: "owner@example.com.evil"
    // contains the owner address but is a different account.
    const isOwnerEmail = await loadIsOwnerEmail("owner@example.com");
    expect(isOwnerEmail("owner@example.com.evil")).toBe(false);
    expect(isOwnerEmail("notowner@example.com")).toBe(false);
  });

  it("grants nothing when OWNER_EMAIL is unset", async () => {
    // The failure that would matter most: an empty env var matching every
    // account, or matching the users whose email column is null.
    const isOwnerEmail = await loadIsOwnerEmail(undefined);
    expect(isOwnerEmail("anyone@example.com")).toBe(false);
    expect(isOwnerEmail("")).toBe(false);
    expect(isOwnerEmail(null)).toBe(false);
    expect(isOwnerEmail(undefined)).toBe(false);
  });

  it("never matches a user with no email, even when an owner is configured", async () => {
    const isOwnerEmail = await loadIsOwnerEmail("owner@example.com");
    expect(isOwnerEmail(null)).toBe(false);
    expect(isOwnerEmail(undefined)).toBe(false);
    expect(isOwnerEmail("")).toBe(false);
  });
});
