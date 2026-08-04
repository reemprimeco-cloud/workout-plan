/**
 * Tests for owner→admin promotion on authenticated requests.
 *
 * The first version of this feature promoted inside `upsertUser`, keyed on the
 * email passed to it. That never fired: `authenticateRequest` — the one path
 * every authenticated request goes through — called `upsertUser` with only
 * `openId` and `lastSignedIn`, and the email/password login never upserts at
 * all. The owner stayed `role: "user"` indefinitely while appearing to be
 * configured correctly. These tests pin the behaviour at the layer that has
 * the full user row, so that silent failure can't return.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ORIGINAL_OWNER_EMAIL = process.env.OWNER_EMAIL;
const OWNER_EMAIL = "owner@example.com";

const getUserByOpenId = vi.fn();
const upsertUser = vi.fn();

vi.mock("./db", () => ({
  getUserByOpenId: (...args: unknown[]) => getUserByOpenId(...args),
  upsertUser: (...args: unknown[]) => upsertUser(...args),
}));

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    openId: "email_abc123",
    email: OWNER_EMAIL,
    name: "Reem",
    role: "user",
    ...overrides,
  };
}

/** Builds a request whose session cookie the sdk will accept. */
async function authenticate(row: Record<string, unknown>) {
  process.env.OWNER_EMAIL = OWNER_EMAIL;
  process.env.JWT_SECRET = "test-secret-for-owner-promotion";
  // verifySession rejects a token whose appId claim is empty, and
  // createSessionToken reads it from ENV.appId (VITE_APP_ID).
  process.env.VITE_APP_ID = "test-app";
  vi.resetModules();

  const { sdk } = await import("./_core/sdk");
  const { COOKIE_NAME } = await import("@shared/const");

  getUserByOpenId.mockResolvedValue(row);

  const token = await sdk.createSessionToken(row.openId as string, { name: "Reem" });
  const req = { headers: { cookie: `${COOKIE_NAME}=${token}` } } as never;

  return sdk.authenticateRequest(req);
}

describe("owner promotion on authenticateRequest", () => {
  beforeEach(() => {
    getUserByOpenId.mockReset();
    upsertUser.mockReset();
    upsertUser.mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (ORIGINAL_OWNER_EMAIL === undefined) delete process.env.OWNER_EMAIL;
    else process.env.OWNER_EMAIL = ORIGINAL_OWNER_EMAIL;
  });

  it("persists role admin for the owner", async () => {
    await authenticate(userRow());
    expect(upsertUser).toHaveBeenCalledWith(expect.objectContaining({ role: "admin" }));
  });

  it("returns the promoted role on the same request that promotes", async () => {
    // Returning the row as it was read would leave the owner as "user" for one
    // more request — admin routes would 403 until they retried, which reads as
    // the feature simply not working.
    const user = await authenticate(userRow());
    expect(user.role).toBe("admin");
  });

  it("does not write a role for a non-owner", async () => {
    const user = await authenticate(userRow({ email: "member@example.com" }));
    expect(user.role).toBe("user");
    expect(upsertUser).toHaveBeenCalledWith(expect.not.objectContaining({ role: expect.anything() }));
  });

  it("skips the write once the owner is already admin", async () => {
    // authenticateRequest runs on every request; rewriting an unchanged role
    // each time is pure churn against the database.
    await authenticate(userRow({ role: "admin" }));
    expect(upsertUser).toHaveBeenCalledWith(expect.not.objectContaining({ role: expect.anything() }));
  });

  it("still touches lastSignedIn in every case", async () => {
    await authenticate(userRow({ email: "member@example.com" }));
    expect(upsertUser).toHaveBeenCalledWith(expect.objectContaining({ lastSignedIn: expect.any(Date) }));
  });

  it("does not promote a user whose email is null", async () => {
    const user = await authenticate(userRow({ email: null }));
    expect(user.role).toBe("user");
  });
});
