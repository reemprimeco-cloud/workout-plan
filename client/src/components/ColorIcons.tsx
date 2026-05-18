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
