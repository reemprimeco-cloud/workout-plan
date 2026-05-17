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
  // NOTE: Temporarily disabled — activeDeviceId column migration is pending.
  // Will be re-enabled once the DB migration is applied.
  // if (user && (user as any).isCron !== true && user.activeDeviceId) {
  //   const requestDeviceId = opts.req.headers["x-device-id"] as string | undefined;
  //   if (!requestDeviceId || requestDeviceId !== user.activeDeviceId) {
  //     console.log(`[Auth] Device mismatch for user ${user.id}`);
  //     user = null;
  //   }
  // }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
