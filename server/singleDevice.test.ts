/**
 * Tests for single-device enforcement.
 *
 * One active device per account: signing in records that device as
 * `activeDeviceId` and revokes the previous device's session, and any request
 * carrying a different device is treated as signed out. The check sat commented
 * out behind a note claiming its migration was pending — it had in fact shipped
 * in migration 0000 — so these tests also serve to prove the feature is live.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

const authenticateRequest = vi.fn();

vi.mock("./_core/sdk", () => ({
  sdk: { authenticateRequest: (...args: unknown[]) => authenticateRequest(...args) },
}));

import { createContext } from "./_core/context";

const ACTIVE_DEVICE = "device-aaa";

function opts(deviceId?: string) {
  return {
    req: { headers: deviceId === undefined ? {} : { "x-device-id": deviceId } },
    res: {},
  } as unknown as CreateExpressContextOptions;
}

function user(overrides: Record<string, unknown> = {}) {
  return { id: 443, openId: "email_abc", activeDeviceId: ACTIVE_DEVICE, ...overrides };
}

describe("single-device enforcement", () => {
  beforeEach(() => {
    authenticateRequest.mockReset();
  });

  it("admits the device that signed in", async () => {
    authenticateRequest.mockResolvedValue(user());
    const ctx = await createContext(opts(ACTIVE_DEVICE));
    expect(ctx.user).not.toBeNull();
  });

  it("signs out a request from a different device", async () => {
    authenticateRequest.mockResolvedValue(user());
    const ctx = await createContext(opts("device-bbb"));
    expect(ctx.user).toBeNull();
  });

  it("signs out a request carrying no device header", async () => {
    // Otherwise the whole rule is opt-out: anyone could keep a revoked session
    // alive simply by omitting the header.
    authenticateRequest.mockResolvedValue(user());
    const ctx = await createContext(opts(undefined));
    expect(ctx.user).toBeNull();
  });

  it("leaves an account with no bound device alone", async () => {
    // Accounts that predate device binding, or sessions issued without a
    // device id, must not be locked out retroactively.
    authenticateRequest.mockResolvedValue(user({ activeDeviceId: null }));
    const ctx = await createContext(opts("device-bbb"));
    expect(ctx.user).not.toBeNull();
  });

  it("exempts cron", async () => {
    // The scheduled runner authenticates as a synthetic user with no device of
    // its own; enforcing against it would let the app lock out its own jobs.
    authenticateRequest.mockResolvedValue(user({ isCron: true }));
    const ctx = await createContext(opts(undefined));
    expect(ctx.user).not.toBeNull();
  });

  it("still yields a null user when authentication itself fails", async () => {
    authenticateRequest.mockRejectedValue(new Error("Invalid session cookie"));
    const ctx = await createContext(opts(ACTIVE_DEVICE));
    expect(ctx.user).toBeNull();
  });
});
