import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { users, deviceSessions } from "../../drizzle/schema";
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

      // Step 5b: Bind device session for single-device enforcement
      const deviceId = req.headers["x-device-id"] as string | undefined;
      if (deviceId) {
        try {
          const dbConn = await getDb();
          if (dbConn) {
            const userRow = await db.getUserByOpenId(userInfo.openId);
            if (userRow) {
              // Revoke all previous device sessions
              await dbConn.update(deviceSessions)
                .set({ revoked: true })
                .where(eq(deviceSessions.userId, userRow.id));
              // Insert new device session
              const expiresAt = new Date(Date.now() + ONE_YEAR_MS);
              const userAgent = req.headers["user-agent"] ?? null;
              const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? null;
              await dbConn.insert(deviceSessions).values({
                userId: userRow.id,
                deviceId,
                userAgent,
                ipAddress,
                revoked: false,
                expiresAt,
              });
              // Update activeDeviceId
              await dbConn.update(users)
                .set({ activeDeviceId: deviceId })
                .where(eq(users.id, userRow.id));
            }
          }
        } catch (devErr) {
          console.warn("[OAuth] Device session binding failed (non-fatal):", devErr);
        }
      }

      // Step 6: Auto-link subscription by email (for new Google users who already paid)
      if (userInfo.email && database) {
        try {
          const { subscriptions } = await import('../../drizzle/schema');
          const updatedUser2 = await db.getUserByOpenId(userInfo.openId);
          if (updatedUser2) {
            // Find any subscription with matching email but no userId assigned yet
            const unlinkedSub = await database.select()
              .from(subscriptions)
              .where(eq(subscriptions.email, userInfo.email))
              .limit(1);
            if (unlinkedSub.length > 0 && unlinkedSub[0].userId !== String(updatedUser2.id)) {
              await database.update(subscriptions)
                .set({ userId: String(updatedUser2.id) })
                .where(eq(subscriptions.id, unlinkedSub[0].id));
              console.log("[OAuth] Linked subscription to user:", updatedUser2.id);
            }
          }
        } catch (subErr) {
          // Non-fatal: subscription linking failure should not block login
          console.warn("[OAuth] Subscription linking failed (non-fatal):", subErr);
        }
      }

      // Step 7: Redirect — check if user needs profile setup
      // Google users already have fullName set from OAuth, so only truly new users
      // who have no name at all need profile setup
      const updatedUser = await db.getUserByOpenId(userInfo.openId);
      // Google users have fullName set — they go directly to home
      // New email/password users without fullName go to profile-setup
      const needsProfileSetup = !updatedUser?.fullName && !updatedUser?.name;

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
