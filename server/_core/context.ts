import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // ── Single-device enforcement ────────────────────────────────────────────
  // If the user has an activeDeviceId set, verify the request comes from
  // that device. Requests from other devices are treated as unauthenticated
  // (forces re-login on the old device).
  //
  // Skip enforcement for cron/scheduled tasks (isCron=true) and for users
  // who have never logged in with a device ID (activeDeviceId is null).
  if (user && (user as any).isCron !== true && user.activeDeviceId) {
    const requestDeviceId = opts.req.headers["x-device-id"] as string | undefined;
    if (!requestDeviceId || requestDeviceId !== user.activeDeviceId) {
      // Device mismatch — treat as unauthenticated
      console.log(
        `[Auth] Device mismatch for user ${user.id}: expected=${user.activeDeviceId} got=${requestDeviceId ?? "none"}`
      );
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
