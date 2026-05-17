/**
 * useGymSync — background sync between localStorage (useGymTracker) and the server DB
 *
 * Strategy:
 * 1. On mount (after login), pull all sessions + weight logs from DB and merge into localStorage
 * 2. Watch for localStorage changes and push new/updated sessions to DB
 * 3. On session delete, delete from DB too
 *
 * This hook is designed to run once at the app root level (e.g., App.tsx or Home.tsx).
 * It does NOT replace useGymTracker — it runs alongside it.
 */
import { useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

const STORAGE_KEY = 'gym_tracker_v3';
const SYNC_FLAG_KEY = 'gym_tracker_synced_v1'; // set after first successful DB pull

interface AppData {
  sessions: Array<{
    id: string;
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    sessionType: string;
    exercises: unknown[];
    cardio?: unknown;
    aqua?: unknown;
    sauna?: unknown;
    mood?: string;
    energyLevel?: number;
    notes?: string;
    bodyWeight?: number;
    caloriesBurned?: number;
    isActive: boolean;
  }>;
  weightLog: Array<{ date: string; weight: number }>;
  profile: {
    name: string;
    currentWeight: number;
    targetWeight: number;
    startWeight: number;
    age: number;
    height: number;
    gender: string;
    startDate: string;
    avatarUrl?: string;
  };
}

function getLocalData(): AppData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as AppData;
  } catch {}
  return null;
}

function setLocalData(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function useGymSync() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const hasSynced = useRef(false);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: dbSessions } = trpc.workout.getSessions.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const { data: dbWeightLog } = trpc.workout.getWeightLog.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const bulkImportSessions = trpc.workout.bulkImportSessions.useMutation();
  const bulkImportWeightLog = trpc.workout.bulkImportWeightLog.useMutation();
  const upsertSession = trpc.workout.upsertSession.useMutation();
  const deleteSessionMutation = trpc.workout.deleteSession.useMutation();
  const logWeightMutation = trpc.workout.logWeight.useMutation();

  // ── Phase 1: On first load, pull DB data and merge into localStorage ──────
  useEffect(() => {
    if (!isAuthenticated || hasSynced.current) return;
    if (!dbSessions || !dbWeightLog) return;

    hasSynced.current = true;

    const local = getLocalData();
    if (!local) return;

    // Merge DB sessions into localStorage (DB is source of truth for completed sessions)
    const localIds = new Set(local.sessions.map(s => s.id));
    const newFromDb = dbSessions
      .filter(s => !localIds.has(s.clientId) && !s.isActive)
      .map(s => ({
        id: s.clientId,
        date: s.date,
        checkInTime: s.checkInTime,
        checkOutTime: s.checkOutTime ?? undefined,
        sessionType: s.sessionType,
        exercises: s.exercises as unknown[],
        cardio: s.cardio ?? undefined,
        aqua: s.aqua ?? undefined,
        sauna: s.sauna ?? undefined,
        mood: s.mood ?? '😊',
        energyLevel: (s.energyLevel ?? 3) as 1 | 2 | 3 | 4 | 5,
        notes: s.notes ?? '',
        bodyWeight: s.bodyWeight ?? undefined,
        caloriesBurned: s.caloriesBurned ?? undefined,
        isActive: false,
      }));

    // Merge DB weight logs into localStorage
    const localWeightDates = new Set(local.weightLog.map(w => w.date));
    const newWeightsFromDb = dbWeightLog
      .filter(w => !localWeightDates.has(w.date))
      .map(w => ({ date: w.date, weight: w.weight }));

    if (newFromDb.length > 0 || newWeightsFromDb.length > 0) {
      const merged: AppData = {
        ...local,
        sessions: [...local.sessions, ...newFromDb].sort((a, b) => b.date.localeCompare(a.date)),
        weightLog: [...local.weightLog, ...newWeightsFromDb].sort((a, b) => b.date.localeCompare(a.date)),
      };
      setLocalData(merged);
      // Trigger a page reload to pick up merged data
      window.dispatchEvent(new Event('gym-data-synced'));
    }

    // Phase 2: Upload local sessions that aren't in DB yet
    const dbClientIds = new Set(dbSessions.map(s => s.clientId));
    const localOnlyCompleted = local.sessions
      .filter(s => !s.isActive && !dbClientIds.has(s.id))
      .map(s => ({
        clientId: s.id,
        date: s.date,
        checkInTime: s.checkInTime,
        checkOutTime: s.checkOutTime,
        sessionType: s.sessionType,
        exercises: s.exercises as any[],
        cardio: s.cardio as any,
        aqua: s.aqua as any,
        sauna: s.sauna as any,
        mood: s.mood,
        energyLevel: s.energyLevel,
        notes: s.notes,
        bodyWeight: s.bodyWeight,
        caloriesBurned: s.caloriesBurned,
        isActive: false,
      }));

    if (localOnlyCompleted.length > 0) {
      bulkImportSessions.mutate(localOnlyCompleted);
    }

    // Upload local weight logs that aren't in DB yet
    const dbWeightDates = new Set(dbWeightLog.map(w => w.date));
    const localOnlyWeights = local.weightLog.filter(w => !dbWeightDates.has(w.date));
    if (localOnlyWeights.length > 0) {
      bulkImportWeightLog.mutate(localOnlyWeights);
    }
  }, [isAuthenticated, dbSessions, dbWeightLog]);

  // ── Phase 3: Watch localStorage for changes and sync to DB ───────────────
  const syncSessionToDb = useCallback((session: AppData['sessions'][0]) => {
    if (!isAuthenticated || session.isActive) return; // only sync completed sessions
    upsertSession.mutate({
      clientId: session.id,
      date: session.date,
      checkInTime: session.checkInTime,
      checkOutTime: session.checkOutTime,
      sessionType: session.sessionType,
      exercises: session.exercises as any[],
      cardio: session.cardio as any,
      aqua: session.aqua as any,
      sauna: session.sauna as any,
      mood: session.mood,
      energyLevel: session.energyLevel,
      notes: session.notes,
      bodyWeight: session.bodyWeight,
      caloriesBurned: session.caloriesBurned,
      isActive: false,
    });
  }, [isAuthenticated]);

  // Listen for the custom 'gym-session-completed' event dispatched by useGymTracker
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleSessionCompleted = (e: Event) => {
      const session = (e as CustomEvent).detail;
      if (session) syncSessionToDb(session);
    };

    const handleSessionDeleted = (e: Event) => {
      const clientId = (e as CustomEvent).detail?.id;
      if (clientId) {
        deleteSessionMutation.mutate({ clientId });
      }
    };

    const handleWeightLogged = (e: Event) => {
      const { date, weight } = (e as CustomEvent).detail ?? {};
      if (date && weight) {
        logWeightMutation.mutate({ date, weight });
      }
    };

    window.addEventListener('gym-session-completed', handleSessionCompleted);
    window.addEventListener('gym-session-deleted', handleSessionDeleted);
    window.addEventListener('gym-weight-logged', handleWeightLogged);

    return () => {
      window.removeEventListener('gym-session-completed', handleSessionCompleted);
      window.removeEventListener('gym-session-deleted', handleSessionDeleted);
      window.removeEventListener('gym-weight-logged', handleWeightLogged);
    };
  }, [isAuthenticated, syncSessionToDb]);

  return { isSyncing: bulkImportSessions.isPending || bulkImportWeightLog.isPending };
}
