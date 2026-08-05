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
  // One active device per account: signing in anywhere records that device as
  // `activeDeviceId` and revokes the previous device's session, and any request
  // carrying a different device is treated as signed out. The column and the
  // device_sessions table shipped in migration 0000 — the note that previously
  // stood here, saying the migration was still pending, was stale.
  //
  // Cron requests are exempt: they authenticate as a synthetic user with no
  // device of their own, and would otherwise be locked out by their own
  // scheduled runs.
  if (user && (user as { isCron?: boolean }).isCron !== true && user.activeDeviceId) {
    const requestDeviceId = opts.req.headers["x-device-id"] as string | undefined;
    if (!requestDeviceId || requestDeviceId !== user.activeDeviceId) {
      console.log(`[Auth] Device mismatch for user ${user.id}`);
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
