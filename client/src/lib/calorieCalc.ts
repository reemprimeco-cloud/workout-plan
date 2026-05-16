// ============================================================
// calorieCalc.ts — Estimated Calories Burned Utility
// All values are ESTIMATES only. Not medically exact.
// Formula: Calories = MET × Weight(kg) × Duration(hours)
// ============================================================

import type { SessionType } from '../data/exercises';
import type { ExerciseLog, CardioLog } from '../hooks/useGymTracker';

// ── MET values per exercise ID ─────────────────────────────
// Source: Compendium of Physical Activities (Ainsworth et al.)
export const EXERCISE_MET: Record<string, number> = {
  // Lower body — weights (moderate)
  squat_db: 5.0,
  lunge_db: 5.0,
  hip_thrust: 4.5,
  rdl: 4.5,
  leg_press: 4.0,
  donkey_kicks: 3.5,
  calf_raises: 3.0,
  sumo_squat: 5.0,
  leg_extension: 3.5,
  leg_curl: 3.5,
  inner_thigh: 3.5,
  glute_kickback: 3.5,

  // Upper body — weights (moderate)
  bicep_curl: 4.0,
  tricep_ext: 4.0,
  lat_pulldown: 4.5,
  db_row: 4.5,
  hammer_curl: 4.0,
  tricep_pushdown: 4.0,
  chest_press: 5.0,
  shoulder_press: 5.0,
  lateral_raise: 3.5,
  chest_fly: 4.0,
  tricep_kickback: 3.5,
  rear_delt_fly: 3.5,

  // Core
  plank: 3.5,
  crunches: 3.8,
  bicycle_crunches: 4.0,
  leg_raises: 3.8,
  russian_twist: 4.0,
  mountain_climbers: 8.0,
  side_plank: 3.5,

  // Warm-up
  warmup_neck_rolls: 2.5,
  warmup_arm_circles: 2.5,
  warmup_hip_circles: 2.5,
  warmup_leg_swings: 3.0,
  warmup_jumping_jacks: 7.0,
  warmup_high_knees: 7.5,

  // Stretching / recovery (very low MET)
  stretch_quad: 2.0,
  stretch_hamstring: 2.0,
  stretch_hip_flexor: 2.0,
  stretch_chest: 2.0,
  stretch_shoulder: 2.0,
  stretch_child_pose: 2.0,

  // Home workouts
  home_pushup: 5.0,
  home_squat: 5.0,
  home_lunge: 5.0,
  home_glute_bridge: 4.0,
  home_plank: 3.5,
  home_mountain_climbers: 8.0,

  // Pilates (light-moderate)
  pilates_hundred: 3.5,
  pilates_roll_up: 3.0,
  pilates_single_leg_stretch: 3.5,
  pilates_double_leg_stretch: 3.5,
  pilates_spine_stretch: 2.5,
  pilates_swan: 2.5,

  // Mobility
  mob_thoracic_rotation: 2.5,
  mob_hip_90_90: 2.5,
  mob_ankle_circles: 2.0,
  mob_cat_cow: 2.5,
  mob_world_greatest: 3.5,
  mob_pigeon_pose: 2.5,

  // Quick workouts / HIIT
  quick_burpees: 10.0,
  quick_jumping_jacks: 7.0,
  quick_high_knees: 7.5,
  quick_squat_jumps: 9.0,
  quick_pushup: 5.0,
  quick_plank: 3.5,
};

// ── MET values per session type (fallback) ─────────────────
export const SESSION_TYPE_MET: Record<SessionType, number> = {
  lower_body: 5.0,
  upper_arms: 4.5,
  core_cardio: 7.0,
  chest_shoulders: 5.0,
  full_body: 5.5,
  aqua: 5.5,      // Aqua aerobics
  sauna: 1.5,     // Passive rest
  active_rest: 4.0,
  warm_up: 3.5,
  stretching: 2.5,
  home_workouts: 5.0,
  pilates: 3.5,
  mobility: 2.8,
  quick_workouts: 8.0,
};

// ── MET values per cardio machine ─────────────────────────
export const CARDIO_MET: Record<string, number> = {
  treadmill: 8.5,      // moderate running/walking on incline
  elliptical: 5.0,
  bike: 7.0,
  rower: 7.0,
  precor_bike: 7.0,
  climbmill: 9.0,
};

// ── Estimate duration for a single exercise (seconds) ─────
// Formula: (reps × 4s) + (sets × restSeconds)
export function estimateExerciseDurationSec(
  sets: number,
  reps: string,
  restSeconds: number,
): number {
  const repCount = parseInt(reps.split('-')[0], 10) || 10;
  const workTime = sets * repCount * 4; // 4 seconds per rep
  const restTime = sets * restSeconds;
  return workTime + restTime;
}

// ── Calories burned for a single exercise ─────────────────
export function calcExerciseCalories(
  exerciseId: string,
  sets: number,
  reps: string,
  restSeconds: number,
  weightKg: number,
): number {
  const met = EXERCISE_MET[exerciseId] ?? 4.0;
  const durationHours = estimateExerciseDurationSec(sets, reps, restSeconds) / 3600;
  const calories = met * weightKg * durationHours;
  return Math.round(calories);
}

// ── Calories burned for a cardio block ────────────────────
export function calcCardioCalories(
  cardioId: string,
  durationMinutes: number,
  weightKg: number,
): number {
  const met = CARDIO_MET[cardioId] ?? 6.0;
  const durationHours = durationMinutes / 60;
  const calories = met * weightKg * durationHours;
  return Math.round(calories);
}

// ── Total session calories (exercises + cardio) ───────────
export function calcSessionCalories(
  exercises: ExerciseLog[],
  cardio: CardioLog | undefined,
  sessionType: SessionType,
  weightKg: number,
): number {
  let total = 0;

  // Sum exercise calories
  for (const ex of exercises) {
    total += calcExerciseCalories(
      ex.exerciseId,
      ex.sets,
      ex.reps,
      ex.restSeconds,
      weightKg,
    );
  }

  // Add cardio calories
  if (cardio) {
    const durationMin = cardio.duration || 20;
    total += calcCardioCalories(cardio.cardioId, durationMin, weightKg);
  }

  // If no exercises logged yet, use session-type MET × 45 min estimate
  if (exercises.length === 0 && !cardio) {
    const met = SESSION_TYPE_MET[sessionType] ?? 5.0;
    total = Math.round(met * weightKg * (45 / 60));
  }

  return total;
}

// ── Daily calories burned from a list of sessions ─────────
export function getDailyCaloriesBurned(
  sessions: Array<{
    date: string;
    exercises: ExerciseLog[];
    cardio?: CardioLog;
    sessionType: SessionType;
    caloriesBurned?: number;
  }>,
  date: string,
  weightKg: number,
): number {
  return sessions
    .filter(s => s.date === date)
    .reduce((sum, s) => {
      if (s.caloriesBurned) return sum + s.caloriesBurned;
      return sum + calcSessionCalories(s.exercises, s.cardio, s.sessionType, weightKg);
    }, 0);
}

// ── Weekly calories burned (last 7 days) ─────────────────
export function getWeeklyCaloriesBurned(
  sessions: Array<{
    date: string;
    exercises: ExerciseLog[];
    cardio?: CardioLog;
    sessionType: SessionType;
    caloriesBurned?: number;
  }>,
  weightKg: number,
): { date: string; label: string; calories: number }[] {
  const result: { date: string; label: string; calories: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en', { weekday: 'short' });
    const calories = getDailyCaloriesBurned(sessions, dateStr, weightKg);
    result.push({ date: dateStr, label, calories });
  }
  return result;
}

// ── Monthly calories burned (last 4 weeks) ───────────────
export function getMonthlyCaloriesBurned(
  sessions: Array<{
    date: string;
    exercises: ExerciseLog[];
    cardio?: CardioLog;
    sessionType: SessionType;
    caloriesBurned?: number;
  }>,
  weightKg: number,
): { week: string; calories: number }[] {
  const result: { week: string; calories: number }[] = [];
  const today = new Date();
  for (let w = 3; w >= 0; w--) {
    let weekCal = 0;
    for (let d = 0; d < 7; d++) {
      const day = new Date(today);
      day.setDate(today.getDate() - w * 7 - d);
      const dateStr = day.toISOString().split('T')[0];
      weekCal += getDailyCaloriesBurned(sessions, dateStr, weightKg);
    }
    result.push({ week: `W${4 - w}`, calories: weekCal });
  }
  return result;
}
