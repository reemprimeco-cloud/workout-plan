/**
 * Spin Wheel Router
 * Handles reward spin lifecycle: eligibility check → spin → apply reward
 * All probability logic is server-side to prevent client-side manipulation.
 */
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";
import { protectedProcedure, router } from "../_core/trpc";
import { adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  rewardProbabilities,
  rewardSpins,
  rewardHistory,
  challengeRewards,
  jackpotWinners,
  challengeParticipants,
  communityXpLog,
  users,
} from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

// ── Default Reward Catalog ────────────────────────────────────────────────────
// Seeded on first use if the table is empty.
const DEFAULT_REWARDS = [
  // COMMON (total weight ~600 → ~60%)
  { name: "3 Days Free Premium",       nameAr: "3 أيام بريميوم مجانية",    type: "premium_days"       as const, rarity: "common"   as const, weight: 200, value: 3,   icon: "🎁", color: "#4A90D9" },
  { name: "50 XP Bonus",               nameAr: "50 نقطة XP إضافية",        type: "xp_bonus"           as const, rarity: "common"   as const, weight: 180, value: 50,  icon: "⭐", color: "#5BA85B" },
  { name: "Small AI Boost",            nameAr: "تعزيز ذكاء اصطناعي صغير",  type: "ai_boost"           as const, rarity: "common"   as const, weight: 130, value: 1,   icon: "🤖", color: "#7BB8D4" },
  { name: "Streak Protection",         nameAr: "حماية السلسلة",             type: "streak_protection"  as const, rarity: "common"   as const, weight: 90,  value: 1,   icon: "🛡️", color: "#A0A0D0" },
  // UNCOMMON (total weight ~300 → ~30%)
  { name: "1 Week Free Premium",       nameAr: "أسبوع بريميوم مجاني",      type: "premium_days"       as const, rarity: "uncommon" as const, weight: 120, value: 7,   icon: "🏆", color: "#E8A020" },
  { name: "200 XP Bonus",              nameAr: "200 نقطة XP إضافية",       type: "xp_bonus"           as const, rarity: "uncommon" as const, weight: 90,  value: 200, icon: "💎", color: "#D4A820" },
  { name: "Premium Badge",             nameAr: "شارة بريميوم",              type: "badge"              as const, rarity: "uncommon" as const, weight: 60,  value: 1,   icon: "🎖️", color: "#C87020" },
  { name: "Special Workout Unlock",    nameAr: "تمرين خاص مفتوح",          type: "workout_unlock"     as const, rarity: "uncommon" as const, weight: 30,  value: 1,   icon: "🔓", color: "#B06030" },
  // RARE (total weight ~90 → ~9%)
  { name: "1 Month Free Premium",      nameAr: "شهر بريميوم مجاني",        type: "premium_days"       as const, rarity: "rare"     as const, weight: 40,  value: 30,  icon: "🌟", color: "#C040C0" },
  { name: "Prime Pro Upgrade",         nameAr: "ترقية برايم برو مؤقتة",    type: "upgrade"            as const, rarity: "rare"     as const, weight: 25,  value: 7,   icon: "⚡", color: "#A020A0" },
  { name: "Advanced AI Insights",      nameAr: "رؤى ذكاء اصطناعي متقدمة", type: "ai_insights"        as const, rarity: "rare"     as const, weight: 15,  value: 30,  icon: "🧠", color: "#8000C0" },
  { name: "Exclusive Community Badge", nameAr: "شارة مجتمع حصرية",         type: "badge"              as const, rarity: "rare"     as const, weight: 10,  value: 1,   icon: "🏅", color: "#6000A0" },
  // JACKPOT (total weight ~10 → ~1%)
  { name: "3 Months Free Premium",     nameAr: "3 أشهر بريميوم مجانية",   type: "premium_days"       as const, rarity: "jackpot"  as const, weight: 5,   value: 90,  icon: "🎰", color: "#FF4040" },
  { name: "Lifetime Prime Fit",        nameAr: "برايم فت مدى الحياة",      type: "premium_days"       as const, rarity: "jackpot"  as const, weight: 3,   value: 3650,icon: "👑", color: "#FF2020" },
  { name: "Elite Transformation",      nameAr: "برنامج التحول النخبوي",    type: "upgrade"            as const, rarity: "jackpot"  as const, weight: 2,   value: 90,  icon: "🚀", color: "#FF0000" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function ensureDefaultRewards(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const existing = await db.select({ id: rewardProbabilities.id }).from(rewardProbabilities).limit(1);
  if (existing.length > 0) return;
  await db.insert(rewardProbabilities).values(DEFAULT_REWARDS);
}

/** Weighted random selection — pure server-side, no client influence */
async function pickReward(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, challengeId: number) {
  // Check for challenge-specific overrides
  const overrides = await db
    .select({ rewardId: challengeRewards.rewardId, weightOverride: challengeRewards.weightOverride })
    .from(challengeRewards)
    .where(eq(challengeRewards.challengeId, challengeId));

  type PoolItem = { id: number; weight: number; rarity: "common" | "uncommon" | "rare" | "jackpot"; name: string; nameAr: string; type: string; value: number | null; icon: string | null; color: string | null };
  let pool: PoolItem[];

  if (overrides.length > 0) {
    const ids = overrides.map(o => o.rewardId);
    const rewards = await db.select().from(rewardProbabilities)
      .where(and(eq(rewardProbabilities.isEnabled, true)));
    pool = rewards
      .filter(r => ids.includes(r.id))
      .map(r => {
        const ov = overrides.find(o => o.rewardId === r.id);
        return { ...r, weight: ov?.weightOverride ?? r.weight };
      });
  } else {
    const rewards = await db.select().from(rewardProbabilities)
      .where(eq(rewardProbabilities.isEnabled, true));
    pool = rewards.map(r => ({ ...r }));
  }

  if (pool.length === 0) throw new Error("No rewards configured");

  const totalWeight = pool.reduce((sum, r) => sum + r.weight, 0);
  // PF-015: use a CSPRNG for reward selection. Weights are integers, so
  // randomInt(totalWeight) draws a uniform integer in [0, totalWeight).
  let rand = totalWeight > 0 ? crypto.randomInt(totalWeight) : 0;
  for (const reward of pool) {
    rand -= reward.weight;
    if (rand < 0) return reward;
  }
  return pool[pool.length - 1];
}

// ── Router ────────────────────────────────────────────────────────────────────
export const spinWheelRouter = router({

  /** Get all enabled rewards for wheel display (client uses this to render segments) */
  getRewards: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await ensureDefaultRewards(db);
    return db.select().from(rewardProbabilities)
      .where(eq(rewardProbabilities.isEnabled, true))
      .orderBy(rewardProbabilities.rarity, rewardProbabilities.weight);
  }),

  /**
   * Check if the user has a pending spin for a completed challenge.
   * Returns the spin token if eligible, null otherwise.
   */
  checkEligibility: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      // Verify challenge completion
      const [participation] = await db
        .select()
        .from(challengeParticipants)
        .where(
          and(
            eq(challengeParticipants.challengeId, input.challengeId),
            eq(challengeParticipants.userId, ctx.user.id),
          )
        )
        .limit(1);

      if (!participation?.completedAt) return { eligible: false, spin: null };

      // Check for existing spin record
      const [existingSpin] = await db
        .select()
        .from(rewardSpins)
        .where(
          and(
            eq(rewardSpins.userId, ctx.user.id),
            eq(rewardSpins.challengeId, input.challengeId),
          )
        )
        .limit(1);

      if (!existingSpin) {
        // Create a new pending spin with a one-time token
        const token = crypto.randomBytes(32).toString("hex");
        const [inserted] = await db.insert(rewardSpins).values({
          userId: ctx.user.id,
          challengeId: input.challengeId,
          spinToken: token,
          status: "pending",
        }).returning({ id: rewardSpins.id });
        const spinId = inserted?.id;
        return { eligible: true, spin: { id: spinId, token, status: "pending" as const } };
      }

      if (existingSpin.status === "pending") {
        return { eligible: true, spin: { id: existingSpin.id, token: existingSpin.spinToken, status: "pending" as const } };
      }

      // Already spun or claimed
      return { eligible: false, spin: { id: existingSpin.id, token: existingSpin.spinToken, status: existingSpin.status } };
    }),

  /**
   * Execute the spin. Server picks the reward using weighted probability.
   * Returns the reward so the client can animate the wheel stopping on it.
   * Anti-abuse: validates spinToken, one-time use only.
   */
  spin: protectedProcedure
    .input(z.object({ spinToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await ensureDefaultRewards(db);

      // Validate token
      const [spin] = await db
        .select()
        .from(rewardSpins)
        .where(
          and(
            eq(rewardSpins.spinToken, input.spinToken),
            eq(rewardSpins.userId, ctx.user.id),
            eq(rewardSpins.status, "pending"),
          )
        )
        .limit(1);

      if (!spin) throw new Error("Invalid or already-used spin token");

      // Pick reward server-side
      const reward = await pickReward(db, spin.challengeId);

      // Mark spin as spun
      await db.update(rewardSpins)
        .set({ status: "spun", rewardId: reward.id, spunAt: new Date() })
        .where(eq(rewardSpins.id, spin.id));

      // Record in history
      await db.insert(rewardHistory).values({
        userId: ctx.user.id,
        spinId: spin.id,
        rewardId: reward.id,
        rewardName: reward.name,
        rarity: reward.rarity as any,
        value: reward.value ?? 0,
      });

      // Apply XP reward immediately
      if (reward.type === "xp_bonus" && reward.value) {
        await db.insert(communityXpLog).values({
          userId: ctx.user.id,
          event: "spin_reward",
          points: reward.value,
          refId: spin.id,
        });
      }

      // Log jackpot winners separately and notify admin
      if (reward.rarity === "jackpot") {
        await db.insert(jackpotWinners).values({
          userId: ctx.user.id,
          spinId: spin.id,
          rewardId: reward.id,
          rewardName: reward.name,
          notifiedAdmin: false,
        });
        // Notify admin
        const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
        await notifyOwner({
          title: "🎰 JACKPOT Winner!",
          content: `User ${user?.name ?? ctx.user.id} won a JACKPOT reward: ${reward.name} (${reward.nameAr})`,
        });
        await db.update(jackpotWinners)
          .set({ notifiedAdmin: true })
          .where(and(eq(jackpotWinners.spinId, spin.id), eq(jackpotWinners.userId, ctx.user.id)));
      }

      return {
        reward: {
          id: reward.id,
          name: reward.name,
          nameAr: reward.nameAr,
          type: reward.type,
          rarity: reward.rarity,
          value: reward.value ?? 0,
          icon: reward.icon ?? "🎁",
          color: reward.color ?? "#7BB8D4",
        },
        spinId: spin.id,
      };
    }),

  /** Claim the reward (mark as claimed after animation completes) */
  claimReward: protectedProcedure
    .input(z.object({ spinId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(rewardSpins)
        .set({ status: "claimed", claimedAt: new Date() })
        .where(
          and(
            eq(rewardSpins.id, input.spinId),
            eq(rewardSpins.userId, ctx.user.id),
            eq(rewardSpins.status, "spun"),
          )
        );
      return { success: true };
    }),

  /** Get user's reward history */
  getMyHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    return db.select().from(rewardHistory)
      .where(eq(rewardHistory.userId, ctx.user.id))
      .orderBy(desc(rewardHistory.appliedAt))
      .limit(50);
  }),

  // ── Admin Procedures ────────────────────────────────────────────────────────

  adminGetRewards: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await ensureDefaultRewards(db);
    return db.select().from(rewardProbabilities).orderBy(rewardProbabilities.rarity, rewardProbabilities.weight);
  }),

  adminUpdateReward: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      nameAr: z.string().optional(),
      weight: z.number().min(1).max(10000).optional(),
      value: z.number().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      isEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { id, ...updates } = input;
      await db.update(rewardProbabilities).set(updates).where(eq(rewardProbabilities.id, id));
      return { success: true };
    }),

  adminAddReward: adminProcedure
    .input(z.object({
      name: z.string(),
      nameAr: z.string(),
      type: z.enum(["premium_days", "xp_bonus", "badge", "ai_boost", "streak_protection", "workout_unlock", "ai_insights", "upgrade"]),
      rarity: z.enum(["common", "uncommon", "rare", "jackpot"]),
      weight: z.number().min(1).max(10000),
      value: z.number().default(0),
      icon: z.string().default("🎁"),
      color: z.string().default("#7BB8D4"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.insert(rewardProbabilities).values({ ...input, isEnabled: true });
      return { success: true };
    }),

  adminDeleteReward: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(rewardProbabilities)
        .set({ isEnabled: false })
        .where(eq(rewardProbabilities.id, input.id));
      return { success: true };
    }),

  adminGetHistory: adminProcedure
    .input(z.object({ limit: z.number().default(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      return db
        .select({
          id: rewardHistory.id,
          userId: rewardHistory.userId,
          userName: users.name,
          rewardName: rewardHistory.rewardName,
          rarity: rewardHistory.rarity,
          value: rewardHistory.value,
          appliedAt: rewardHistory.appliedAt,
        })
        .from(rewardHistory)
        .leftJoin(users, eq(users.id, rewardHistory.userId))
        .orderBy(desc(rewardHistory.appliedAt))
        .limit(input.limit);
    }),

  adminGetJackpotWinners: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    return db
      .select({
        id: jackpotWinners.id,
        userId: jackpotWinners.userId,
        userName: users.name,
        rewardName: jackpotWinners.rewardName,
        wonAt: jackpotWinners.wonAt,
      })
      .from(jackpotWinners)
      .leftJoin(users, eq(users.id, jackpotWinners.userId))
      .orderBy(desc(jackpotWinners.wonAt));
  }),

  adminGetStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [totalSpins] = await db.select({ count: sql<number>`count(*)` }).from(rewardSpins);
    const [jackpots] = await db.select({ count: sql<number>`count(*)` }).from(jackpotWinners);
    const [rareWins] = await db.select({ count: sql<number>`count(*)` }).from(rewardHistory)
      .where(eq(rewardHistory.rarity, "rare"));
    return {
      totalSpins: totalSpins?.count ?? 0,
      jackpotWins: jackpots?.count ?? 0,
      rareWins: rareWins?.count ?? 0,
    };
  }),
});
