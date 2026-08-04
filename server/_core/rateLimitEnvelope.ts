import type { Request, Response } from "express";

/**
 * Reply to a throttled request with a tRPC error envelope.
 *
 * Every rate limiter in this app is mounted on an `/api/trpc/*` route, but
 * express-rate-limit's default body is `{ error: "..." }` — not a tRPC
 * envelope. Clients decode these routes as tRPC, fail to match either the
 * success or the error shape, and fall back to a generic transport error: the
 * iOS app renders "Unrecognized response (HTTP 429)" where it should say
 * "too many attempts, try again in 15 minutes". The throttle works; the user
 * just has no idea why, and nothing tells them that waiting fixes it.
 *
 * Shaped to match what tRPC itself emits — superjson wraps the error payload
 * in a `json` key, which is asymmetric with most non-transformer setups and
 * easy to miss — so existing clients need no changes to read it.
 *
 * Lives in its own module so it can be tested without importing
 * `server/_core/index.ts`, which pulls in the entire router and database graph
 * at import time.
 */
export function trpcRateLimitHandler(message: string) {
  return (req: Request, res: Response) => {
    res.status(429).json({
      error: {
        json: {
          message,
          code: -32029, // tRPC's JSON-RPC code for TOO_MANY_REQUESTS
          data: {
            code: "TOO_MANY_REQUESTS",
            httpStatus: 429,
            // Each limiter is mounted at the procedure's own path, so baseUrl
            // is "/api/trpc/<procedure>".
            path: req.baseUrl?.replace("/api/trpc/", "") || undefined,
          },
        },
      },
    });
  };
}
