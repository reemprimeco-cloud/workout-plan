/**
 * standaloneAuth.ts
 * Email/Password + Google Sign-In authentication procedures.
 * These run alongside the existing Manus OAuth system.
 */
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import { z } from "zod";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import { getSessionCookieOptions } from "../_core/cookies";
import { ENV } from "../_core/env";
import { sdk } from "../_core/sdk";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// ── Helpers ────────────────────────────────────────────────────────────────

function generateOpenId(): string {
  return `email_${randomBytes(16).toString("hex")}`;
}

function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

async function createSessionAndSetCookie(
  ctx: { res: any; req: any },
  openId: string,
  name: string
): Promise<void> {
  const sessionToken = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(ctx.req);
  ctx.res.cookie(COOKIE_NAME, sessionToken, {
    ...cookieOptions,
    maxAge: ONE_YEAR_MS,
  });
}

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!ENV.smtpUser || !ENV.smtpPass) {
    console.warn("[Email] SMTP not configured, skipping email send");
    return;
  }
  const transporter = nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpPort === 465,
    auth: { user: ENV.smtpUser, pass: ENV.smtpPass },
  });
  await transporter.sendMail({
    from: ENV.smtpFrom,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

// ── Router ─────────────────────────────────────────────────────────────────

export const standaloneAuthRouter = router({

  /** Sign up with email + password */
  signUp: publicProcedure
    .input(z.object({
      fullName: z.string().min(2).max(100),
      email: z.string().email(),
      password: z.string().min(8).max(128),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const email = input.email.toLowerCase().trim();

      // Check if email already exists
      const existing = await db.select({ id: users.id, authProvider: users.authProvider })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = generateOpenId();

      await db.insert(users).values({
        openId,
        fullName: input.fullName,
        name: input.fullName,
        email,
        passwordHash,
        authProvider: "email",
        loginMethod: "email",
        emailVerified: false,
        lastSignedIn: new Date(),
        lastLoginAt: new Date(),
      });

      await createSessionAndSetCookie(ctx, openId, input.fullName);

      return { success: true, message: "تم إنشاء الحساب بنجاح" };
    }),

  /** Login with email + password */
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const email = input.email.toLowerCase().trim();

      const result = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const user = result[0];

      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        });
      }

      const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
      if (!passwordMatch) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        });
      }

      // Update last login
      await db.update(users)
        .set({ lastSignedIn: new Date(), lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      await createSessionAndSetCookie(ctx, user.openId, user.fullName || user.name || "");

      return {
        success: true,
        message: "تم تسجيل الدخول بنجاح",
        user: {
          id: user.id,
          name: user.fullName || user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  /** Request password reset — sends email with reset link */
  forgotPassword: publicProcedure
    .input(z.object({
      email: z.string().email(),
      origin: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const email = input.email.toLowerCase().trim();
      const result = await db.select({ id: users.id, fullName: users.fullName, name: users.name })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      // Always return success to avoid email enumeration
      if (result.length === 0) {
        return { success: true, message: "إذا كان البريد مسجلاً، ستصلك رسالة إعادة تعيين كلمة المرور" };
      }

      const user = result[0];
      const token = generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.update(users)
        .set({ resetToken: token, resetTokenExpiresAt: expiresAt })
        .where(eq(users.id, user.id));

      const resetUrl = `${input.origin}/reset-password?token=${token}`;
      const displayName = user.fullName || user.name || "المستخدم";

      await sendEmail({
        to: email,
        subject: "Prime Fit — إعادة تعيين كلمة المرور",
        html: `
          <div dir="rtl" style="font-family: Cairo, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #1B2E5E; font-size: 24px; margin: 0;">Prime Fit 💪</h1>
            </div>
            <h2 style="color: #1B2E5E; font-size: 18px;">مرحباً ${displayName}،</h2>
            <p style="color: #4B5563; font-size: 14px; line-height: 1.7;">
              تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.
              اضغط على الزر أدناه لإعادة تعيين كلمة المرور:
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #1B2E5E, #2A4A8A); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 15px; font-weight: 700; display: inline-block;">
                إعادة تعيين كلمة المرور
              </a>
            </div>
            <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
              هذا الرابط صالح لمدة ساعة واحدة فقط.<br/>
              إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة.
            </p>
          </div>
        `,
      });

      return { success: true, message: "إذا كان البريد مسجلاً، ستصلك رسالة إعادة تعيين كلمة المرور" };
    }),

  /** Reset password using token from email */
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string().min(1),
      newPassword: z.string().min(8).max(128),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db.select()
        .from(users)
        .where(eq(users.resetToken, input.token))
        .limit(1);

      const user = result[0];

      if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية",
        });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12);

      await db.update(users)
        .set({
          passwordHash,
          resetToken: null,
          resetTokenExpiresAt: null,
          lastSignedIn: new Date(),
        })
        .where(eq(users.id, user.id));

      return { success: true, message: "تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول." };
    }),

  /** Change password (for logged-in users) */
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8).max(128),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const user = ctx.user;

      if (!user.passwordHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "حسابك لا يستخدم كلمة مرور (تسجيل دخول عبر Google)",
        });
      }

      const passwordMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!passwordMatch) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "كلمة المرور الحالية غير صحيحة",
        });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await db.update(users)
        .set({ passwordHash })
        .where(eq(users.id, user.id));

      return { success: true, message: "تم تغيير كلمة المرور بنجاح" };
    }),

  /** Verify Google ID token and sign in / sign up */
  googleSignIn: publicProcedure
    .input(z.object({
      idToken: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify Google ID token by calling Google's tokeninfo endpoint
      let googlePayload: {
        sub: string;
        email: string;
        name: string;
        picture?: string;
        email_verified?: boolean;
      };

      try {
        const resp = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(input.idToken)}`
        );
        if (!resp.ok) {
          throw new Error(`Google token verification failed: ${resp.status}`);
        }
        googlePayload = await resp.json() as typeof googlePayload;
        if (!googlePayload.sub || !googlePayload.email) {
          throw new Error("Invalid Google token payload");
        }
      } catch (err) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "فشل التحقق من حساب Google. يرجى المحاولة مرة أخرى.",
        });
      }

      const email = googlePayload.email.toLowerCase().trim();
      const googleOpenId = `google_${googlePayload.sub}`;

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
              avatarUrl: googlePayload.picture || null,
              emailVerified: true,
              lastSignedIn: new Date(),
              lastLoginAt: new Date(),
            })
            .where(eq(users.id, user.id));
        } else {
          // Create new Google account
          await db.insert(users).values({
            openId: googleOpenId,
            fullName: googlePayload.name,
            name: googlePayload.name,
            email,
            authProvider: "google",
            loginMethod: "google",
            avatarUrl: googlePayload.picture || null,
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
          .set({ lastSignedIn: new Date(), lastLoginAt: new Date() })
          .where(eq(users.id, user.id));
      }

      if (!user) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
      }

      await createSessionAndSetCookie(ctx, user.openId, user.fullName || user.name || "");

      return {
        success: true,
        message: "تم تسجيل الدخول بنجاح",
        user: {
          id: user.id,
          name: user.fullName || user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  /** Check if an email is already registered */
  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { exists: false };
      const result = await db.select({ id: users.id, authProvider: users.authProvider })
        .from(users)
        .where(eq(users.email, input.email.toLowerCase().trim()))
        .limit(1);
      return {
        exists: result.length > 0,
        authProvider: result[0]?.authProvider ?? null,
      };
    }),
});
