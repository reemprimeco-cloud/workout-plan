/**
 * CMSContext — loads appearance + content overrides from the DB
 * and applies them globally to the app.
 *
 * - Appearance: injects CSS variables into :root
 * - Exercise overrides: provides a map of exerciseId → override data
 * - Session icon overrides: provides a map of sessionType → iconUrl
 */
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { trpc } from '@/lib/trpc';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ExerciseOverride {
  exerciseId: string;
  name?: string | null;
  nameAr?: string | null;
  sets?: string | null;
  reps?: string | null;
  rest?: string | null;
  notes?: string | null;
  notesAr?: string | null;
  imageUrl?: string | null;
  youtubeUrl?: string | null;
}

interface CMSContextValue {
  exerciseOverrides: Record<string, ExerciseOverride>;
  sessionIconOverrides: Record<string, string>; // sessionType → iconUrl
  appearance: {
    primaryColor: string;
    accentColor: string;
    bgColor: string;
    textColor: string;
    fontFamily: string;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    footerText?: string | null;
    footerLinks?: string | null;
  } | null;
  isLoading: boolean;
}

const CMSContext = createContext<CMSContextValue>({
  exerciseOverrides: {},
  sessionIconOverrides: {},
  appearance: null,
  isLoading: true,
});

// ── Provider ──────────────────────────────────────────────────────────────────
export function CMSProvider({ children }: { children: React.ReactNode }) {
  const appearanceQuery = trpc.cms.getAppearance.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 min
    retry: false,
  });

  const sessionIconsQuery = trpc.cms.getPublicSessionIcons.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const exerciseOverridesQuery = trpc.cms.getPublicExerciseOverrides.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Apply CSS variables when appearance changes
  useEffect(() => {
    const data = appearanceQuery.data;
    if (!data) return;
    const root = document.documentElement;
    root.style.setProperty('--cms-primary',    data.primaryColor ?? '#1B2E5E');
    root.style.setProperty('--cms-accent',     data.accentColor  ?? '#7BB8D4');
    root.style.setProperty('--cms-bg',         data.bgColor      ?? '#F0F4F8');
    root.style.setProperty('--cms-text',       data.textColor    ?? '#1B2E5E');
    root.style.setProperty('--cms-font',       `'${data.fontFamily ?? 'Inter'}', Inter, system-ui, sans-serif`);
  }, [appearanceQuery.data]);

  const sessionIconOverridesMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of sessionIconsQuery.data ?? []) {
      map[row.sessionType] = row.iconUrl;
    }
    return map;
  }, [sessionIconsQuery.data]);

  const exerciseOverridesMap = useMemo(() => {
    const map: Record<string, ExerciseOverride> = {};
    for (const row of exerciseOverridesQuery.data ?? []) {
      map[row.exerciseId] = row as ExerciseOverride;
    }
    return map;
  }, [exerciseOverridesQuery.data]);

  const value = useMemo<CMSContextValue>(() => ({
    exerciseOverrides: exerciseOverridesMap,
    sessionIconOverrides: sessionIconOverridesMap,
    appearance: appearanceQuery.data ?? null,
    isLoading: appearanceQuery.isLoading || sessionIconsQuery.isLoading || exerciseOverridesQuery.isLoading,
  }), [appearanceQuery.data, appearanceQuery.isLoading, sessionIconOverridesMap, exerciseOverridesMap, sessionIconsQuery.isLoading, exerciseOverridesQuery.isLoading]);

  return <CMSContext.Provider value={value}>{children}</CMSContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useCMS() {
  return useContext(CMSContext);
}

/**
 * Hook to get the merged exercise data for a given exercise ID.
 * Merges DB overrides on top of the static exerciseData defaults.
 */
export function useExerciseOverride(exerciseId: string): ExerciseOverride | null {
  const { exerciseOverrides } = useCMS();
  return exerciseOverrides[exerciseId] ?? null;
}

/**
 * Hook to get the custom session icon URL for a given session type.
 * Returns null if no override exists (use the default icon).
 */
export function useSessionIconOverride(sessionType: string): string | null {
  const { sessionIconOverrides } = useCMS();
  return sessionIconOverrides[sessionType] ?? null;
}
