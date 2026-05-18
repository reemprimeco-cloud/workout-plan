// ColorIcons.tsx
// Vibrant colored SVG icons for Prime Fit app
// All icons are pure SVG — no emojis, no external dependencies

type IconProps = { size?: number; className?: string };

// ── Nutrition Tab Icons ────────────────────────────────────────────────────────

/** Dashboard / Stats — orange gradient bar chart */
export function NutritionDashboardIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1" fill="#f97316" />
      <rect x="10" y="7" width="4" height="14" rx="1" fill="#fb923c" />
      <rect x="17" y="3" width="4" height="18" rx="1" fill="#fdba74" />
      <line x1="2" y1="21" x2="22" y2="21" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Meals / Fork — green fork */
export function NutritionMealsIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8 3v4a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 9v12" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 3v18" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 9a3 3 0 0 0 0-6" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Scanner / Camera — purple camera */
export function NutritionScannerIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="14" rx="3" fill="#a855f7" opacity="0.15" />
      <rect x="2" y="7" width="20" height="14" rx="3" stroke="#a855f7" strokeWidth="2" />
      <circle cx="12" cy="14" r="3.5" stroke="#7c3aed" strokeWidth="2" />
      <circle cx="12" cy="14" r="1.2" fill="#7c3aed" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="11" r="1" fill="#a855f7" />
    </svg>
  );
}

/** Robot / AI Insights — cyan robot face */
export function NutritionRobotIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="8" width="16" height="12" rx="3" fill="#06b6d4" opacity="0.15" />
      <rect x="4" y="8" width="16" height="12" rx="3" stroke="#06b6d4" strokeWidth="2" />
      <circle cx="9" cy="13" r="1.5" fill="#0891b2" />
      <circle cx="15" cy="13" r="1.5" fill="#0891b2" />
      <path d="M9 17.5h6" stroke="#0891b2" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 8V5" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="4" r="1.5" fill="#06b6d4" />
      <path d="M4 14H2M22 14h-2" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Water Drop — blue gradient drop */
export function WaterDropIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z" fill="url(#waterGrad)" />
      <path d="M9 16a3 3 0 0 0 3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** Macronutrients Cloud — teal cloud */
export function MacroCloudIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="#14b8a6" opacity="0.2" />
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="#14b8a6" strokeWidth="2" />
    </svg>
  );
}

/** Flame / Calorie — orange-red flame */
export function FlameIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <path d="M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0c0-3-2-5-2-5s0 3-2 4c0 0 1-5-1-9z" fill="url(#flameGrad)" />
      <path d="M12 17a2 2 0 0 1-2-2c0-1.5 2-3 2-3s2 1.5 2 3a2 2 0 0 1-2 2z" fill="#fef3c7" opacity="0.8" />
    </svg>
  );
}

// ── Coach Tab Icons ────────────────────────────────────────────────────────────

/** Large Robot / AI Coach header — blue gradient robot */
export function CoachRobotIcon({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="robotBodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="robotHeadGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {/* Head */}
      <rect x="10" y="8" width="28" height="20" rx="6" fill="url(#robotHeadGrad)" />
      {/* Eyes */}
      <circle cx="18" cy="17" r="3" fill="white" />
      <circle cx="30" cy="17" r="3" fill="white" />
      <circle cx="18" cy="17" r="1.5" fill="#1d4ed8" />
      <circle cx="30" cy="17" r="1.5" fill="#1d4ed8" />
      {/* Mouth */}
      <rect x="17" y="23" width="14" height="2.5" rx="1.25" fill="white" opacity="0.7" />
      {/* Antenna */}
      <line x1="24" y1="8" x2="24" y2="4" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="3" r="2" fill="#93c5fd" />
      {/* Ears */}
      <rect x="6" y="14" width="4" height="8" rx="2" fill="#3b82f6" />
      <rect x="38" y="14" width="4" height="8" rx="2" fill="#3b82f6" />
      {/* Body */}
      <rect x="12" y="30" width="24" height="14" rx="5" fill="url(#robotBodyGrad)" />
      {/* Chest buttons */}
      <circle cx="19" cy="37" r="2" fill="#93c5fd" />
      <circle cx="24" cy="37" r="2" fill="#bfdbfe" />
      <circle cx="29" cy="37" r="2" fill="#93c5fd" />
    </svg>
  );
}

/** Message / Chat tab — blue speech bubble */
export function ChatMessageIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="chatGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="url(#chatGrad)" opacity="0.15" />
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="8" y1="9" x2="16" y2="9" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="13" x2="13" y2="13" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Sun / Check-In tab — warm yellow/orange sun */
export function SunCheckInIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="5" fill="url(#sunGrad)" />
      <line x1="12" y1="2" x2="12" y2="4.5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="19.5" x2="12" y2="22" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <line x1="2" y1="12" x2="4.5" y2="12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <line x1="19.5" y1="12" x2="22" y2="12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <line x1="4.93" y1="4.93" x2="6.76" y2="6.76" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <line x1="17.24" y1="17.24" x2="19.07" y2="19.07" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <line x1="19.07" y1="4.93" x2="17.24" y2="6.76" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <line x1="6.76" y1="17.24" x2="4.93" y2="19.07" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Brain / Insights tab — purple brain */
export function BrainInsightsIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5C9.5 5 7.5 7 7.5 9.5c0 1-.3 2-.8 2.8C5.8 13.4 5 14.6 5 16a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4c0-1.4-.8-2.6-1.7-3.7-.5-.8-.8-1.8-.8-2.8C16.5 7 14.5 5 12 5z" fill="#a855f7" opacity="0.2" />
      <path d="M12 5C9.5 5 7.5 7 7.5 9.5c0 1-.3 2-.8 2.8C5.8 13.4 5 14.6 5 16a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4c0-1.4-.8-2.6-1.7-3.7-.5-.8-.8-1.8-.8-2.8C16.5 7 14.5 5 12 5z" stroke="#a855f7" strokeWidth="2" strokeLinejoin="round" />
      <line x1="12" y1="5" x2="12" y2="20" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 10c1 .5 2 .5 3 0" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 10c1 .5 2 .5 3 0" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8.5 14c1 .8 2.5 1 3.5.5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 14.5c1 .5 2.5.3 3.5-.5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Dumbbell stat card — navy dumbbell */
export function DumbbellStatIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="1" y="10" width="4" height="4" rx="1.5" fill="#1B2E5E" />
      <rect x="19" y="10" width="4" height="4" rx="1.5" fill="#1B2E5E" />
      <rect x="3" y="8" width="3" height="8" rx="1.5" fill="#2d4a8a" />
      <rect x="18" y="8" width="3" height="8" rx="1.5" fill="#2d4a8a" />
      <rect x="6" y="11" width="12" height="2" rx="1" fill="#3b5fc0" />
    </svg>
  );
}

/** Stats / Weight Delta — orange chart up */
export function StatsUpIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16,7 22,7 22,13" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Check / Weekly completion — green checkmark */
export function CheckCircleIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#22c55e" opacity="0.15" />
      <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2" />
      <polyline points="8,12 11,15 16,9" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Streak Flame — red-orange flame */
export function StreakFlameIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="streakFlameGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="60%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <path d="M12 2c0 0-5.5 5.5-5.5 11a5.5 5.5 0 0 0 11 0c0-3.5-2.5-6-2.5-6s0 3.5-2.5 4.5c0 0 1.5-5.5-0.5-9.5z" fill="url(#streakFlameGrad)" />
      <ellipse cx="12" cy="17" rx="2" ry="1.5" fill="#fef3c7" opacity="0.7" />
    </svg>
  );
}

// ── Community Leaderboard Medal Icons ─────────────────────────────────────────

/** Gold Medal — rank 1 */
export function GoldMedalIcon({ size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="goldRibbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      {/* Ribbon */}
      <path d="M10 2 L14 8 L18 2" stroke="url(#goldRibbon)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Medal circle */}
      <circle cx="14" cy="16" r="9" fill="url(#goldGrad)" />
      <circle cx="14" cy="16" r="7" fill="none" stroke="#d97706" strokeWidth="1" opacity="0.5" />
      {/* "1" text */}
      <text x="14" y="21" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f" fontFamily="system-ui">1</text>
    </svg>
  );
}

/** Silver Medal — rank 2 */
export function SilverMedalIcon({ size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <defs>
        <linearGradient id="silverGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="silverRibbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      <path d="M10 2 L14 8 L18 2" stroke="url(#silverRibbon)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="14" cy="16" r="9" fill="url(#silverGrad)" />
      <circle cx="14" cy="16" r="7" fill="none" stroke="#64748b" strokeWidth="1" opacity="0.5" />
      <text x="14" y="21" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e293b" fontFamily="system-ui">2</text>
    </svg>
  );
}

/** Bronze Medal — rank 3 */
export function BronzeMedalIcon({ size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <defs>
        <linearGradient id="bronzeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="50%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#9a3412" />
        </linearGradient>
        <linearGradient id="bronzeRibbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
      </defs>
      <path d="M10 2 L14 8 L18 2" stroke="url(#bronzeRibbon)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="14" cy="16" r="9" fill="url(#bronzeGrad)" />
      <circle cx="14" cy="16" r="7" fill="none" stroke="#9a3412" strokeWidth="1" opacity="0.5" />
      <text x="14" y="21" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff7ed" fontFamily="system-ui">3</text>
    </svg>
  );
}

/** Generic rank badge for rank > 3 */
export function RankBadgeIcon({ size = 28, rank }: IconProps & { rank: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="11" fill="#e2e8f0" />
      <text x="14" y="19" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#475569" fontFamily="system-ui">{rank}</text>
    </svg>
  );
}

// ── Exercise Category Icons ────────────────────────────────────────────────────

/** Lower Body — legs/squat — green */
export function LowerBodyIcon({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="lowerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      {/* Body silhouette squatting */}
      <circle cx="16" cy="5" r="3.5" fill="url(#lowerGrad)" />
      <path d="M16 9v6" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 15 L10 24 M16 15 L22 24" stroke="url(#lowerGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 24 L8 29 M22 24 L24 29" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12 L8 16 M20 12 L24 16" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Upper Body — arms/chest — blue */
export function UpperBodyIcon({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="upperGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="5" r="3.5" fill="url(#upperGrad)" />
      <path d="M16 9v10" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arms raised */}
      <path d="M16 12 L6 8 M16 12 L26 8" stroke="url(#upperGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="5" cy="7" r="2" fill="#60a5fa" />
      <circle cx="27" cy="7" r="2" fill="#60a5fa" />
      {/* Legs */}
      <path d="M16 19 L12 27 M16 19 L20 27" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Core / Abs — orange */
export function CoreIcon({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="coreGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="5" r="3.5" fill="url(#coreGrad)" />
      <path d="M16 9v14" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
      {/* Abs grid */}
      <rect x="12" y="11" width="8" height="4" rx="1.5" fill="#fb923c" opacity="0.3" stroke="#f97316" strokeWidth="1.5" />
      <rect x="12" y="17" width="8" height="4" rx="1.5" fill="#fb923c" opacity="0.3" stroke="#f97316" strokeWidth="1.5" />
      <line x1="16" y1="11" x2="16" y2="21" stroke="#f97316" strokeWidth="1" />
      <path d="M16 23 L12 29 M16 23 L20 29" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Cardio — red heart with pulse */
export function CardioIcon({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="cardioGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <path d="M16 27s-12-8-12-15a7 7 0 0 1 12-4.9A7 7 0 0 1 28 12c0 7-12 15-12 15z" fill="url(#cardioGrad)" opacity="0.2" />
      <path d="M16 27s-12-8-12-15a7 7 0 0 1 12-4.9A7 7 0 0 1 28 12c0 7-12 15-12 15z" stroke="#dc2626" strokeWidth="2" />
      {/* Pulse line */}
      <polyline points="6,16 9,16 11,11 13,21 15,16 17,16 19,13 21,16 26,16" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Full Body — purple person */
export function FullBodyIcon({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="fullBodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="4" r="3.5" fill="url(#fullBodyGrad)" />
      <path d="M16 8v10" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 11 L8 14 M16 11 L24 14" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 18 L12 27 M16 18 L20 27" stroke="url(#fullBodyGrad)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Water Cup — blue cup for water intake buttons */
export function WaterCupIcon({ size = 32, ml = 250 }: IconProps & { ml?: number }) {
  const color = ml <= 150 ? '#7dd3fc' : ml <= 250 ? '#38bdf8' : ml <= 330 ? '#0ea5e9' : '#0284c7';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id={`cupGrad${ml}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <path d="M8 8 L10 26 Q10 28 12 28 L20 28 Q22 28 22 26 L24 8 Z" fill={`url(#cupGrad${ml})`} />
      <path d="M8 8 L10 26 Q10 28 12 28 L20 28 Q22 28 22 26 L24 8 Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 8 H24" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Water fill */}
      <path d="M10.5 18 L11.5 26 Q11.5 27 12.5 27 L19.5 27 Q20.5 27 20.5 26 L21.5 18 Z" fill={color} opacity="0.5" />
    </svg>
  );
}

// ── Food / Meal Icons ─────────────────────────────────────────────────────────

/** Plate — colored plate with fork & knife for Meals tab */
export function PlateIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="13" r="7" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <circle cx="12" cy="13" r="4.5" fill="#fde68a" stroke="#f59e0b" strokeWidth="1" opacity="0.7" />
      {/* Fork */}
      <line x1="5" y1="4" x2="5" y2="8" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4" y1="4" x2="4" y2="7" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6" y1="4" x2="6" y2="7" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5" y1="8" x2="5" y2="11" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
      {/* Knife */}
      <path d="M19 4 L19 9 Q18 10 19 11" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="11" x2="19" y2="14" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Coffee Cup — brown/amber coffee cup for Coffee tab */
export function CoffeeCupIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="coffeeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>
      {/* Cup body */}
      <path d="M5 8 L6.5 19 Q6.5 20 8 20 L14 20 Q15.5 20 15.5 19 L17 8 Z" fill="url(#coffeeGrad)" opacity="0.2" />
      <path d="M5 8 L6.5 19 Q6.5 20 8 20 L14 20 Q15.5 20 15.5 19 L17 8 Z" stroke="#92400e" strokeWidth="1.8" strokeLinejoin="round" />
      {/* Handle */}
      <path d="M17 11 Q21 11 21 14 Q21 17 17 17" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Coffee fill */}
      <path d="M6.5 12 L15.5 12 L14.5 19 Q14.5 19.5 14 19.5 L8 19.5 Q7.5 19.5 7.5 19 Z" fill="#92400e" opacity="0.35" />
      {/* Steam */}
      <path d="M9 5 Q9.5 3.5 9 2" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M12 5 Q12.5 3.5 12 2" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}

/** Juice / Drinks Cup — colorful cup with straw for Drinks tab */
export function JuiceCupIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="juiceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="juiceFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      {/* Cup body */}
      <path d="M6 6 L7.5 20 Q7.5 21 9 21 L15 21 Q16.5 21 16.5 20 L18 6 Z" fill="url(#juiceGrad)" opacity="0.15" />
      <path d="M6 6 L7.5 20 Q7.5 21 9 21 L15 21 Q16.5 21 16.5 20 L18 6 Z" stroke="#f97316" strokeWidth="1.8" strokeLinejoin="round" />
      {/* Juice fill */}
      <path d="M7.8 13 L16.2 13 L15.5 20 Q15.5 20.5 15 20.5 L9 20.5 Q8.5 20.5 8.5 20 Z" fill="url(#juiceFill)" opacity="0.5" />
      {/* Top rim */}
      <line x1="6" y1="6" x2="18" y2="6" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" />
      {/* Straw */}
      <line x1="14" y1="2" x2="13" y2="13" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      {/* Bubble */}
      <circle cx="10" cy="15" r="1" fill="#fdba74" opacity="0.6" />
      <circle cx="13" cy="17" r="0.8" fill="#fdba74" opacity="0.5" />
    </svg>
  );
}

/** Food-specific icons for individual meal cards */
export function MealFoodIcon({ name, size = 22 }: { name: string; size?: number }) {
  const n = name.toLowerCase();

  // Chicken / Kabsa / Shawarma / Rice with Chicken
  if (n.includes("chicken") || n.includes("kabsa") || n.includes("shawarma") || n.includes("rice")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="14" r="6" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
        <circle cx="12" cy="14" r="3.5" fill="#fde68a" />
        {/* Chicken leg shape */}
        <path d="M9 10 Q12 7 15 10" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <circle cx="12" cy="8" r="1.5" fill="#d97706" />
      </svg>
    );
  }
  // Burger
  if (n.includes("burger")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Top bun */}
        <path d="M5 10 Q12 5 19 10" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
        {/* Lettuce */}
        <rect x="4" y="10" width="16" height="2" rx="1" fill="#22c55e" />
        {/* Patty */}
        <rect x="4" y="12" width="16" height="3" rx="1.5" fill="#92400e" />
        {/* Bottom bun */}
        <path d="M4 15 L4 17 Q4 18 5 18 L19 18 Q20 18 20 17 L20 15 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      </svg>
    );
  }
  // Pizza
  if (n.includes("pizza")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 3 L21 20 L3 20 Z" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
        <path d="M12 3 L21 20 L3 20 Z" fill="#f97316" opacity="0.2" />
        <circle cx="10" cy="15" r="1.2" fill="#dc2626" />
        <circle cx="14" cy="13" r="1.2" fill="#dc2626" />
        <circle cx="12" cy="17" r="1" fill="#dc2626" />
        <line x1="3" y1="20" x2="21" y2="20" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  // Salad
  if (n.includes("salad")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="15" rx="8" ry="5" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5" />
        <path d="M8 12 Q10 8 12 12 Q14 8 16 12" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <circle cx="10" cy="14" r="1" fill="#dc2626" />
        <circle cx="14" cy="15" r="1" fill="#f59e0b" />
        <circle cx="12" cy="13" r="0.8" fill="#dc2626" />
      </svg>
    );
  }
  // Foul Medames / Beans
  if (n.includes("foul") || n.includes("bean")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="14" rx="7" ry="5" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
        <ellipse cx="10" cy="13" rx="2" ry="1.5" fill="#92400e" opacity="0.7" />
        <ellipse cx="14" cy="14" rx="2" ry="1.5" fill="#92400e" opacity="0.7" />
        <ellipse cx="12" cy="16" rx="2" ry="1.5" fill="#78350f" opacity="0.6" />
      </svg>
    );
  }
  // Dates
  if (n.includes("date")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <ellipse cx="9" cy="14" rx="2.5" ry="3.5" fill="#92400e" />
        <ellipse cx="15" cy="14" rx="2.5" ry="3.5" fill="#78350f" />
        <ellipse cx="12" cy="12" rx="2.5" ry="3.5" fill="#a16207" />
        <path d="M12 8 Q12 6 11 5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  // Arabic Bread / Bread
  if (n.includes("bread") || n.includes("loaf")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M4 14 Q4 9 12 9 Q20 9 20 14 L19 18 Q19 19 18 19 L6 19 Q5 19 5 18 Z" fill="#fde68a" stroke="#d97706" strokeWidth="1.5" />
        <path d="M6 12 Q12 10 18 12" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.7" />
      </svg>
    );
  }
  // Pasta
  if (n.includes("pasta")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="15" rx="7" ry="4" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5" />
        <path d="M7 13 Q9 11 11 13 Q13 11 15 13 Q17 11 17 13" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <circle cx="10" cy="15" r="1" fill="#dc2626" opacity="0.7" />
        <circle cx="14" cy="15" r="1" fill="#dc2626" opacity="0.7" />
      </svg>
    );
  }

  // Default: generic plate
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="13" r="7" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <circle cx="12" cy="13" r="4" fill="#fde68a" opacity="0.7" />
    </svg>
  );
}

/** Coffee drink icon for individual coffee cards */
export function CoffeeDrinkIcon({ name, size = 22 }: { name: string; size?: number }) {
  const n = name.toLowerCase();
  const isHot = n.includes("espresso") || n.includes("americano") || n.includes("arabic") || n.includes("tea") || n.includes("hot") || n.includes("matcha");
  const color = n.includes("matcha") ? "#16a34a" : n.includes("tea") ? "#d97706" : n.includes("chocolate") ? "#7c3aed" : "#92400e";

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={`coffeeCard${n.slice(0,4)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path d="M5 8 L6.5 19 Q6.5 20 8 20 L14 20 Q15.5 20 15.5 19 L17 8 Z" fill={`url(#coffeeCard${n.slice(0,4)})`} />
      <path d="M5 8 L6.5 19 Q6.5 20 8 20 L14 20 Q15.5 20 15.5 19 L17 8 Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M17 11 Q21 11 21 14 Q21 17 17 17" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <line x1="5" y1="8" x2="17" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {isHot && <path d="M9 5 Q9.5 3.5 9 2" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />}
      {isHot && <path d="M12 5 Q12.5 3.5 12 2" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />}
    </svg>
  );
}

/** Drink icon for individual drink cards */
export function DrinkIcon({ name, size = 22 }: { name: string; size?: number }) {
  const n = name.toLowerCase();
  const color = n.includes("orange") ? "#f97316" : n.includes("apple") ? "#22c55e" : n.includes("mango") ? "#eab308" : n.includes("cola") ? "#7c3aed" : n.includes("milk") ? "#93c5fd" : n.includes("lemon") ? "#facc15" : n.includes("green tea") ? "#16a34a" : "#38bdf8";

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={`drinkCard${n.slice(0,4)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path d="M6 6 L7.5 20 Q7.5 21 9 21 L15 21 Q16.5 21 16.5 20 L18 6 Z" fill={`url(#drinkCard${n.slice(0,4)})`} />
      <path d="M6 6 L7.5 20 Q7.5 21 9 21 L15 21 Q16.5 21 16.5 20 L18 6 Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="6" y1="6" x2="18" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="14" y1="2" x2="13" y2="10" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
