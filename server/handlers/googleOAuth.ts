/**
 * googleOAuth.ts
 * Server-side Google OAuth redirect flow.
 * Works reliably on all mobile browsers including Safari (ITP-safe).
 *
 * Flow:
 *   1. GET /api/auth/google          → redirect to Google OAuth consent page
 *   2. GET /api/auth/google/callback → exchange code, create/update user, set cookie, redirect to /
 */
import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { users, subscriptions, deviceSessions } from "../../drizzle/schema";
import { getDb } from "../db";
import { getSessionCookieOptions } from "../_core/cookies";
import { ENV } from "../_core/env";
import { sdk } from "../_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function getCallbackUrl(req: Request): string {
  // Use x-forwarded-host if behind a proxy (production), else req.hostname
  const proto = req.headers["x-forwarded-proto"]
    ? (Array.isArray(req.headers["x-forwarded-proto"])
        ? req.headers["x-forwarded-proto"][0]
        : req.headers["x-forwarded-proto"].split(",")[0].trim())
    : req.protocol;
  const host = req.headers["x-forwarded-host"]
    ? (Array.isArray(req.headers["x-forwarded-host"])
        ? req.headers["x-forwarded-host"][0]
        : req.headers["x-forwarded-host"])
    : req.headers.host;
  return `${proto}://${host}/api/auth/google/callback`;
}

/** Step 1: Redirect to Google */
export function googleAuthRedirect(req: Request, res: Response) {
  const clientId = ENV.googleClientId;
  if (!clientId) {
    return res.status(500).send("Google Sign-In is not configured.");
  }

  const callbackUrl = getCallbackUrl(req);
  const returnTo = (req.query.returnTo as string) || "/";

  // Store returnTo in state param (base64 encoded)
  const state = Buffer.from(JSON.stringify({ returnTo, callbackUrl })).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  return res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}

/** Step 2: Handle Google callback */
export async function googleAuthCallback(req: Request, res: Response) {
  const { code, state, error } = req.query as Record<string, string>;

  // Parse state
  let returnTo = "/";
  let callbackUrl = getCallbackUrl(req);
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
    returnTo = parsed.returnTo || "/";
    callbackUrl = parsed.callbackUrl || callbackUrl;
  } catch {
    // ignore malformed state
  }

  if (error || !code) {
    console.warn("[GoogleOAuth] Error or missing code:", error);
    return res.redirect(`/?google_error=${encodeURIComponent(error || "cancelled")}`);
  }

  const clientId = ENV.googleClientId;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";

  if (!clientId || !clientSecret) {
    console.error("[GoogleOAuth] Missing client credentials");
    return res.redirect("/?google_error=config_error");
  }

  try {
    // Exchange code for tokens
    const tokenResp = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenResp.ok) {
      const errText = await tokenResp.text();
      console.error("[GoogleOAuth] Token exchange failed:", errText);
      return res.redirect("/?google_error=token_exchange_failed");
    }

    const tokens = await tokenResp.json() as { access_token: string; id_token?: string };

    // Get user info
    const userInfoResp = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResp.ok) {
      console.error("[GoogleOAuth] Failed to fetch user info");
      return res.redirect("/?google_error=userinfo_failed");
    }

    const googleUser = await userInfoResp.json() as {
      sub: string;
      email: string;
      name: string;
      picture?: string;
      email_verified?: boolean;
    };

    if (!googleUser.sub || !googleUser.email) {
      return res.redirect("/?google_error=invalid_user");
    }

    const db = await getDb();
    if (!db) {
      return res.redirect("/?google_error=db_unavailable");
    }

    const email = googleUser.email.toLowerCase().trim();
    const googleOpenId = `google_${googleUser.sub}`;
    const displayName = googleUser.name || email.split("@")[0] || "User";

    // Check if user exists by openId (Google sub)
    let existingResult = await db.select()
      .from(users)
      .where(eq(users.openId, googleOpenId))
      .limit(1);

    let user = existingResult[0];

    if (!user) {
      // Check if email exists (user might have signed up with email before)
      const byEmail = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (byEmail.length > 0) {
        // Link Google to existing account
        user = byEmail[0];
        await db.update(users)
          .set({
            authProvider: "google",
            loginMethod: "google",
            avatarUrl: googleUser.picture || null,
            emailVerified: true,
            lastSignedIn: new Date(),
            lastLoginAt: new Date(),
          })
          .where(eq(users.id, user.id));
        // Refresh user data
        const refreshed = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
        user = refreshed[0] ?? user;
      } else {
        // Create new Google account
        await db.insert(users).values({
          openId: googleOpenId,
          fullName: displayName,
          name: displayName,
          email,
          authProvider: "google",
          loginMethod: "google",
          avatarUrl: googleUser.picture || null,
          emailVerified: true,
          lastSignedIn: new Date(),
          lastLoginAt: new Date(),
        });

        const newUser = await db.select()
          .from(users)
          .where(eq(users.openId, googleOpenId))
          .limit(1);
        user = newUser[0];
      }
    } else {
      // Update last login
      await db.update(users)
        .set({
          lastSignedIn: new Date(),
          lastLoginAt: new Date(),
          avatarUrl: googleUser.picture || user.avatarUrl || null,
        })
        .where(eq(users.id, user.id));
    }

    if (!user) {
      console.error("[GoogleOAuth] Failed to create/find user");
      return res.redirect("/?google_error=user_creation_failed");
    }

    // Link subscription by email if not already linked to this user
    try {
      const existingSub = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, String(user.id)))
        .limit(1);

      if (existingSub.length === 0) {
        // Check if there's a subscription with this email not yet linked
        const emailSub = await db.select()
          .from(subscriptions)
          .where(eq(subscriptions.email, email))
          .limit(1);

        if (emailSub.length > 0 && emailSub[0].userId !== String(user.id)) {
          // Link the subscription to this user
          await db.update(subscriptions)
            .set({ userId: String(user.id) })
            .where(eq(subscriptions.id, emailSub[0].id));
          console.log(`[GoogleOAuth] Linked subscription ${emailSub[0].id} to user ${user.id} via email`);
        }
      }
    } catch (subErr: any) {
      // Non-fatal: log but don't fail login
      console.warn("[GoogleOAuth] Subscription linking failed:", subErr.message);
    }

    // Create session — ensure name is never empty (fixes verifySession rejection)
    const sessionName = user.fullName || user.name || displayName || email.split("@")[0] || "User";
    const sessionToken = await sdk.createSessionToken(user.openId, {
      name: sessionName,
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, {
      ...cookieOptions,
      maxAge: ONE_YEAR_MS,
    });

    // Bind device session for single-device enforcement
    const deviceId = req.headers["x-device-id"] as string | undefined;
    if (deviceId && user) {
      try {
        const expiresAt = new Date(Date.now() + ONE_YEAR_MS);
        const userAgent = req.headers["user-agent"] ?? null;
        const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? null;
        // Revoke all previous device sessions
        await db.update(deviceSessions)
          .set({ revoked: true })
          .where(eq(deviceSessions.userId, user.id));
        // Insert new device session
        await db.insert(deviceSessions).values({
          userId: user.id,
          deviceId,
          userAgent,
          ipAddress,
          revoked: false,
          expiresAt,
        });
        // Update activeDeviceId
        await db.update(users)
          .set({ activeDeviceId: deviceId })
          .where(eq(users.id, user.id));
      } catch (devErr: any) {
        console.warn("[GoogleOAuth] Device session binding failed (non-fatal):", devErr.message);
      }
    }

    console.log(`[GoogleOAuth] Login success for ${email}, redirecting to ${returnTo}`);

    // Redirect to profile setup if new user (no fullName set), else home
    const isNewUser = !user.fullName;
    const destination = isNewUser ? "/profile-setup" : (returnTo || "/");
    return res.redirect(destination);

  } catch (err: any) {
    console.error("[GoogleOAuth] Unexpected error:", err.message);
    return res.redirect(`/?google_error=${encodeURIComponent("unexpected_error")}`);
  }
}
