import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the DB helpers so tests don't need a real database
vi.mock("./db", () => ({
  verifyAccessCode: vi.fn(),
  listAccessCodes: vi.fn(),
  createAccessCode: vi.fn(),
  toggleAccessCode: vi.fn(),
  deleteAccessCode: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getDb: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createAdminCtx(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createUserCtx(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("license.verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success=true for a valid active code", async () => {
    vi.mocked(db.verifyAccessCode).mockResolvedValue({
      id: 1,
      code: "PRIME-TEST-1234",
      customerName: "Ahmed Ali",
      customerEmail: "ahmed@example.com",
      note: null,
      isActive: true,
      usedAt: null,
      createdAt: new Date(),
    });

    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.license.verify({ licenseKey: "PRIME-TEST-1234" });

    expect(result.success).toBe(true);
    expect(result.customerName).toBe("Ahmed Ali");
    expect(result.customerEmail).toBe("ahmed@example.com");
  });

  it("returns success=false for an invalid/inactive code", async () => {
    vi.mocked(db.verifyAccessCode).mockResolvedValue(null);

    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.license.verify({ licenseKey: "INVALID-CODE" });

    expect(result.success).toBe(false);
  });

  it("trims whitespace from the input code", async () => {
    vi.mocked(db.verifyAccessCode).mockResolvedValue(null);

    const caller = appRouter.createCaller(createPublicCtx());
    await caller.license.verify({ licenseKey: "  PRIME-TEST-1234  " });

    expect(db.verifyAccessCode).toHaveBeenCalledWith("PRIME-TEST-1234");
  });

  it("rejects empty key with validation error", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.license.verify({ licenseKey: "" })).rejects.toThrow();
  });
});

describe("license.list (admin only)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns codes list for admin user", async () => {
    vi.mocked(db.listAccessCodes).mockResolvedValue([]);

    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.license.list();

    expect(Array.isArray(result)).toBe(true);
    expect(db.listAccessCodes).toHaveBeenCalled();
  });

  it("throws FORBIDDEN for non-admin user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(caller.license.list()).rejects.toThrow("Admins only");
  });
});

describe("license.create (admin only)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new code for admin user", async () => {
    vi.mocked(db.createAccessCode).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.license.create({
      code: "PRIME-NEW1-CODE",
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      note: "Test note",
    });

    expect(result.success).toBe(true);
    expect(db.createAccessCode).toHaveBeenCalledWith(
      expect.objectContaining({ code: "PRIME-NEW1-CODE", isActive: true })
    );
  });

  it("throws FORBIDDEN for non-admin user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(
      caller.license.create({ code: "PRIME-TEST-1234" })
    ).rejects.toThrow("Admins only");
  });
});

describe("license.toggle (admin only)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toggles code status for admin user", async () => {
    vi.mocked(db.toggleAccessCode).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.license.toggle({ id: 1, isActive: false });

    expect(result.success).toBe(true);
    expect(db.toggleAccessCode).toHaveBeenCalledWith(1, false);
  });
});

describe("license.delete (admin only)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a code for admin user", async () => {
    vi.mocked(db.deleteAccessCode).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.license.delete({ id: 5 });

    expect(result.success).toBe(true);
    expect(db.deleteAccessCode).toHaveBeenCalledWith(5);
  });
});
