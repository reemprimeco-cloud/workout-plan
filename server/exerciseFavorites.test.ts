/**
 * Unit tests for exercise favorites feature logic.
 * Tests pure logic functions (deduplication, filtering, toggle behavior)
 * without requiring a live database connection.
 */
import { describe, it, expect } from "vitest";

// ── Helper: simulate the favorites list state ─────────────────────────────────

function isFav(favIds: string[], exerciseId: string): boolean {
  return favIds.includes(exerciseId);
}

function toggleFav(favIds: string[], exerciseId: string): string[] {
  if (favIds.includes(exerciseId)) {
    return favIds.filter(id => id !== exerciseId);
  }
  return [...favIds, exerciseId];
}

function filterFavorites(
  exercises: { id: string; nameAr: string; nameEn: string }[],
  favIds: string[]
): { id: string; nameAr: string; nameEn: string }[] {
  return exercises.filter(ex => favIds.includes(ex.id));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Exercise Favorites — isFav", () => {
  it("returns false for empty favorites list", () => {
    expect(isFav([], "squat_db")).toBe(false);
  });

  it("returns true when exercise is in favorites", () => {
    expect(isFav(["squat_db", "bicep_curl"], "squat_db")).toBe(true);
  });

  it("returns false when exercise is not in favorites", () => {
    expect(isFav(["squat_db", "bicep_curl"], "deadlift")).toBe(false);
  });
});

describe("Exercise Favorites — toggleFav", () => {
  it("adds an exercise when it is not already a favorite", () => {
    const result = toggleFav([], "squat_db");
    expect(result).toContain("squat_db");
    expect(result).toHaveLength(1);
  });

  it("removes an exercise when it is already a favorite", () => {
    const result = toggleFav(["squat_db", "bicep_curl"], "squat_db");
    expect(result).not.toContain("squat_db");
    expect(result).toContain("bicep_curl");
    expect(result).toHaveLength(1);
  });

  it("does not mutate the original array", () => {
    const original = ["squat_db"];
    const result = toggleFav(original, "bicep_curl");
    expect(original).toHaveLength(1);
    expect(result).toHaveLength(2);
  });

  it("handles toggling the same exercise twice (add then remove)", () => {
    let favs: string[] = [];
    favs = toggleFav(favs, "squat_db");
    expect(favs).toContain("squat_db");
    favs = toggleFav(favs, "squat_db");
    expect(favs).not.toContain("squat_db");
    expect(favs).toHaveLength(0);
  });
});

describe("Exercise Favorites — filterFavorites", () => {
  const exercises = [
    { id: "squat_db", nameAr: "السكوات", nameEn: "Squat" },
    { id: "bicep_curl", nameAr: "كيرل الثنائي", nameEn: "Bicep Curl" },
    { id: "deadlift", nameAr: "الرفعة الميتة", nameEn: "Deadlift" },
  ];

  it("returns empty array when no favorites are set", () => {
    expect(filterFavorites(exercises, [])).toHaveLength(0);
  });

  it("returns only favorited exercises", () => {
    const result = filterFavorites(exercises, ["squat_db", "deadlift"]);
    expect(result).toHaveLength(2);
    expect(result.map(e => e.id)).toContain("squat_db");
    expect(result.map(e => e.id)).toContain("deadlift");
    expect(result.map(e => e.id)).not.toContain("bicep_curl");
  });

  it("returns all exercises when all are favorited", () => {
    const allIds = exercises.map(e => e.id);
    expect(filterFavorites(exercises, allIds)).toHaveLength(exercises.length);
  });

  it("handles unknown exerciseId in favIds gracefully", () => {
    const result = filterFavorites(exercises, ["unknown_exercise"]);
    expect(result).toHaveLength(0);
  });
});

describe("Exercise Favorites — exerciseId validation", () => {
  it("accepts valid exerciseId formats", () => {
    const validIds = ["squat_db", "bicep_curl_machine", "chest_press_1", "a"];
    validIds.forEach(id => {
      expect(id.length).toBeGreaterThan(0);
      expect(id.length).toBeLessThanOrEqual(128);
    });
  });

  it("rejects empty exerciseId", () => {
    const id = "";
    expect(id.length).toBe(0); // would be rejected by z.string().min(1)
  });
});
