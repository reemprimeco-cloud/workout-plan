// Hook for tracking workout progress with localStorage persistence
import { useState, useEffect, useCallback } from 'react';

export interface ProgressData {
  completedDays: Record<string, boolean>; // key: "week-day" e.g. "1-1"
  currentWeight: number;
  weightLog: { date: string; weight: number }[];
  startDate: string;
}

const STORAGE_KEY = 'workout_progress_v1';

const defaultProgress: ProgressData = {
  completedDays: {},
  currentWeight: 72.6,
  weightLog: [{ date: new Date().toISOString().split('T')[0], weight: 72.6 }],
  startDate: new Date().toISOString().split('T')[0],
};

export function useProgress() {
  const [progress, setProgress] = useState<ProgressData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...defaultProgress, ...JSON.parse(stored) };
    } catch {}
    return defaultProgress;
  });

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {}
  }, [progress]);

  const toggleDay = useCallback((weekNum: number, dayNum: number) => {
    const key = `${weekNum}-${dayNum}`;
    setProgress(prev => ({
      ...prev,
      completedDays: {
        ...prev.completedDays,
        [key]: !prev.completedDays[key],
      },
    }));
  }, []);

  const updateWeight = useCallback((newWeight: number) => {
    const today = new Date().toISOString().split('T')[0];
    setProgress(prev => {
      const log = [...prev.weightLog];
      const todayIdx = log.findIndex(l => l.date === today);
      if (todayIdx >= 0) log[todayIdx] = { date: today, weight: newWeight };
      else log.push({ date: today, weight: newWeight });
      return { ...prev, currentWeight: newWeight, weightLog: log };
    });
  }, []);

  const isDayCompleted = useCallback((weekNum: number, dayNum: number) => {
    return !!progress.completedDays[`${weekNum}-${dayNum}`];
  }, [progress.completedDays]);

  const getTotalCompleted = useCallback(() => {
    return Object.values(progress.completedDays).filter(Boolean).length;
  }, [progress.completedDays]);

  const getWeekCompleted = useCallback((weekNum: number) => {
    return Object.entries(progress.completedDays)
      .filter(([k, v]) => k.startsWith(`${weekNum}-`) && v).length;
  }, [progress.completedDays]);

  const progressPercent = Math.min(
    100,
    Math.round(((72.6 - progress.currentWeight) / (72.6 - 65)) * 100)
  );

  return {
    progress,
    toggleDay,
    updateWeight,
    isDayCompleted,
    getTotalCompleted,
    getWeekCompleted,
    progressPercent,
  };
}
