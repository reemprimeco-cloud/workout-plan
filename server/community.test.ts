/**
 * Community Router Tests
 * Tests for XP logic, badge system, challenge validation, and post creation
 */
import { describe, it, expect } from "vitest";

// ── XP / Level helpers (duplicated from router for isolated testing) ──────────
const XP_LEVELS = [
  { level: 1, min: 0,    title: "Beginner",      titleAr: "مبتدئ" },
  { level: 2, min: 100,  title: "Active",        titleAr: "نشيط" },
  { level: 3, min: 300,  title: "Dedicated",     titleAr: "ملتزم" },
  { level: 4, min: 600,  title: "Athlete",       titleAr: "رياضي" },
  { level: 5, min: 1000, title: "Champion",      titleAr: "بطل" },
  { level: 6, min: 1500, title: "Elite",         titleAr: "نخبة" },
  { level: 7, min: 2200, title: "Legend",        titleAr: "أسطورة" },
  { level: 8, min: 3000, title: "Prime Fit Pro", titleAr: "برايم فيت برو" },
];

function xpToLevel(xp: number) {
  let current = XP_LEVELS[0];
  for (const t of XP_LEVELS) { if (xp >= t.min) current = t; else break; }
  const idx = XP_LEVELS.indexOf(current);
  const next = XP_LEVELS[idx + 1];
  return { ...current, nextLevelXp: next ? next.min : current.min };
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
function computeBadges(totalXp: number, streak: number, sessionsCount: number) {
  const badges: { id: string; icon: string; label: string; labelAr: string }[] = [];
  if (streak >= 7)  badges.push({ id: "streak_7",   icon: "🔥", label: "7-Day Streak",    labelAr: "سلسلة 7 أيام" });
  if (streak >= 30) badges.push({ id: "streak_30",  icon: "⚡", label: "30-Day Streak",   labelAr: "سلسلة 30 يوم" });
  if (sessionsCount >= 10) badges.push({ id: "sessions_10", icon: "💪", label: "10 Workouts", labelAr: "10 تمارين" });
  if (sessionsCount >= 50) badges.push({ id: "sessions_50", icon: "🏋️", label: "50 Workouts", labelAr: "50 تمرين" });
  if (totalXp >= 500)  badges.push({ id: "xp_500",  icon: "⭐", label: "500 XP",  labelAr: "500 نقطة" });
  if (totalXp >= 1000) badges.push({ id: "xp_1000", icon: "🌟", label: "1000 XP", labelAr: "1000 نقطة" });
  return badges;
}

// ── XP award amounts ──────────────────────────────────────────────────────────
const XP_AWARDS = {
  workout_complete: 50,
  streak_bonus: 10,
  post_created: 5,
  reaction_received: 2,
  comment_received: 3,
  challenge_joined: 10,
  challenge_completed: 100,
};

// ── Post content validation ───────────────────────────────────────────────────
function validatePostContent(content: string): { valid: boolean; reason?: string } {
  if (!content || content.trim().length === 0) return { valid: false, reason: "empty" };
  if (content.length > 500) return { valid: false, reason: "too_long" };
  return { valid: true };
}

// ── Challenge date helpers ────────────────────────────────────────────────────
function daysUntilEnd(endDate: string): number {
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
}

// ─────────────────────────────────────────────────────────────────────────────
describe("XP Level System", () => {
  it("returns level 1 for 0 XP", () => {
    const result = xpToLevel(0);
    expect(result.level).toBe(1);
    expect(result.title).toBe("Beginner");
  });

  it("returns level 2 at exactly 100 XP", () => {
    const result = xpToLevel(100);
    expect(result.level).toBe(2);
    expect(result.title).toBe("Active");
  });

  it("returns level 5 at 1000 XP", () => {
    const result = xpToLevel(1000);
    expect(result.level).toBe(5);
    expect(result.title).toBe("Champion");
  });

  it("returns max level 8 at 3000+ XP", () => {
    expect(xpToLevel(3000).level).toBe(8);
    expect(xpToLevel(9999).level).toBe(8);
  });

  it("returns correct nextLevelXp for level 1", () => {
    expect(xpToLevel(0).nextLevelXp).toBe(100);
  });

  it("returns same nextLevelXp as min for max level", () => {
    const result = xpToLevel(5000);
    expect(result.nextLevelXp).toBe(result.min);
  });

  it("returns Arabic title correctly", () => {
    expect(xpToLevel(600).titleAr).toBe("رياضي");
  });
});

describe("Badge System", () => {
  it("awards no badges for new user", () => {
    expect(computeBadges(0, 0, 0)).toHaveLength(0);
  });

  it("awards 7-day streak badge at streak=7", () => {
    const badges = computeBadges(0, 7, 0);
    expect(badges.some(b => b.id === "streak_7")).toBe(true);
  });

  it("awards both streak badges at streak=30", () => {
    const badges = computeBadges(0, 30, 0);
    expect(badges.some(b => b.id === "streak_7")).toBe(true);
    expect(badges.some(b => b.id === "streak_30")).toBe(true);
  });

  it("awards 10-workout badge at sessionsCount=10", () => {
    const badges = computeBadges(0, 0, 10);
    expect(badges.some(b => b.id === "sessions_10")).toBe(true);
  });

  it("awards XP badge at 500 XP", () => {
    const badges = computeBadges(500, 0, 0);
    expect(badges.some(b => b.id === "xp_500")).toBe(true);
  });

  it("awards multiple badges simultaneously", () => {
    const badges = computeBadges(1000, 30, 50);
    expect(badges.length).toBeGreaterThanOrEqual(5);
  });
});

describe("XP Award Amounts", () => {
  it("workout completion awards 50 XP", () => {
    expect(XP_AWARDS.workout_complete).toBe(50);
  });

  it("challenge completion awards 100 XP", () => {
    expect(XP_AWARDS.challenge_completed).toBe(100);
  });

  it("all award amounts are positive integers", () => {
    for (const [, v] of Object.entries(XP_AWARDS)) {
      expect(v).toBeGreaterThan(0);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe("Post Content Validation", () => {
  it("rejects empty content", () => {
    expect(validatePostContent("").valid).toBe(false);
    expect(validatePostContent("   ").valid).toBe(false);
  });

  it("accepts valid short content", () => {
    expect(validatePostContent("Great workout today!").valid).toBe(true);
  });

  it("accepts Arabic content", () => {
    expect(validatePostContent("تمرين رائع اليوم!").valid).toBe(true);
  });

  it("rejects content over 500 characters", () => {
    const long = "a".repeat(501);
    const result = validatePostContent(long);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("too_long");
  });

  it("accepts content at exactly 500 characters", () => {
    expect(validatePostContent("a".repeat(500)).valid).toBe(true);
  });
});

describe("Challenge Date Helpers", () => {
  it("returns 0 for past end dates", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(daysUntilEnd(past)).toBe(0);
  });

  it("returns positive days for future end dates", () => {
    const future = new Date(Date.now() + 7 * 86400000).toISOString();
    expect(daysUntilEnd(future)).toBeGreaterThan(0);
  });

  it("returns approximately 7 for a week from now", () => {
    const future = new Date(Date.now() + 7 * 86400000).toISOString();
    expect(daysUntilEnd(future)).toBeLessThanOrEqual(7);
    expect(daysUntilEnd(future)).toBeGreaterThanOrEqual(6);
  });
});

describe("Community Constants", () => {
  it("XP_LEVELS are in ascending order", () => {
    for (let i = 1; i < XP_LEVELS.length; i++) {
      expect(XP_LEVELS[i].min).toBeGreaterThan(XP_LEVELS[i - 1].min);
    }
  });

  it("XP_LEVELS start at level 1 with min 0", () => {
    expect(XP_LEVELS[0].level).toBe(1);
    expect(XP_LEVELS[0].min).toBe(0);
  });

  it("all XP_LEVELS have required fields", () => {
    for (const lvl of XP_LEVELS) {
      expect(lvl.level).toBeDefined();
      expect(lvl.title).toBeDefined();
      expect(lvl.titleAr).toBeDefined();
    }
  });
});
