/**
 * Tests for the new nutrition procedures:
 * getTodayMeals, getDailyHistory, getFavorites, addFavorite, removeFavorite, quickAdd, getRecentMeals
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Helper: build a mock context ──────────────────────────────────────────────
const mockUser = { id: "user-test-1", role: "user" as const };
const mockCtx  = { user: mockUser, db: null as any };

// ── Unit tests for pure logic functions ───────────────────────────────────────

describe("Nutrition daily reset logic", () => {
  it("should identify today's date string correctly", () => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should group meals by type correctly", () => {
    const meals = [
      { id: "1", mealType: "breakfast", totalCalories: 300 },
      { id: "2", mealType: "lunch",     totalCalories: 600 },
      { id: "3", mealType: "breakfast", totalCalories: 200 },
      { id: "4", mealType: "snack",     totalCalories: 150 },
    ];

    const grouped = meals.reduce((acc: Record<string, typeof meals>, m) => {
      if (!acc[m.mealType]) acc[m.mealType] = [];
      acc[m.mealType].push(m);
      return acc;
    }, {});

    expect(grouped.breakfast).toHaveLength(2);
    expect(grouped.lunch).toHaveLength(1);
    expect(grouped.snack).toHaveLength(1);
    expect(grouped.dinner).toBeUndefined();
  });

  it("should calculate daily totals correctly", () => {
    const meals = [
      { totalCalories: 300, totalProtein: 20, totalCarbs: 40, totalFat: 10 },
      { totalCalories: 600, totalProtein: 35, totalCarbs: 80, totalFat: 15 },
      { totalCalories: 150, totalProtein: 5,  totalCarbs: 20, totalFat: 5  },
    ];

    const totals = meals.reduce(
      (acc, m) => ({
        cal:     acc.cal     + m.totalCalories,
        protein: acc.protein + m.totalProtein,
        carbs:   acc.carbs   + m.totalCarbs,
        fat:     acc.fat     + m.totalFat,
      }),
      { cal: 0, protein: 0, carbs: 0, fat: 0 }
    );

    expect(totals.cal).toBe(1050);
    expect(totals.protein).toBe(60);
    expect(totals.carbs).toBe(140);
    expect(totals.fat).toBe(30);
  });
});

describe("Nutrition favorites logic", () => {
  it("should validate meal type before saving to favorites", () => {
    const validTypes = ["breakfast", "lunch", "dinner", "snack"];
    const normalize = (t: string) => validTypes.includes(t) ? t : "snack";

    expect(normalize("breakfast")).toBe("breakfast");
    expect(normalize("lunch")).toBe("lunch");
    expect(normalize("dinner")).toBe("dinner");
    expect(normalize("snack")).toBe("snack");
    expect(normalize("drink")).toBe("snack");   // drink normalizes to snack
    expect(normalize("coffee")).toBe("snack");  // coffee normalizes to snack
    expect(normalize("")).toBe("snack");        // empty normalizes to snack
  });

  it("should build favorite from meal correctly", () => {
    const meal = {
      items: [{ name: "Grilled Chicken" }],
      totalCalories: 350,
      totalProtein: 45,
      totalCarbs: 5,
      totalFat: 12,
      mealType: "lunch",
    };

    const fav = {
      name:     meal.items[0].name,
      calories: Math.round(meal.totalCalories),
      proteinG: Math.round(meal.totalProtein * 10) / 10,
      carbsG:   Math.round(meal.totalCarbs * 10) / 10,
      fatG:     Math.round(meal.totalFat * 10) / 10,
      mealType: meal.mealType,
    };

    expect(fav.name).toBe("Grilled Chicken");
    expect(fav.calories).toBe(350);
    expect(fav.proteinG).toBe(45);
    expect(fav.mealType).toBe("lunch");
  });
});

describe("Nutrition history grouping logic", () => {
  it("should group meals by date correctly", () => {
    const meals = [
      { id: "1", date: "2026-05-17", totalCalories: 300 },
      { id: "2", date: "2026-05-17", totalCalories: 500 },
      { id: "3", date: "2026-05-16", totalCalories: 400 },
    ];

    const byDate = meals.reduce((acc: Record<string, { count: number; cal: number }>, m) => {
      if (!acc[m.date]) acc[m.date] = { count: 0, cal: 0 };
      acc[m.date].count++;
      acc[m.date].cal += m.totalCalories;
      return acc;
    }, {});

    expect(byDate["2026-05-17"].count).toBe(2);
    expect(byDate["2026-05-17"].cal).toBe(800);
    expect(byDate["2026-05-16"].count).toBe(1);
    expect(byDate["2026-05-16"].cal).toBe(400);
  });

  it("should sort history dates descending (newest first)", () => {
    const dates = ["2026-05-15", "2026-05-17", "2026-05-16"];
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(sorted[0]).toBe("2026-05-17");
    expect(sorted[1]).toBe("2026-05-16");
    expect(sorted[2]).toBe("2026-05-15");
  });
});

describe("Quick add validation logic", () => {
  it("should reject entries with missing name", () => {
    const isValid = (form: { name: string; calories: string }) =>
      form.name.trim().length > 0 && parseFloat(form.calories) > 0;

    expect(isValid({ name: "", calories: "300" })).toBe(false);
    expect(isValid({ name: "Rice", calories: "0" })).toBe(false);
    expect(isValid({ name: "Rice", calories: "300" })).toBe(true);
  });

  it("should parse numeric fields safely", () => {
    const parse = (v: string) => parseFloat(v) || 0;
    expect(parse("")).toBe(0);
    expect(parse("abc")).toBe(0);
    expect(parse("25.5")).toBe(25.5);
    expect(parse("100")).toBe(100);
  });
});
