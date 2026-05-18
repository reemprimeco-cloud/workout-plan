/**
 * useHaptic — Haptic feedback utility hook
 * Uses Web Vibration API (navigator.vibrate) for tactile feedback on mobile.
 * Gracefully no-ops on desktop or unsupported browsers.
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 30, 10],
  error: [50, 30, 50],
  selection: 8,
};

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently ignore if vibration is not permitted
    }
  }
}

export function useHaptic() {
  const haptic = (type: HapticPattern = 'light') => {
    vibrate(PATTERNS[type]);
  };

  return {
    haptic,
    lightTap: () => vibrate(PATTERNS.light),
    mediumTap: () => vibrate(PATTERNS.medium),
    heavyTap: () => vibrate(PATTERNS.heavy),
    success: () => vibrate(PATTERNS.success),
    error: () => vibrate(PATTERNS.error),
    selection: () => vibrate(PATTERNS.selection),
  };
}
