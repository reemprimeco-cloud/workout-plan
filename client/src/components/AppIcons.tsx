/**
 * AppIcons.tsx — Prime Fit centralized SVG vector outline icon library
 * All icons use currentColor so they inherit text color from parent.
 * Usage: <AppIcons.Flame className="w-5 h-5 text-orange-500" />
 */

import React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
};

const icon =
  (path: React.ReactNode, viewBox = "0 0 24 24") =>
  ({ size = 20, className = "", ...props }: IconProps) =>
    (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {path}
      </svg>
    );

export const AppIcons = {
  // ── Fitness & Workout ──────────────────────────────────────────────────────
  Dumbbell: icon(
    <>
      <path d="M6 4v16M18 4v16" />
      <path d="M3 8h6M15 8h6M3 16h6M15 16h6" />
      <path d="M9 8h6v8H9z" />
    </>
  ),
  Flame: icon(
    <path d="M12 2c0 0-4 4-4 8a4 4 0 0 0 8 0c0-1.5-.5-3-2-4 0 2-1 3-2 3s-1-1-1-2c0-2 1-5 1-5z" />
  ),
  Running: icon(
    <>
      <circle cx="12" cy="4" r="1.5" />
      <path d="M8 21l2-6 2 3 2-3 2 6" />
      <path d="M6 12l2-4 4 2 4-2 2 4" />
    </>
  ),
  Trophy: icon(
    <>
      <path d="M6 2h12v8a6 6 0 0 1-12 0V2z" />
      <path d="M6 4H3a2 2 0 0 0 0 4h3" />
      <path d="M18 4h3a2 2 0 0 0 0 4h-3" />
      <path d="M12 16v4" />
      <path d="M8 20h8" />
    </>
  ),
  Medal: icon(
    <>
      <circle cx="12" cy="14" r="6" />
      <path d="M9 2l3 4 3-4" />
      <path d="M9 2H6l3 6" />
      <path d="M15 2h3l-3 6" />
    </>
  ),
  Target: icon(
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  Streak: icon(
    <>
      <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H13L13 2z" />
    </>
  ),
  Mountain: icon(
    <>
      <path d="M3 20l7-12 4 6 3-4 4 10H3z" />
    </>
  ),
  Swim: icon(
    <>
      <circle cx="12" cy="6" r="2" />
      <path d="M5 20c2-1 4-2 7-2s5 1 7 2" />
      <path d="M5 16c2-1 4-2 7-2s5 1 7 2" />
      <path d="M12 8l-4 5h8l-4-5z" />
    </>
  ),
  Yoga: icon(
    <>
      <circle cx="12" cy="4" r="1.5" />
      <path d="M8 12c0-2 2-4 4-4s4 2 4 4" />
      <path d="M5 14l3-2 4 4 4-4 3 2" />
      <path d="M9 20l3-4 3 4" />
    </>
  ),
  Cardio: icon(
    <>
      <path d="M2 12h4l3-7 4 14 3-7h6" />
    </>
  ),
  Weight: icon(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
    </>
  ),
  Timer: icon(
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 3" />
      <path d="M9 2h6" />
      <path d="M12 2v3" />
    </>
  ),
  Calendar: icon(
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  CalendarCheck: icon(
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M9 16l2 2 4-4" />
    </>
  ),
  Repeat: icon(
    <>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </>
  ),
  // ── Nutrition & Food ──────────────────────────────────────────────────────
  Apple: icon(
    <>
      <path d="M12 2a3 3 0 0 1 3 3" />
      <path d="M7 6a7 7 0 0 0 0 12h10a7 7 0 0 0 0-12" />
    </>
  ),
  Salad: icon(
    <>
      <path d="M7 21h10" />
      <path d="M12 21V13" />
      <path d="M4 13h16" />
      <path d="M5 13c0-4 3-7 7-7s7 3 7 7" />
      <path d="M9 7c0-2 1-3 3-3" />
    </>
  ),
  Fork: icon(
    <>
      <path d="M8 2v4a2 2 0 0 0 4 0V2" />
      <path d="M10 6v16" />
      <path d="M16 2v16" />
      <path d="M14 10a2 2 0 0 0 4 0V2" />
    </>
  ),
  Plate: icon(
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 5V2" />
      <path d="M5.5 7.5L3.5 5.5" />
      <path d="M18.5 7.5l2-2" />
    </>
  ),
  Water: icon(
    <>
      <path d="M12 2C8 8 6 11 6 14a6 6 0 0 0 12 0c0-3-2-6-6-12z" />
    </>
  ),
  Coffee: icon(
    <>
      <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
      <path d="M6 2v2M10 2v2M14 2v2" />
    </>
  ),
  Protein: icon(
    <>
      <path d="M12 2a5 5 0 0 1 5 5v1h1a3 3 0 0 1 0 6h-1a5 5 0 0 1-10 0H6a3 3 0 0 1 0-6h1V7a5 5 0 0 1 5-5z" />
    </>
  ),
  Carbs: icon(
    <>
      <path d="M3 12h18" />
      <path d="M12 3a9 9 0 0 1 9 9" />
      <path d="M3 12a9 9 0 0 0 9 9" />
      <path d="M12 3v18" />
    </>
  ),
  Fat: icon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z" />
    </>
  ),
  Scale: icon(
    <>
      <path d="M3 20h18" />
      <path d="M12 4v16" />
      <path d="M5 10l7-6 7 6" />
      <path d="M5 10h14" />
    </>
  ),
  // ── UI & Navigation ───────────────────────────────────────────────────────
  Home: icon(
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
      <path d="M9 22V12h6v10" />
    </>
  ),
  Stats: icon(
    <>
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </>
  ),
  Chart: icon(
    <>
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 4 4 4-6" />
    </>
  ),
  Community: icon(
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  Coach: icon(
    <>
      <rect x="3" y="3" width="18" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
      <path d="M9 9l2 2 4-4" />
    </>
  ),
  Robot: icon(
    <>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      <circle cx="9" cy="14" r="1.5" />
      <circle cx="15" cy="14" r="1.5" />
      <path d="M9 18h6" />
    </>
  ),
  Exercises: icon(
    <>
      <path d="M6 4v16M18 4v16" />
      <path d="M3 8h6M15 8h6M3 16h6M15 16h6" />
      <path d="M9 8h6v8H9z" />
    </>
  ),
  Nutrition: icon(
    <>
      <path d="M7 21h10" />
      <path d="M12 21V13" />
      <path d="M4 13h16" />
      <path d="M5 13c0-4 3-7 7-7s7 3 7 7" />
    </>
  ),
  Profile: icon(
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  Settings: icon(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  Bell: icon(
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  Search: icon(
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </>
  ),
  Plus: icon(
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  Minus: icon(
    <path d="M5 12h14" />
  ),
  Close: icon(
    <path d="M18 6L6 18M6 6l12 12" />
  ),
  Check: icon(
    <path d="M20 6L9 17l-5-5" />
  ),
  ChevronDown: icon(
    <path d="M6 9l6 6 6-6" />
  ),
  ChevronUp: icon(
    <path d="M18 15l-6-6-6 6" />
  ),
  ChevronRight: icon(
    <path d="M9 18l6-6-6-6" />
  ),
  ChevronLeft: icon(
    <path d="M15 18l-6-6 6-6" />
  ),
  ArrowRight: icon(
    <>
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </>
  ),
  ArrowLeft: icon(
    <>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </>
  ),
  Edit: icon(
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  Trash: icon(
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </>
  ),
  Save: icon(
    <>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </>
  ),
  Bookmark: icon(
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  ),
  BookmarkFilled: icon(
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" fill="currentColor" stroke="none" />
  ),
  Heart: icon(
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  ),
  HeartFilled: icon(
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor" />
  ),
  Comment: icon(
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" />
    </>
  ),
  Share: icon(
    <>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </>
  ),
  Send: icon(
    <>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </>
  ),
  Message: icon(
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" />
    </>
  ),
  Follow: icon(
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </>
  ),
  Unfollow: icon(
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </>
  ),
  Camera: icon(
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  Image: icon(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </>
  ),
  // ── Health & Body ─────────────────────────────────────────────────────────
  Body: icon(
    <>
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6v8" />
      <path d="M8 10l4 2 4-2" />
      <path d="M10 14l-2 6" />
      <path d="M14 14l2 6" />
    </>
  ),
  Female: icon(
    <>
      <circle cx="12" cy="8" r="5" />
      <path d="M12 13v8M9 18h6" />
    </>
  ),
  Male: icon(
    <>
      <circle cx="10" cy="14" r="5" />
      <path d="M19 5l-5.5 5.5M19 5h-5M19 5v5" />
    </>
  ),
  Sleep: icon(
    <>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </>
  ),
  Brain: icon(
    <>
      <path d="M12 5a3 3 0 0 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 0 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </>
  ),
  // ── Status & Feedback ─────────────────────────────────────────────────────
  Star: icon(
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  ),
  StarFilled: icon(
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" />
  ),
  Award: icon(
    <>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </>
  ),
  Celebration: icon(
    <>
      <path d="M5.8 11.3L2 22l10.7-3.79" />
      <path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01" />
      <path d="M22 2l-2.24.75" />
      <path d="M20 8.54l-1.18 1.18" />
      <path d="M3.5 12.5l1.18-1.18" />
    </>
  ),
  Gift: icon(
    <>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </>
  ),
  Lock: icon(
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  Unlock: icon(
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </>
  ),
  Warning: icon(
    <>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  Info: icon(
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </>
  ),
  // ── Misc ──────────────────────────────────────────────────────────────────
  Clipboard: icon(
    <>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </>
  ),
  Pin: icon(
    <>
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v3.76z" />
    </>
  ),
  Scan: icon(
    <>
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </>
  ),
  Insights: icon(
    <>
      <path d="M3 3v18h18" />
      <path d="M18 9l-5 5-2-2-4 4" />
    </>
  ),
  Dashboard: icon(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  Trending: icon(
    <>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </>
  ),
  Smile: icon(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </>
  ),
  Wave: icon(
    <>
      <path d="M7.5 4.27L9 6" />
      <path d="M10.5 2L12 3.5" />
      <path d="M14 3.5L15.5 2" />
      <path d="M17 6L18.5 4.27" />
      <path d="M5 9c0 0 2-2 4-2s4 2 4 2 2-2 4-2 4 2 4 2" />
      <path d="M5 14c0 0 2-2 4-2s4 2 4 2 2-2 4-2 4 2 4 2" />
      <path d="M5 19c0 0 2-2 4-2s4 2 4 2 2-2 4-2 4 2 4 2" />
    </>
  ),
  Mention: icon(
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </>
  ),
  Eye: icon(
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  EyeOff: icon(
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </>
  ),
  Copy: icon(
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  Refresh: icon(
    <>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </>
  ),
  Lightning: icon(
    <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H13L13 2z" />
  ),
  Subscription: icon(
    <>
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </>
  ),
  Users: icon(
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  Report: icon(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </>
  ),
  Construction: icon(
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M12 12h.01" />
      <path d="M17 12h.01" />
      <path d="M7 12h.01" />
    </>
  ),
  Sunrise: icon(
    <>
      <path d="M17 18a5 5 0 0 0-10 0" />
      <line x1="12" y1="2" x2="12" y2="9" />
      <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
      <line x1="1" y1="18" x2="3" y2="18" />
      <line x1="21" y1="18" x2="23" y2="18" />
      <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
      <line x1="23" y1="22" x2="1" y2="22" />
      <polyline points="8 6 12 2 16 6" />
    </>
  ),
  Leaf: icon(
    <path d="M2 22l10-10M13 2s5 0 8 3-1 8-1 8-5 0-8-3 1-8 1-8z" />
  ),
  Cloud: icon(
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  ),
  CreditCard: icon(
    <>
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </>
  ),
  Pencil: icon(
    <>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </>
  ),
  Road: icon(
    <>
      <path d="M3 17l3-10 3 10M15 17l3-10 3 10" />
      <path d="M9 7h6" />
      <path d="M7 17h10" />
    </>
  ),
  Map: icon(
    <>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </>
  ),
  Location: icon(
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  Compass: icon(
    <>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </>
  ),
  // ── Additional icons ──────────────────────────────────────────────────────
  Square: icon(
    <rect x="3" y="3" width="18" height="18" rx="2" />
  ),
  Notes: icon(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </>
  ),
  Swimming: icon(
    <>
      <path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
      <path d="M2 18c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
      <circle cx="12" cy="6" r="2" />
      <path d="M10 8l2 4" />
    </>
  ),
  Spa: icon(
    <>
      <path d="M12 22c-4.97 0-9-4.03-9-9 0-3.31 2.69-6 6-6 .34 0 .67.03 1 .08V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2.08c.33-.05.66-.08 1-.08 3.31 0 6 2.69 6 6 0 4.97-4.03 9-9 9z" />
    </>
  ),
  Download: icon(
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
  Sun: icon(
    <>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </>
  ),
  Rowing: icon(
    <>
      <path d="M3 17l4-8 4 4 4-6 4 4" />
      <path d="M3 21h18" />
    </>
  ),
  Spinner: icon(
    <>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </>
  ),
  Moon: icon(
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  ),
};

export default AppIcons;
