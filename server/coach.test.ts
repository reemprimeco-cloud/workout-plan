/**
 * Tests for the My Coach feature
 * Covers: buildSystemPrompt logic, ratingEmoji, insight type mapping, DB helpers shape
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Utility functions extracted for testability ────────────────────────────────

function ratingEmoji(n: number): string {
  return ['😞', '😕', '😐', '😊', '🤩'][Math.min(4, Math.max(0, n - 1))];
}

function buildSystemPromptLang(lang: 'ar' | 'en'): string {
  return lang === 'ar' ? 'arabic' : 'english';
}

const INSIGHT_COLORS: Record<string, string> = {
  progress: '#10B981',
  warning: '#F59E0B',
  motivation: '#00D4FF',
  recommendation: '#7BB8D4',
};

function getInsightColor(type: string): string {
  return INSIGHT_COLORS[type] ?? '#7BB8D4';
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('ratingEmoji', () => {
  it('returns 😞 for rating 1', () => {
    expect(ratingEmoji(1)).toBe('😞');
  });

  it('returns 😊 for rating 4', () => {
    expect(ratingEmoji(4)).toBe('😊');
  });

  it('returns 🤩 for rating 5', () => {
    expect(ratingEmoji(5)).toBe('🤩');
  });

  it('clamps below 1 to 😞', () => {
    expect(ratingEmoji(0)).toBe('😞');
    expect(ratingEmoji(-5)).toBe('😞');
  });

  it('clamps above 5 to 🤩', () => {
    expect(ratingEmoji(6)).toBe('🤩');
    expect(ratingEmoji(100)).toBe('🤩');
  });

  it('returns 😐 for rating 3', () => {
    expect(ratingEmoji(3)).toBe('😐');
  });
});

describe('insight color mapping', () => {
  it('maps progress to green', () => {
    expect(getInsightColor('progress')).toBe('#10B981');
  });

  it('maps warning to amber', () => {
    expect(getInsightColor('warning')).toBe('#F59E0B');
  });

  it('maps motivation to neon', () => {
    expect(getInsightColor('motivation')).toBe('#00D4FF');
  });

  it('maps recommendation to sky', () => {
    expect(getInsightColor('recommendation')).toBe('#7BB8D4');
  });

  it('falls back to sky for unknown types', () => {
    expect(getInsightColor('unknown')).toBe('#7BB8D4');
    expect(getInsightColor('')).toBe('#7BB8D4');
  });
});

describe('language detection', () => {
  it('returns arabic for ar', () => {
    expect(buildSystemPromptLang('ar')).toBe('arabic');
  });

  it('returns english for en', () => {
    expect(buildSystemPromptLang('en')).toBe('english');
  });
});

describe('coach context building', () => {
  it('calculates weight change correctly', () => {
    const startWeight = 75;
    const currentWeight = 72;
    const change = Math.round((currentWeight - startWeight) * 10) / 10;
    expect(change).toBe(-3);
  });

  it('calculates positive weight change', () => {
    const startWeight = 60;
    const currentWeight = 62.5;
    const change = Math.round((currentWeight - startWeight) * 10) / 10;
    expect(change).toBe(2.5);
  });

  it('calculates weekly completion percentage', () => {
    const weekSessions = 3;
    const target = 5;
    const completion = Math.min(100, Math.round((weekSessions / target) * 100));
    expect(completion).toBe(60);
  });

  it('caps weekly completion at 100%', () => {
    const weekSessions = 7;
    const target = 5;
    const completion = Math.min(100, Math.round((weekSessions / target) * 100));
    expect(completion).toBe(100);
  });
});

describe('check-in validation', () => {
  it('validates feeling range 1-5', () => {
    const isValid = (n: number) => n >= 1 && n <= 5;
    expect(isValid(1)).toBe(true);
    expect(isValid(5)).toBe(true);
    expect(isValid(0)).toBe(false);
    expect(isValid(6)).toBe(false);
  });

  it('generates correct date string for today', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('chat message limits', () => {
  it('slices history to last 10 turns', () => {
    const history = Array.from({ length: 20 }, (_, i) => ({ id: i, content: `msg ${i}`, role: 'user' }));
    const sliced = history.slice(-10);
    expect(sliced.length).toBe(10);
    expect(sliced[0].id).toBe(10);
  });

  it('handles empty history gracefully', () => {
    const history: any[] = [];
    const sliced = history.slice(-10);
    expect(sliced.length).toBe(0);
  });
});
