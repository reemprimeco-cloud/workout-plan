import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    console.log("[OAuth] Callback received:", {
      hasCode: !!code,
      hasState: !!state,
      host: req.hostname,
      protocol: req.protocol,
      forwardedProto: req.headers["x-forwarded-proto"],
    });

    if (!code || !state) {
      console.error("[OAuth] Missing code or state");
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      // Step 1: Exchange code for token
      console.log("[OAuth] Exchanging code for token...");
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      console.log("[OAuth] Token exchange success, accessToken present:", !!tokenResponse.accessToken);

      // Step 2: Get user info
      console.log("[OAuth] Fetching user info...");
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      console.log("[OAuth] User info:", {
        openId: userInfo.openId,
        name: userInfo.name,
        email: userInfo.email,
        platform: userInfo.platform,
        loginMethod: userInfo.loginMethod,
      });

      if (!userInfo.openId) {
        console.error("[OAuth] openId missing from user info");
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Step 3: Upsert user in DB — include fullName and authProvider
      const loginMethod = userInfo.loginMethod ?? userInfo.platform ?? null;
      const authProvider = loginMethod === "google" ? "google" as const
        : loginMethod === "email" ? "email" as const
        : "manus" as const;

      // Use upsertUser for basic fields
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod,
        lastSignedIn: new Date(),
      });

      // Also update fullName and authProvider (not handled by basic upsertUser)
      const database = await getDb();
      if (database && (userInfo.name || authProvider !== "manus")) {
        await database.update(users)
          .set({
            fullName: userInfo.name || null,
            authProvider,
            emailVerified: authProvider === "google" ? true : undefined,
            lastLoginAt: new Date(),
          })
          .where(eq(users.openId, userInfo.openId));
        console.log("[OAuth] Updated fullName and authProvider for user:", userInfo.openId);
      }

      // Step 4: Create session token
      const sessionName = userInfo.name || userInfo.email?.split("@")[0] || "User";
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: sessionName,
        expiresInMs: ONE_YEAR_MS,
      });
      console.log("[OAuth] Session token created for:", userInfo.openId);

      // Step 5: Set cookie — force secure:true for production (behind proxy)
      const cookieOptions = getSessionCookieOptions(req);
      // In production (behind HTTPS proxy), always set secure:true
      // sameSite:"none" requires secure:true or browsers reject the cookie
      const isProduction = process.env.NODE_ENV === "production";
      const finalCookieOptions = {
        ...cookieOptions,
        secure: isProduction ? true : cookieOptions.secure,
        maxAge: ONE_YEAR_MS,
      };

      console.log("[OAuth] Setting cookie with options:", {
        httpOnly: finalCookieOptions.httpOnly,
        sameSite: finalCookieOptions.sameSite,
        secure: finalCookieOptions.secure,
        path: finalCookieOptions.path,
      });

      res.cookie(COOKIE_NAME, sessionToken, finalCookieOptions);

      // Step 6: Redirect — check if user needs profile setup
      // A user needs profile setup if they have no fullName set yet
      // (Google users get fullName from userInfo.name above, so only truly new users)
      const updatedUser = await db.getUserByOpenId(userInfo.openId);
      const needsProfileSetup = !updatedUser?.fullName;

      const redirectTo = needsProfileSetup ? "/profile-setup" : "/";
      console.log("[OAuth] Redirecting to:", redirectTo, "| needsProfileSetup:", needsProfileSetup);

      res.redirect(302, redirectTo);

    } catch (error: any) {
      console.error("[OAuth] Callback failed:", error?.message ?? error);
      console.error("[OAuth] Stack:", error?.stack);
      // Redirect to auth page with error instead of showing JSON
      res.redirect(302, "/auth?error=oauth_failed");
    }
  });
}
