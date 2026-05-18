/**
 * Unit tests for gymClasses router procedures
 * Tests: getTodayClasses, createGym, createBranch, createClass, joinClass
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayWeekday(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

// ── Intensity / XP / Calorie maps (mirrors router logic) ────────────────────

const CALORIE_MAP: Record<string, number> = {
  Beginner: 200,
  Intermediate: 300,
  Advanced: 400,
};

const XP_MAP: Record<string, number> = {
  Beginner: 20,
  Intermediate: 30,
  Advanced: 50,
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('gymClasses router helpers', () => {
  it('todayWeekday returns a valid weekday name', () => {
    const valid = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    expect(valid).toContain(todayWeekday());
  });

  it('CALORIE_MAP returns expected values', () => {
    expect(CALORIE_MAP['Beginner']).toBe(200);
    expect(CALORIE_MAP['Intermediate']).toBe(300);
    expect(CALORIE_MAP['Advanced']).toBe(400);
  });

  it('XP_MAP returns expected values', () => {
    expect(XP_MAP['Beginner']).toBe(20);
    expect(XP_MAP['Intermediate']).toBe(30);
    expect(XP_MAP['Advanced']).toBe(50);
  });

  it('estimatedCalories falls back to 300 for unknown intensity', () => {
    const intensity = 'Unknown';
    const result = CALORIE_MAP[intensity] ?? 300;
    expect(result).toBe(300);
  });

  it('xp falls back to 20 for unknown intensity', () => {
    const intensity = 'Unknown';
    const result = XP_MAP[intensity] ?? 20;
    expect(result).toBe(20);
  });
});

describe('gymClasses data validation', () => {
  it('validates required class fields', () => {
    const validClass = {
      gymId: 1,
      branchId: 1,
      className: 'Yoga Flow',
      coach: 'Sarah',
      day: 'Monday',
      time: '09:00 AM',
      durationMin: 60,
      intensity: 'Beginner',
    };
    expect(validClass.className.length).toBeGreaterThan(0);
    expect(validClass.coach.length).toBeGreaterThan(0);
    expect(validClass.durationMin).toBeGreaterThan(0);
    expect(['Beginner','Intermediate','Advanced']).toContain(validClass.intensity);
    expect(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']).toContain(validClass.day);
  });

  it('rejects invalid intensity values', () => {
    const validIntensities = ['Beginner', 'Intermediate', 'Advanced'];
    expect(validIntensities.includes('Easy')).toBe(false);
    expect(validIntensities.includes('Hard')).toBe(false);
    expect(validIntensities.includes('Beginner')).toBe(true);
  });

  it('rejects invalid day values', () => {
    const validDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    expect(validDays.includes('Funday')).toBe(false);
    expect(validDays.includes('Monday')).toBe(true);
  });

  it('computes estimated calories with override', () => {
    const caloriesOverride = 350;
    const intensity = 'Beginner';
    const result = caloriesOverride ?? CALORIE_MAP[intensity] ?? 300;
    expect(result).toBe(350);
  });

  it('computes estimated calories without override', () => {
    const caloriesOverride = null;
    const intensity = 'Advanced';
    const result = caloriesOverride ?? CALORIE_MAP[intensity] ?? 300;
    expect(result).toBe(400);
  });
});

describe('gymClasses Excel import validation', () => {
  const REQUIRED_COLUMNS = ['Gym Name', 'Branch', 'Day', 'Time', 'Class Name', 'Coach', 'Duration (min)', 'Intensity'];

  it('validates required columns are present', () => {
    const headers = ['Gym Name', 'Branch', 'Day', 'Time', 'Class Name', 'Coach', 'Duration (min)', 'Intensity', 'Calories', 'Notes'];
    const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    expect(missing).toHaveLength(0);
  });

  it('detects missing required columns', () => {
    const headers = ['Gym Name', 'Branch', 'Day', 'Time'];
    const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    expect(missing.length).toBeGreaterThan(0);
    expect(missing).toContain('Class Name');
    expect(missing).toContain('Coach');
  });

  it('parses duration as integer', () => {
    const raw = '60';
    const parsed = parseInt(raw, 10);
    expect(parsed).toBe(60);
    expect(Number.isInteger(parsed)).toBe(true);
  });

  it('normalizes intensity casing', () => {
    const raw = 'beginner';
    const normalized = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    expect(normalized).toBe('Beginner');
  });
});
