import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("license.verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set env vars for tests
    process.env.WOO_STORE_URL = "https://primeprint.com.kw";
    process.env.WOO_CONSUMER_KEY = "ck_test";
    process.env.WOO_CONSUMER_SECRET = "cs_test";
  });

  it("returns success:false for empty key", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.license.verify({ licenseKey: "" })
    ).rejects.toThrow(); // Zod validation error
  });

  it("returns success:false when WooCommerce returns no orders", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.license.verify({ licenseKey: "wc_order_invalid123" });
    expect(result.success).toBe(false);
  });

  it("returns success:false for non-completed order status", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 123,
          status: "pending",
          order_key: "wc_order_pending123",
          billing: { first_name: "Test", last_name: "User", email: "test@example.com" },
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.license.verify({ licenseKey: "wc_order_pending123" });
    expect(result.success).toBe(false);
  });

  it("returns success:true for a completed order", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 456,
          status: "completed",
          order_key: "wc_order_valid456",
          billing: { first_name: "Reem", last_name: "Al-Mutairi", email: "reem@example.com" },
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.license.verify({ licenseKey: "wc_order_valid456" });
    expect(result.success).toBe(true);
    expect(result.customerName).toBe("Reem Al-Mutairi");
    expect(result.customerEmail).toBe("reem@example.com");
    expect(result.orderId).toBe(456);
  });

  it("returns success:true for a processing order", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 789,
          status: "processing",
          order_key: "wc_order_processing789",
          billing: { first_name: "Sara", last_name: "Ahmed", email: "sara@example.com" },
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.license.verify({ licenseKey: "wc_order_processing789" });
    expect(result.success).toBe(true);
  });
});
