/**
 * Tests for the throttled-request response shape.
 *
 * All four rate limiters sit on `/api/trpc/*` routes, so a throttled reply has
 * to look like a tRPC error or clients can't read it. express-rate-limit's
 * default body (`{ error: "..." }`) matches neither the success nor the error
 * envelope, and the iOS decoder falls through to a generic transport error —
 * telling the user "Unrecognized response (HTTP 429)" rather than that waiting
 * fixes it. These assertions walk the exact path that decoder walks, so the
 * regression can't come back quietly.
 */
import { describe, it, expect } from "vitest";
import type { Request, Response } from "express";
import { trpcRateLimitHandler } from "./_core/rateLimitEnvelope";

/** Minimal Express double: records the status and JSON body written. */
function captureResponse() {
  const captured: { status?: number; body?: any } = {};
  const res = {
    status(code: number) {
      captured.status = code;
      return this;
    },
    json(payload: unknown) {
      captured.body = payload;
      return this;
    },
  } as unknown as Response;
  return { res, captured };
}

function invoke(message: string, baseUrl: string | undefined) {
  const { res, captured } = captureResponse();
  trpcRateLimitHandler(message)({ baseUrl } as Request, res);
  return captured;
}

describe("trpcRateLimitHandler", () => {
  it("responds 429 with a decodable tRPC error envelope", () => {
    const message = "Too many login attempts. Please try again in 15 minutes.";
    const captured = invoke(message, "/api/trpc/standaloneAuth.login");

    expect(captured.status).toBe(429);
    // The exact path the iOS decoder walks. A body missing any of these is
    // what produced "Unrecognized response" instead of a readable message.
    expect(captured.body?.error?.json?.message).toBe(message);
    expect(captured.body?.error?.json?.data?.code).toBe("TOO_MANY_REQUESTS");
    expect(captured.body?.error?.json?.data?.httpStatus).toBe(429);
  });

  it("carries tRPC's JSON-RPC code so web clients classify it correctly", () => {
    const captured = invoke("slow down", "/api/trpc/standaloneAuth.login");
    expect(captured.body?.error?.json?.code).toBe(-32029);
  });

  it("names the throttled procedure in data.path", () => {
    const captured = invoke("slow down", "/api/trpc/license.verify");
    expect(captured.body?.error?.json?.data?.path).toBe("license.verify");
  });

  it("omits path rather than emitting a bare prefix when baseUrl is absent", () => {
    // Express leaves baseUrl empty for a limiter mounted at the app root. The
    // replace would then yield "", and an empty-string path is worse than none
    // — it reads as a procedure literally named "".
    expect(invoke("slow down", undefined).body?.error?.json?.data?.path).toBeUndefined();
    expect(invoke("slow down", "").body?.error?.json?.data?.path).toBeUndefined();
    expect(invoke("slow down", "/api/trpc/").body?.error?.json?.data?.path).toBeUndefined();
  });

  it("preserves the caller's message verbatim", () => {
    // Each limiter has its own wait time; a generic message would tell users
    // to wait 15 minutes when the forgot-password window is an hour.
    const message = "Too many password reset requests. Please try again in an hour.";
    expect(invoke(message, "/api/trpc/standaloneAuth.forgotPassword").body?.error?.json?.message)
      .toBe(message);
  });
});
