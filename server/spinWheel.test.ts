import { describe, it, expect } from "vitest";

// ── Probability engine unit tests ─────────────────────────────────────────────
// These tests verify the core probability selection logic in isolation,
// without requiring a database connection.

type Reward = { id: number; name: string; probability: number; tier: string; isActive: boolean };

function selectReward(rewards: Reward[]): Reward | null {
  const active = rewards.filter(r => r.isActive);
  if (active.length === 0) return null;
  const total = active.reduce((sum, r) => sum + r.probability, 0);
  if (total === 0) return null;
  let roll = Math.random() * total;
  for (const r of active) {
    roll -= r.probability;
    if (roll <= 0) return r;
  }
  return active[active.length - 1];
}

const SAMPLE_REWARDS: Reward[] = [
  { id: 1, name: "3 Days Free", probability: 20, tier: "common", isActive: true },
  { id: 2, name: "50 XP Bonus", probability: 20, tier: "common", isActive: true },
  { id: 3, name: "Small AI Boost", probability: 10, tier: "common", isActive: true },
  { id: 4, name: "Streak Protection", probability: 10, tier: "common", isActive: true },
  { id: 5, name: "1 Week Free", probability: 15, tier: "uncommon", isActive: true },
  { id: 6, name: "200 XP Bonus", probability: 10, tier: "uncommon", isActive: true },
  { id: 7, name: "Premium Badge", probability: 3, tier: "uncommon", isActive: true },
  { id: 8, name: "Special Workout", probability: 2, tier: "uncommon", isActive: true },
  { id: 9, name: "1 Month Free", probability: 5, tier: "rare", isActive: true },
  { id: 10, name: "Prime Pro Upgrade", probability: 2, tier: "rare", isActive: true },
  { id: 11, name: "AI Insights", probability: 1.5, tier: "rare", isActive: true },
  { id: 12, name: "Exclusive Badge", probability: 0.5, tier: "rare", isActive: true },
  { id: 13, name: "3 Months Free", probability: 0.5, tier: "jackpot", isActive: true },
  { id: 14, name: "Lifetime Premium", probability: 0.3, tier: "jackpot", isActive: true },
  { id: 15, name: "Elite Program", probability: 0.2, tier: "jackpot", isActive: true },
];

describe("SpinWheel probability engine", () => {
  it("always returns a reward when active rewards exist", () => {
    for (let i = 0; i < 100; i++) {
      const result = selectReward(SAMPLE_REWARDS);
      expect(result).not.toBeNull();
    }
  });

  it("returns null when no active rewards", () => {
    const inactive = SAMPLE_REWARDS.map(r => ({ ...r, isActive: false }));
    expect(selectReward(inactive)).toBeNull();
  });

  it("returns null for empty array", () => {
    expect(selectReward([])).toBeNull();
  });

  it("respects probability distribution over many trials", () => {
    const counts: Record<number, number> = {};
    const TRIALS = 10000;
    for (let i = 0; i < TRIALS; i++) {
      const r = selectReward(SAMPLE_REWARDS)!;
      counts[r.id] = (counts[r.id] ?? 0) + 1;
    }
    // Common rewards (id 1-4, prob 20/20/10/10) should appear more than rare (id 9-12)
    const commonHits = (counts[1] ?? 0) + (counts[2] ?? 0);
    const rareHits = (counts[9] ?? 0) + (counts[10] ?? 0) + (counts[11] ?? 0) + (counts[12] ?? 0);
    expect(commonHits).toBeGreaterThan(rareHits);
  });

  it("only returns active rewards", () => {
    const mixedRewards: Reward[] = [
      { id: 1, name: "Active", probability: 50, tier: "common", isActive: true },
      { id: 2, name: "Inactive", probability: 50, tier: "common", isActive: false },
    ];
    for (let i = 0; i < 50; i++) {
      const r = selectReward(mixedRewards)!;
      expect(r.id).toBe(1);
    }
  });

  it("handles single reward correctly", () => {
    const single: Reward[] = [{ id: 1, name: "Only", probability: 100, tier: "jackpot", isActive: true }];
    const result = selectReward(single);
    expect(result?.id).toBe(1);
  });

  it("total probability sums correctly for sample rewards", () => {
    const total = SAMPLE_REWARDS.reduce((s, r) => s + r.probability, 0);
    expect(total).toBeCloseTo(100, 0);
  });
});
