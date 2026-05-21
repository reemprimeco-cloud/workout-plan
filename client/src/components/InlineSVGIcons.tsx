/**
 * InlineSVGIcons — All app icons rendered as inline SVG.
 * No external images, no network requests, no caching issues.
 * These always render immediately on all browsers.
 * 
 * IMPORTANT: These icons match the original design exactly:
 * - Navy blue (#1B2E5E) outline/stroke style
 * - No fill, clean geometric shapes
 * - Same visual weight and proportions as the original webp icons
 */
import React from 'react';

const NAVY = '#1B2E5E';
const SKY = '#7BB8D4';

// ─── PrimeFit Logo (used in header, auth pages, install prompt) ───
export function PrimeFitLogoSVG({ size = 60 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.18,
      background: `linear-gradient(135deg, ${NAVY} 0%, #2A4A7F 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxShadow: '0 4px 12px rgba(27,46,94,0.3)',
    }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path d="M13 2L4.5 13.5H11L10 22L20 10H13.5L13 2Z"
          fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ─── Navigation Bar Icons (matching original webp designs) ───

// HOME: Simple house — triangle roof, square body, rectangular door
export function NavHomeIcon({ active, size = 26 }: { active: boolean; size?: number }) {
  const color = active ? NAVY : '#7A9BB5';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity: active ? 1 : 0.45 }}>
      {/* Triangle roof */}
      <path d="M4 11L12 4L20 11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* House body */}
      <path d="M5 11V19C5 19.5523 5.44772 20 6 20H18C18.5523 20 19 19.5523 19 19V11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Door */}
      <path d="M10 20V15C10 14.4477 10.4477 14 11 14H13C13.5523 14 14 14.4477 14 15V20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// STATS: Three ascending bars on a baseline (bar chart)
export function NavStatsIcon({ active, size = 26 }: { active: boolean; size?: number }) {
  const color = active ? NAVY : '#7A9BB5';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity: active ? 1 : 0.45 }}>
      {/* Baseline */}
      <path d="M3 20H21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      {/* Short bar (left) */}
      <rect x="4" y="13" width="4" height="7" rx="1" stroke={color} strokeWidth="2" fill="none"/>
      {/* Medium bar (center) */}
      <rect x="10" y="8" width="4" height="12" rx="1" stroke={color} strokeWidth="2" fill="none"/>
      {/* Tall bar (right) */}
      <rect x="16" y="4" width="4" height="16" rx="1" stroke={color} strokeWidth="2" fill="none"/>
    </svg>
  );
}

// EXERCISES: Classic dumbbell with weight plates on each side
export function NavExercisesIcon({ active, size = 26 }: { active: boolean; size?: number }) {
  const color = active ? NAVY : '#7A9BB5';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity: active ? 1 : 0.45 }}>
      {/* Center bar */}
      <path d="M7.5 12H16.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      {/* Left inner plate (taller) */}
      <rect x="5.5" y="8" width="2" height="8" rx="1" stroke={color} strokeWidth="1.8" fill="none"/>
      {/* Left outer plate (shorter) */}
      <rect x="3" y="9.5" width="2.5" height="5" rx="1" stroke={color} strokeWidth="1.8" fill="none"/>
      {/* Right inner plate (taller) */}
      <rect x="16.5" y="8" width="2" height="8" rx="1" stroke={color} strokeWidth="1.8" fill="none"/>
      {/* Right outer plate (shorter) */}
      <rect x="18.5" y="9.5" width="2.5" height="5" rx="1" stroke={color} strokeWidth="1.8" fill="none"/>
    </svg>
  );
}

// COACH: Person with cap, whistle, and clipboard (upper body)
export function NavCoachIcon({ active, size = 26 }: { active: boolean; size?: number }) {
  const color = active ? NAVY : '#7A9BB5';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity: active ? 1 : 0.45 }}>
      {/* Head */}
      <circle cx="12" cy="6.5" r="3" stroke={color} strokeWidth="1.8" fill="none"/>
      {/* Cap visor */}
      <path d="M9 5.5C9 5.5 9.5 4 12 4C14.5 4 15 5.5 15 5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M8.5 5.5H15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      {/* Body (t-shirt) */}
      <path d="M7 21V16C7 13.7909 9.23858 12 12 12C14.7614 12 17 13.7909 17 16V21" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Whistle lanyard */}
      <path d="M12 9.5V13" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      {/* Whistle */}
      <circle cx="12" cy="13.5" r="1" stroke={color} strokeWidth="1.2" fill="none"/>
      {/* Clipboard */}
      <rect x="15" y="14" width="3.5" height="4.5" rx="0.5" stroke={color} strokeWidth="1.4" fill="none"/>
      <path d="M15.8 14V13.5C15.8 13.2 16 13 16.3 13H17.2C17.5 13 17.7 13.2 17.7 13.5V14" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

// COMMUNITY: Three people (2 in back, 1 in front center)
export function NavCommunityIcon({ active, size = 26 }: { active: boolean; size?: number }) {
  const color = active ? NAVY : '#7A9BB5';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity: active ? 1 : 0.45 }}>
      {/* Back left person - head */}
      <circle cx="7" cy="7" r="2.5" stroke={color} strokeWidth="1.8" fill="none"/>
      {/* Back left person - body */}
      <path d="M2.5 18C2.5 15.5 4.5 13.5 7 13.5C8 13.5 8.9 13.8 9.6 14.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      {/* Back right person - head */}
      <circle cx="17" cy="7" r="2.5" stroke={color} strokeWidth="1.8" fill="none"/>
      {/* Back right person - body */}
      <path d="M21.5 18C21.5 15.5 19.5 13.5 17 13.5C16 13.5 15.1 13.8 14.4 14.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      {/* Front center person - head */}
      <circle cx="12" cy="10" r="2.8" stroke={color} strokeWidth="1.8" fill="none"/>
      {/* Front center person - body */}
      <path d="M6.5 21C6.5 18 9 15.5 12 15.5C15 15.5 17.5 18 17.5 21" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// PROFILE: Circle with person silhouette inside (avatar)
export function NavProfileIcon({ active, size = 26 }: { active: boolean; size?: number }) {
  const color = active ? NAVY : '#7A9BB5';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity: active ? 1 : 0.45 }}>
      {/* Outer circle */}
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" fill="none"/>
      {/* Head */}
      <circle cx="12" cy="9" r="3" stroke={color} strokeWidth="1.8" fill="none"/>
      {/* Shoulders/body arc clipped by circle */}
      <path d="M6.5 19.5C7 16.5 9.2 14.5 12 14.5C14.8 14.5 17 16.5 17.5 19.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// ─── Workout Session Card Icons ───
export function WorkoutIcon({ type, size = 56 }: { type: string; size?: number }) {
  const s = size;
  const icons: Record<string, React.ReactElement> = {
    lower_body: (
      <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="24" fill="#FFF0E8" stroke="#E05A00" strokeWidth="1.5"/>
        <path d="M22 18C22 18 20 28 20 32C20 36 22 40 28 40C34 40 36 36 36 32C36 28 34 18 34 18"
          stroke="#E05A00" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M25 28H31" stroke="#E05A00" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    upper_arms: (
      <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="24" fill="#F0E8FF" stroke="#7C3AED" strokeWidth="1.5"/>
        <path d="M20 34C20 34 22 26 24 22C26 18 30 18 32 22C34 26 36 34 36 34"
          stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <circle cx="28" cy="24" r="3" fill="#7C3AED" opacity="0.3"/>
      </svg>
    ),
    core_cardio: (
      <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="24" fill="#FFE8E8" stroke="#DC2626" strokeWidth="1.5"/>
        <path d="M18 28L22 28L25 20L28 36L31 24L34 28L38 28"
          stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    chest_shoulders: (
      <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="24" fill="#E8F0FF" stroke="#2563EB" strokeWidth="1.5"/>
        <path d="M18 28H38M22 24V32M34 24V32M16 28H18M38 28H40"
          stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    full_body: (
      <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="24" fill="#E8F5EE" stroke="#059669" strokeWidth="1.5"/>
        <circle cx="28" cy="18" r="3" stroke="#059669" strokeWidth="2"/>
        <path d="M28 21V32M24 25H32M22 38L28 32L34 38"
          stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    aqua: (
      <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="24" fill="#E0F7FA" stroke="#0891B2" strokeWidth="1.5"/>
        <path d="M16 30C18 28 20 30 22 28C24 26 26 28 28 26C30 24 32 26 34 28C36 30 38 28 40 30"
          stroke="#0891B2" strokeWidth="2" strokeLinecap="round"/>
        <path d="M16 36C18 34 20 36 22 34C24 32 26 34 28 32C30 30 32 32 34 34C36 36 38 34 40 36"
          stroke="#0891B2" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    sauna: (
      <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="24" fill="#FEF3C7" stroke="#B45309" strokeWidth="1.5"/>
        <path d="M22 34C22 34 22 20 28 20C34 20 34 34 34 34" stroke="#B45309" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M24 28Q28 24 32 28" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M20 38H36" stroke="#B45309" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    active_rest: (
      <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="24" fill="#EEF4FF" stroke={NAVY} strokeWidth="1.5"/>
        <circle cx="28" cy="20" r="3" stroke={NAVY} strokeWidth="2"/>
        <path d="M22 38L28 30L34 38M28 24V30" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    warm_up: (
      <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="24" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.5"/>
        <path d="M28 16V22M22 18L24 22M34 18L32 22M20 28H36M24 34L28 28L32 34"
          stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    stretching: (
      <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="24" fill="#F0FDFA" stroke="#0D9488" strokeWidth="1.5"/>
        <circle cx="28" cy="18" r="3" stroke="#0D9488" strokeWidth="2"/>
        <path d="M28 21V30M20 26L28 30L36 26M24 38L28 34L32 38"
          stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    home_workouts: (
      <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="24" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="1.5"/>
        <path d="M20 28L28 20L36 28M22 26V36H34V26"
          stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M26 36V30H30V36" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    pilates: (
      <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="24" fill="#FDF2F8" stroke="#DB2777" strokeWidth="1.5"/>
        <circle cx="28" cy="18" r="3" stroke="#DB2777" strokeWidth="2"/>
        <path d="M20 34C20 34 24 28 28 28C32 28 36 34 36 34M28 21V28"
          stroke="#DB2777" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    mobility: (
      <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="24" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5"/>
        <circle cx="28" cy="18" r="3" stroke="#2563EB" strokeWidth="2"/>
        <path d="M22 38L26 30L28 24M28 24L30 30L34 38M28 24V21"
          stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 30H36" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    quick_workouts: (
      <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="24" fill="#FEFCE8" stroke="#CA8A04" strokeWidth="1.5"/>
        <path d="M30 16L22 30H28L26 40L34 26H28L30 16Z"
          fill="#CA8A04" stroke="#CA8A04" strokeWidth="1" strokeLinejoin="round"/>
      </svg>
    ),
  };
  return icons[type] || (
    <svg width={s} height={s} viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="24" fill="#F0F4F8" stroke={SKY} strokeWidth="1.5"/>
      <path d="M20 28H36M28 20V36" stroke={SKY} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}
