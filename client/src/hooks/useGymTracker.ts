// ============================================================
// useGymTracker - Core state management for the gym tracker app
// All data persisted to localStorage, fully editable & expandable
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import type { SessionType, ExerciseTemplate, CardioTemplate } from '../data/exercises';
import { masterExercises, cardioTemplates, sessionTypes } from '../data/exercises';

// ── Types ──────────────────────────────────────────────────
export interface ExerciseLog {
  exerciseId: string;
  nameAr: string;
  nameEn?: string;
  sets: number;
  reps: string;
  weight: string;
  restSeconds: number;
  completed: boolean;
  notes: string;
}

export interface CardioLog {
  cardioId: string;
  nameAr: string;
  nameEn?: string;
  duration: number;
  speed: string;
  incline: string;
  distanceKm: string;
  caloriesBurned: string;
  pace?: string;
  completed: boolean;
}

export interface AquaLog {
  duration: number; // minutes
  intensity: 'خفيف' | 'متوسط' | 'مكثف';
  notes: string;
  completed: boolean;
}

export interface SaunaLog {
  totalMinutes: number;
  rounds: number;
  notes: string;
  completed: boolean;
}

export interface GymSession {
  id: string;
  date: string;           // ISO date "2025-05-08"
  checkInTime: string;    // "09:35"
  checkOutTime?: string;
  sessionType: SessionType;
  exercises: ExerciseLog[];
  cardio?: CardioLog;
  aqua?: AquaLog;
  sauna?: SaunaLog;
  mood: '😴' | '😐' | '😊' | '💪' | '🔥';
  energyLevel: 1 | 2 | 3 | 4 | 5;
  notes: string;
  bodyWeight?: number;
  isActive: boolean;
  caloriesBurned?: number; // estimated calories burned this session
}

export interface UserProfile {
  name: string;
  currentWeight: number;
  targetWeight: number;
  startWeight: number;
  age: number;
  bmi: number;
  height: number;
  gender: 'female' | 'male';
  startDate: string;
  avatarUrl?: string;
}

export interface AppData {
  profile: UserProfile;
  sessions: GymSession[];
  customExercises: ExerciseTemplate[];
  customCardio: CardioTemplate[];
  weightLog: { date: string; weight: number }[];
}

// ── Default Data ─────────────────────────────────────────────────────────────
const DEFAULT_PROFILE: UserProfile = {
  name: '',
  currentWeight: 0,
  targetWeight: 0,
  startWeight: 0,
  age: 0,
  bmi: 0,
  height: 0,
  gender: 'female',
  startDate: new Date().toISOString().split('T')[0],
};
const DEFAULT_DATA: AppData = {
  profile: DEFAULT_PROFILE,
  sessions: [],
  customExercises: [],
  customCardio: [],
  weightLog: [],
};
const STORAGE_KEY = 'gym_tracker_v3';
// ── Helper ─────────────────────────────────────────────────
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

// ── Hook ───────────────────────────────────────────────────
export function useGymTracker() {
  const [data, setData] = useState<AppData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppData;
        return { ...DEFAULT_DATA, ...parsed };
      }
    } catch {}
    return DEFAULT_DATA;
  });

  // Persist on every change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }, [data]);

  // ── Active session ─────────────────────────────────────
  const activeSession = data.sessions.find(s => s.isActive) ?? null;

  // ── Start a new session ────────────────────────────────
  const startSession = useCallback((type: SessionType) => {
    const now = new Date();
    const typeDef = sessionTypes[type];

    // Build default exercises from template
    const exercises: ExerciseLog[] = (typeDef.defaultExercises ?? [])
      .map(id => {
        const ex = [...masterExercises, ...data.customExercises].find(e => e.id === id);
        if (!ex) return null;
        return {
          exerciseId: ex.id,
          nameAr: ex.nameAr,
          nameEn: ex.nameEn,
          sets: ex.defaultSets,
          reps: ex.defaultReps,
          weight: ex.defaultWeight,
          restSeconds: ex.restSeconds,
          completed: false,
          notes: '',
        } as ExerciseLog;
      })
      .filter(Boolean) as ExerciseLog[];

    // Default cardio
    let cardio: CardioLog | undefined;
    if (typeDef.defaultCardio) {
      const c = [...cardioTemplates, ...data.customCardio].find(c => c.id === typeDef.defaultCardio);
      if (c) {
        cardio = {
          cardioId: c.id,
          nameAr: c.nameAr,
          nameEn: c.nameEn,
          duration: c.defaultDuration,
          speed: c.defaultSpeed,
          incline: c.defaultIncline,
          distanceKm: '',
          caloriesBurned: '',
          completed: false,
        };
      }
    }

    // Aqua / Sauna defaults
    let aqua: AquaLog | undefined;
    let sauna: SaunaLog | undefined;
    if (type === 'aqua') aqua = { duration: 45, intensity: 'متوسط', notes: '', completed: false };
    if (type === 'sauna') sauna = { totalMinutes: 25, rounds: 2, notes: '', completed: false };

    const session: GymSession = {
      id: generateId(),
      date: formatDate(now),
      checkInTime: formatTime(now),
      sessionType: type,
      exercises,
      cardio,
      aqua,
      sauna,
      mood: '😊',
      energyLevel: 3,
      notes: '',
      isActive: true,
    };

    setData(prev => ({
      ...prev,
      sessions: [session, ...prev.sessions.map(s => ({ ...s, isActive: false }))],
    }));
    return session.id;
  }, [data.customExercises, data.customCardio]);

  // ── Check out ──────────────────────────────────────────
  const checkOut = useCallback((sessionId: string, updates?: Partial<GymSession>) => {
    const now = new Date();
    setData(prev => {
      const updatedSessions = prev.sessions.map(s =>
        s.id === sessionId
          ? { ...s, ...updates, checkOutTime: formatTime(now), isActive: false }
          : s
      );
      // Dispatch event for DB sync
      const completed = updatedSessions.find(s => s.id === sessionId);
      if (completed) {
        setTimeout(() => window.dispatchEvent(new CustomEvent('gym-session-completed', { detail: completed })), 100);
      }
      return { ...prev, sessions: updatedSessions };
    });
  }, []);

  // ── Update exercise in active session ──────────────────
  const updateExercise = useCallback((sessionId: string, exerciseIdx: number, updates: Partial<ExerciseLog>) => {
    setData(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => {
        if (s.id !== sessionId) return s;
        const exercises = [...s.exercises];
        exercises[exerciseIdx] = { ...exercises[exerciseIdx], ...updates };
        return { ...s, exercises };
      }),
    }));
  }, []);

  // ── Toggle exercise completed ──────────────────────────
  const toggleExercise = useCallback((sessionId: string, exerciseIdx: number) => {
    setData(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => {
        if (s.id !== sessionId) return s;
        const exercises = [...s.exercises];
        exercises[exerciseIdx] = { ...exercises[exerciseIdx], completed: !exercises[exerciseIdx].completed };
        return { ...s, exercises };
      }),
    }));
  }, []);

  // ── Add exercise to active session ────────────────────
  const addExerciseToSession = useCallback((sessionId: string, exercise: ExerciseLog) => {
    setData(prev => ({
      ...prev,
      sessions: prev.sessions.map(s =>
        s.id === sessionId ? { ...s, exercises: [...s.exercises, exercise] } : s
      ),
    }));
  }, []);
  // ── Remove exercise from active session (with undo support) ───────
  const [lastRemovedExercise, setLastRemovedExercise] = useState<{ sessionId: string; exercise: ExerciseLog; idx: number } | null>(null);
  const removeExercise = useCallback((sessionId: string, exerciseIdx: number) => {
    setData(prev => {
      const session = prev.sessions.find(s => s.id === sessionId);
      if (session) {
        const removed = session.exercises[exerciseIdx];
        if (removed) setLastRemovedExercise({ sessionId, exercise: removed, idx: exerciseIdx });
      }
      return {
        ...prev,
        sessions: prev.sessions.map(s => {
          if (s.id !== sessionId) return s;
          const exercises = s.exercises.filter((_, i) => i !== exerciseIdx);
          return { ...s, exercises };
        }),
      };
    });
  }, []);
  const undoRemoveExercise = useCallback(() => {
    if (!lastRemovedExercise) return;
    const { sessionId, exercise, idx } = lastRemovedExercise;
    setData(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => {
        if (s.id !== sessionId) return s;
        const exercises = [...s.exercises];
        exercises.splice(idx, 0, exercise);
        return { ...s, exercises };
      }),
    }));
    setLastRemovedExercise(null);
  }, [lastRemovedExercise]);
  // ── Cancel session (discard without saving) ─────────────
  const cancelSession = useCallback((sessionId: string) => {
    setData(prev => ({
      ...prev,
      sessions: prev.sessions.filter(s => s.id !== sessionId),
    }));
  }, []);
  // ── Update cardio ──────────────────────────────────────
  const updateCardio = useCallback((sessionId: string, updates: Partial<CardioLog>) => {
    setData(prev => ({
      ...prev,
      sessions: prev.sessions.map(s =>
        s.id === sessionId ? { ...s, cardio: s.cardio ? { ...s.cardio, ...updates } : undefined } : s
      ),
    }));
  }, []);

  // ── Update aqua / sauna ────────────────────────────────
  const updateAqua = useCallback((sessionId: string, updates: Partial<AquaLog>) => {
    setData(prev => ({
      ...prev,
      sessions: prev.sessions.map(s =>
        s.id === sessionId ? { ...s, aqua: s.aqua ? { ...s.aqua, ...updates } : undefined } : s
      ),
    }));
  }, []);

  const updateSauna = useCallback((sessionId: string, updates: Partial<SaunaLog>) => {
    setData(prev => ({
      ...prev,
      sessions: prev.sessions.map(s =>
        s.id === sessionId ? { ...s, sauna: s.sauna ? { ...s.sauna, ...updates } : undefined } : s
      ),
    }));
  }, []);

  // ── Remove cardio from session ─────────────────────────
  const removeCardio = useCallback((sessionId: string) => {
    setData(prev => ({
      ...prev,
      sessions: prev.sessions.map(s =>
        s.id === sessionId ? { ...s, cardio: undefined } : s
      ),
    }));
  }, []);

  // ── Update session meta (mood, notes, weight) ─────────
  const updateSessionMeta = useCallback((sessionId: string, updates: Partial<GymSession>) => {
    setData(prev => ({
      ...prev,
      sessions: prev.sessions.map(s =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    }));
  }, []);

  // ── Delete session ─────────────────────────────────────
  const deleteSession = useCallback((sessionId: string) => {
    // Dispatch event for DB sync before removing from state
    window.dispatchEvent(new CustomEvent('gym-session-deleted', { detail: { id: sessionId } }));
    setData(prev => ({
      ...prev,
      sessions: prev.sessions.filter(s => s.id !== sessionId),
    }));
  }, []);

  // ── Add custom exercise to library ────────────────────
  const addCustomExercise = useCallback((exercise: ExerciseTemplate) => {
    setData(prev => ({
      ...prev,
      customExercises: [...prev.customExercises, exercise],
    }));
  }, []);
  // ── Update profile ─────────────────────────────────────────────────────
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setData(prev => {
      const newProfile = { ...prev.profile, ...updates };
      // If currentWeight changed, also update weightLog for today AND update startWeight if not set
      if (updates.currentWeight !== undefined && updates.currentWeight !== prev.profile.currentWeight && updates.currentWeight >= 30) {
        const today = new Date().toISOString().split('T')[0];
        const log = [...prev.weightLog];
        const idx = log.findIndex(l => l.date === today);
        if (idx >= 0) log[idx] = { date: today, weight: updates.currentWeight };
        else log.push({ date: today, weight: updates.currentWeight });
        // Also set startWeight if it was 0 (first time)
        if (prev.profile.startWeight === 0) newProfile.startWeight = updates.currentWeight;
        return { ...prev, profile: newProfile, weightLog: log };
      }
      return { ...prev, profile: newProfile };
    });
  }, []);

  // ── Log weight ─────────────────────────────────────────────────────
  const logWeight = useCallback((weight: number) => {
    const today = new Date().toISOString().split('T')[0];
    // Dispatch event for DB sync
    window.dispatchEvent(new CustomEvent('gym-weight-logged', { detail: { date: today, weight } }));
    setData(prev => {
      const log = [...prev.weightLog];
      const idx = log.findIndex(l => l.date === today);
      if (idx >= 0) log[idx] = { date: today, weight };
      else log.push({ date: today, weight });
      return { ...prev, weightLog: log, profile: { ...prev.profile, currentWeight: weight } };
    });
  }, []);
  // ── Statistics ────────────────────────────────────────────────────

  // Helper: normalise a date to midnight local time string "YYYY-MM-DD"
  const toDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const completedSessions = data.sessions.filter(s => !s.isActive);

  const stats = {
    // 1. Total sessions — all completed sessions regardless of date
    totalSessions: completedSessions.length,

    // 2. This week — sessions in the current calendar week (Sunday – Saturday)
    thisWeek: (() => {
      const now = new Date();
      // Start of current week: Sunday at 00:00
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return completedSessions.filter(s => new Date(s.date) >= weekStart).length;
    })(),

    // 3. This month — sessions in the current calendar month
    thisMonth: (() => {
      const now = new Date();
      return completedSessions.filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;
    })(),

    weightLost: Math.max(0, data.profile.startWeight - data.profile.currentWeight),
    progressPercent: Math.min(100, Math.round(
      ((data.profile.startWeight - data.profile.currentWeight) /
        (data.profile.startWeight - data.profile.targetWeight)) * 100
    )),
    sessionsByType: Object.keys(sessionTypes).reduce((acc, type) => {
      acc[type as SessionType] = completedSessions.filter(s => s.sessionType === type).length;
      return acc;
    }, {} as Record<SessionType, number>),

    // 4. Streak — consecutive CALENDAR DAYS with at least one completed session
    //    Algorithm:
    //    a) Collect unique workout dates ("YYYY-MM-DD") sorted descending
    //    b) Starting from today (or yesterday if no session today), walk backwards
    //       counting only days that have a workout; stop at the first gap.
    streak: (() => {
      const completed = completedSessions;
      if (!completed.length) return 0;

      // Build a Set of unique workout date strings
      const workoutDays = new Set(completed.map(s => s.date.slice(0, 10)));

      const today = new Date();
      const todayStr = toDateStr(today);

      // If user hasn't worked out today, check if they worked out yesterday
      // (streak is still alive if last workout was yesterday)
      let checkDate = new Date(today);
      if (!workoutDays.has(todayStr)) {
        // Move back one day to see if streak is still alive from yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = toDateStr(checkDate);
        if (!workoutDays.has(yesterdayStr)) return 0; // streak broken
      }

      // Walk backwards day by day counting consecutive workout days
      let streak = 0;
      while (workoutDays.has(toDateStr(checkDate))) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      return streak;
    })(),
  };

  return {
    data,
    activeSession,
    stats,
    startSession,
    checkOut,
    updateExercise,
    toggleExercise,
    addExerciseToSession,
    removeExercise,
    removeCardio,
    undoRemoveExercise,
    lastRemovedExercise,
    cancelSession,
    updateCardio,
    updateAqua,
    updateSauna,
    updateSessionMeta,
    deleteSession,
    addCustomExercise,
    updateProfile,
    logWeight,
    resetAll: () => {
      // Clear all Prime Fit localStorage keys
      const keysToRemove = Object.keys(localStorage).filter(k =>
        k.startsWith('gym_tracker') ||
        k.startsWith('primefit_') ||
        k.startsWith('prime_fit_') ||
        k === STORAGE_KEY
      );
      keysToRemove.forEach(k => localStorage.removeItem(k));
      // Reset state
      setData({ ...DEFAULT_DATA, profile: { ...DEFAULT_PROFILE, startDate: new Date().toISOString().split('T')[0] } });
      setTimeout(() => window.location.reload(), 150);
    },
    profile: data.profile,
    allExercises: [...masterExercises, ...data.customExercises],
  };
}
