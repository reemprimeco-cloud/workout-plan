/**
 * Tests for user serialisation over the wire.
 *
 * Postgres `numeric` columns arrive from the driver as strings. `auth.me`
 * returned the raw row, so `currentWeight` went out as "75.50" while the iOS
 * client declares `Double?` — the whole user failed to decode and the app
 * reported "Unrecognized response (HTTP 200)". Only accounts that had saved a
 * weight were affected, which disguised it as an intermittent auth failure.
 * These tests pin the conversion, and pin that nothing else about the row is
 * disturbed.
 */
import { describe, it, expect } from "vitest";
import { serializeUser } from "./_core/serializeUser";
import type { User } from "../drizzle/schema";

function row(overrides: Partial<User> = {}): User {
  return {
    id: 443,
    openId: "email_abc",
    name: "Reem",
    fullName: "Reem",
    email: "r@example.com",
    passwordHash: null,
    authProvider: "email",
    loginMethod: null,
    role: "user",
    avatarUrl: null,
    resetToken: null,
    resetTokenExpiresAt: null,
    emailVerified: false,
    lastLoginAt: null,
    age: 30,
    height: 165,
    currentWeight: "75.50",
    targetWeight: "68.00",
    gender: "female",
    ...overrides,
  } as unknown as User;
}

describe("serializeUser", () => {
  it("converts numeric weight strings to numbers", () => {
    const user = serializeUser(row());
    expect(user.currentWeight).toBe(75.5);
    expect(user.targetWeight).toBe(68);
  });

  it("keeps nulls as null rather than coercing them to 0", () => {
    // Number(null) is 0 — a user who never set a target weight would appear to
    // be aiming for zero kilograms.
    const user = serializeUser(row({ currentWeight: null, targetWeight: null } as Partial<User>));
    expect(user.currentWeight).toBeNull();
    expect(user.targetWeight).toBeNull();
  });

  it("maps an unparseable value to null instead of NaN", () => {
    const user = serializeUser(row({ currentWeight: "not-a-number" } as Partial<User>));
    expect(user.currentWeight).toBeNull();
  });

  it("passes null through for an unauthenticated caller", () => {
    // The web client reads a null result as "logged out"; turning it into an
    // object here would make every visitor look signed in.
    expect(serializeUser(null)).toBeNull();
  });

  it("leaves every other field untouched", () => {
    const original = row();
    const user = serializeUser(original);
    expect(user.id).toBe(original.id);
    expect(user.openId).toBe(original.openId);
    expect(user.email).toBe(original.email);
    expect(user.role).toBe(original.role);
    expect(user.height).toBe(165);
  });

  it("preserves fields the base row type doesn't declare", () => {
    // authenticateRequest returns User plus extras; dropping them here would
    // silently change what downstream procedures receive.
    const extended = { ...row(), taskUid: "abc-123" } as User & { taskUid: string };
    const user = serializeUser(extended);
    expect(user.taskUid).toBe("abc-123");
  });
});
