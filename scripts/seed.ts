/**
 * Staging seed script — idempotent.
 *
 *   DATABASE_URL=postgres://... pnpm seed
 *
 * Creates four test accounts and realistic demo data (subscriptions, gym +
 * classes, community posts, a challenge, notifications, nutrition goals, spin
 * rewards, site appearance, and a few exercise CMS overrides). Safe to run
 * repeatedly: keyed rows use onConflictDoNothing and content is only seeded
 * when the seed admin doesn't already exist.
 *
 * Test accounts (all password logins via /auth):
 *   admin@primefit.test    / Admin123!    (role: admin)
 *   trainer@primefit.test  / Trainer123!  (role: admin — no dedicated trainer role)
 *   premium@primefit.test  / Premium123!  (role: user, Prime Pro active)
 *   free@primefit.test     / Free123!     (role: user, free)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import {
  users, subscriptions, nutritionGoals, notificationSettings,
  gyms, gymBranches, gymClasses, communityPosts, communityChallenges,
  socialNotifications, rewardProbabilities, siteAppearance, exerciseOverrides,
} from "../drizzle/schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(url, { prepare: false });
const db = drizzle(client);

async function ensureUser(opts: {
  openId: string; email: string; fullName: string; password: string;
  role: "admin" | "user";
}): Promise<number> {
  const passwordHash = await bcrypt.hash(opts.password, 12);
  await db.insert(users).values({
    openId: opts.openId,
    email: opts.email,
    fullName: opts.fullName,
    name: opts.fullName,
    passwordHash,
    authProvider: "email",
    loginMethod: "email",
    emailVerified: true,
    role: opts.role,
  }).onConflictDoNothing({ target: users.openId });
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.openId, opts.openId)).limit(1);
  return row.id;
}

async function main() {
  console.log("Seeding staging data…");

  // ── Test accounts ──────────────────────────────────────────────────────────
  const adminId = await ensureUser({ openId: "email_seed_admin", email: "admin@primefit.test", fullName: "Prime Admin", password: "Admin123!", role: "admin" });
  const trainerId = await ensureUser({ openId: "email_seed_trainer", email: "trainer@primefit.test", fullName: "Prime Trainer", password: "Trainer123!", role: "admin" });
  const premiumId = await ensureUser({ openId: "email_seed_premium", email: "premium@primefit.test", fullName: "Reem Premium", password: "Premium123!", role: "user" });
  const freeId = await ensureUser({ openId: "email_seed_free", email: "free@primefit.test", fullName: "Noura Free", password: "Free123!", role: "user" });

  // ── Subscriptions (userId is the openId string) ─────────────────────────────
  const oneYear = new Date(Date.now() + 365 * 86400_000);
  for (const [openId, plan, status, period, paymentStatus, expiresAt] of [
    ["email_seed_admin", "prime_pro", "active", "yearly", "free", null],
    ["email_seed_trainer", "prime_pro", "active", "yearly", "free", null],
    ["email_seed_premium", "prime_pro", "active", "yearly", "paid", oneYear],
    ["email_seed_free", "free", "active", "free_trial", "free", null],
  ] as const) {
    await db.insert(subscriptions).values({
      userId: openId, plan, status, period, paymentStatus, paymentProvider: paymentStatus === "paid" ? "myfatoorah" : "free",
      startsAt: new Date(), expiresAt: expiresAt ?? undefined, email: `${openId.replace("email_seed_", "")}@primefit.test`,
    }).onConflictDoNothing({ target: subscriptions.userId });
  }

  // ── Per-user nutrition goals + notification settings ────────────────────────
  for (const uid of [adminId, trainerId, premiumId, freeId]) {
    await db.insert(nutritionGoals).values({ userId: uid, calories: 2000, proteinG: 150, carbsG: 200, fatG: 65, waterMl: 2500 }).onConflictDoNothing({ target: nutritionGoals.userId });
    await db.insert(notificationSettings).values({ userId: uid, enabled: false, reminderTime: "18:00", days: "1,2,3,4,5", language: "ar" }).onConflictDoNothing({ target: notificationSettings.userId });
  }

  // ── One-time content (only when first seeded) ──────────────────────────────
  const existingGyms = await db.select({ id: gyms.id }).from(gyms).limit(1);
  if (existingGyms.length === 0) {
    const [gym] = await db.insert(gyms).values({ name: "Prime Fitness", brandColor: "#1B2E5E" }).returning({ id: gyms.id });
    const [branch] = await db.insert(gymBranches).values({ gymId: gym.id, name: "Main Branch", location: "Kuwait City" }).returning({ id: gymBranches.id });
    await db.insert(gymClasses).values([
      { gymId: gym.id, branchId: branch.id, className: "Lower Body Blast", coach: "Coach Noura", day: "Monday", time: "07:00 PM", durationMin: 45, intensity: "Intermediate" },
      { gymId: gym.id, branchId: branch.id, className: "Aqua Fitness", coach: "Coach Sara", day: "Wednesday", time: "08:30 PM", durationMin: 40, intensity: "Beginner" },
    ]);

    await db.insert(communityChallenges).values({
      title: "30-Day Consistency", titleAr: "تحدي ٣٠ يوم", description: "Complete 20 workouts in 30 days.", descriptionAr: "أنجزي ٢٠ تمرين خلال ٣٠ يوم.",
      type: "sessions", targetValue: 20, xpReward: 300, startDate: new Date().toISOString().slice(0, 10), endDate: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10), isActive: true,
    });

    await db.insert(communityPosts).values([
      { userId: premiumId, type: "achievement", content: "خلصت أول تحدي! 🔥", contentEn: "Finished my first challenge!", visibility: "public", xpAwarded: 50, likesCount: 3 },
      { userId: freeId, type: "text", content: "بديت رحلتي اليوم 💪", contentEn: "Started my journey today", visibility: "public", xpAwarded: 20 },
    ]);

    await db.insert(socialNotifications).values({ userId: premiumId, actorId: freeId, type: "like", message: "أعجب بمنشورك", messageEn: "liked your post", isRead: false });

    await db.insert(rewardProbabilities).values([
      { name: "50 XP Bonus", nameAr: "٥٠ نقطة", type: "xp_bonus", rarity: "common", weight: 100, value: 50 },
      { name: "3 Premium Days", nameAr: "٣ أيام بريميوم", type: "premium_days", rarity: "uncommon", weight: 40, value: 3 },
      { name: "Streak Shield", nameAr: "درع السلسلة", type: "streak_protection", rarity: "rare", weight: 10, value: 1 },
      { name: "Lifetime Prime Fit", nameAr: "برايم فيت مدى الحياة", type: "upgrade", rarity: "jackpot", weight: 1, value: 1 },
    ]);

    await db.insert(siteAppearance).values({});

    await db.insert(exerciseOverrides).values([
      { exerciseId: "squat", nameEn: "Barbell Squat", nameAr: "سكوات بار", sets: 4, reps: 12, restSec: 90 },
      { exerciseId: "deadlift", nameEn: "Deadlift", nameAr: "ديدليفت", sets: 4, reps: 10, restSec: 120 },
    ]).onConflictDoNothing({ target: exerciseOverrides.exerciseId });
  }

  console.log("✓ Seed complete.");
  console.log("  admin@primefit.test / Admin123!  (admin)");
  console.log("  trainer@primefit.test / Trainer123!  (admin)");
  console.log("  premium@primefit.test / Premium123!  (Prime Pro)");
  console.log("  free@primefit.test / Free123!  (free)");
  await client.end();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  await client.end();
  process.exit(1);
});
