# Prime Fit — Project Overview

## What is Prime Fit?

Prime Fit is a **bilingual (Arabic/English) fitness web application** built for a Kuwaiti gym brand called **Prime Printing Co.** It functions as a Progressive Web App (PWA) that members use on their mobile phones to track workouts, log nutrition, join gym classes, access an AI coach, and participate in a community. The app is gated behind a subscription/license-key system powered by MyFatoorah (a Kuwaiti payment gateway).

The live domain is **https://primefit.manus.space** and the alternate domain is **https://workout8weks-2uwstskv.manus.space**.

---

## Business Goals

- Replace paper-based gym check-in and class scheduling with a digital system
- Provide members with personalised workout programs (male/female, goal-based)
- Drive recurring subscription revenue via monthly/yearly plans (Prime Plus, Prime Pro)
- Reduce admin overhead through a self-service CMS and admin panel
- Build community engagement through social features, challenges, and a spin-wheel reward system
- Retain users with streaks, XP points, AI coaching, and nutrition tracking

---

## Target Users

| Segment | Description |
|---------|-------------|
| **Gym members** | Primary users — Kuwaiti women and men who are members of Prime Printing Co. gyms |
| **Admin / Owner** | Single admin user (the gym owner) who manages content, licenses, classes, and users |
| **Arabic-first users** | The app defaults to Arabic (Kuwaiti dialect) with full English toggle |

---

## Main Features

### Core Workout Tracking
- Session check-in with session type selection (Lower Body, Upper Body, Core & Cardio, Chest & Shoulders, Aqua, Sauna, Cardio)
- Active session timer with exercise list, set/rep tracking, rest timer, and notes
- Session history with delete capability
- Workout calendar view
- Streak counter

### Gym Classes
- Today's classes section on the home screen, grouped by gym and branch
- Admin can create gyms, branches, and class schedules (with Excel/CSV import)
- Members can join classes (awards XP, logs calories, creates a linked session)
- Leave/undo join functionality

### Nutrition Tracking
- Daily calorie goal based on TDEE calculation
- Meal logging with USDA food database search and AI food photo analysis
- Water intake tracking
- Daily reset at midnight (old records moved to history)
- Macro breakdown (protein, carbs, fat)

### AI Coach (MyCoach)
- Conversational AI powered by the Manus built-in LLM
- Personalized advice based on user profile (weight, goal, gender, program)
- Chat history persisted per user

### Community
- Social feed with posts, likes, and comments
- Mentions (@username) support
- XP leaderboard
- Challenge system with rewards

### Spin Wheel Rewards
- Weighted random reward system (common/uncommon/rare/jackpot)
- Admin-configurable reward catalog
- Rewards include premium days, XP bonuses, badges, AI boosts

### Subscription & Licensing
- Free 7-day trial (one per email)
- Prime Plus (monthly/yearly) and Prime Pro (monthly/yearly) paid plans
- MyFatoorah payment gateway integration
- License key system (PRIME-XXXX-XXXX format) — keys are emailed after payment
- WooCommerce webhook integration for legacy order processing
- LicenseGate component wraps the entire app

### Admin Panel
- User management (view, promote to admin, deactivate)
- License key management (create, extend, deactivate, copy to clipboard)
- Billing history view
- Notification system (in-app popups, email, or both)
- CMS: session icons, exercise images/videos, site appearance
- Gym and branch management
- Class schedule management with Excel import
- Error log viewer
- Spin wheel reward configuration

### Profile & Settings
- Profile setup (name, gender, age, height, current weight, target weight)
- TDEE calculation
- Weight log with chart
- Language toggle (Arabic Kuwaiti dialect / English)
- Privacy settings
- Data reset button

### PWA Features
- Install prompt (Android native + iOS manual guide)
- Offline-capable (service worker)
- Keyboard-aware layout (CSS variable `--keyboard-height`)
- Haptic feedback on tab switches

---

## Current Project Status

The application is **production-deployed** at `https://primefit.manus.space`. The core feature set is complete and functional. The site is hosted on Manus Autoscale (serverless) infrastructure.

**Known billing issue:** As of the last session, the site showed "Site unavailable due to unpaid billing" — this is a Manus account billing issue, not a code issue.

---

## Completed Features

All items in `todo.md` are marked `[x]`. Key completed milestones:

- Full bilingual UI (Arabic Kuwaiti dialect + English)
- Workout session tracking with active session timer
- Session history and statistics
- Gym classes system (gyms, branches, schedules, join/leave)
- Nutrition tracking with USDA food search and AI photo analysis
- AI coach chat
- Community feed with posts, likes, comments, mentions
- Spin wheel reward system
- MyFatoorah payment integration
- WooCommerce webhook integration
- License key system with email delivery
- Admin panel (full CMS, user management, notifications, error logs)
- PWA install prompt
- CMS image pipeline (all images served via `/api/img/` proxy to fix Safari/iOS issues)
- In-app admin notification popups
- Google OAuth login

---

## Pending Features / Known Gaps

- **Twilio WhatsApp integration** — referenced in project knowledge but not yet implemented in code; the knowledge note says logs should show "Prime reward Twilio whatsapp"
- **Automated invoice approval with contact number verification** — referenced in project knowledge, not yet implemented
- **Push notifications** — VAPID keys are configured and the `web-push` package is installed, but the full push notification delivery flow to end-user devices is not fully wired
- **Supabase integration** — `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are in `env.ts` but no Supabase client code exists in the project; these appear to be legacy/unused variables
- **Exercise image matching** — project knowledge notes that correct images must match standard international exercise names; some exercise images may still be mismatched
- **Home screen pop-up notifications for first-time users** — referenced in project knowledge with a "P with gold crown" logo icon; partially implemented via `AdminNotificationPopup` but the first-time-user-specific onboarding popup is not distinct

---

## Known Issues

1. **Safari/iOS image loading** — The platform CDN intercepts `/manus-storage/` requests and returns a `307` redirect to CloudFront. Safari blocks cross-origin `307` redirects on `<img>` tags. The fix is the `/api/img/` proxy (`server/_core/imageProxy.ts`), but any new image paths added directly as `/manus-storage/` URLs will break on Safari again. All image paths **must** go through `resolveImageUrl()` from `imageUtils.ts`.

2. **Autoscale cold starts** — The site uses serverless hosting. After inactivity, the first request takes 5–15 seconds. Users see a loading spinner. This is expected behavior but may confuse users.

3. **Weight Progress NaN display** — A screenshot showed "NaN% • Lost 0.0 kg" when `currentWeight` and `targetWeight` are both 0 (new user before profile setup). The division-by-zero case should be guarded.

4. **Pending billing history cleanup** — Old pending transactions should be deleted after payment succeeds. The webhook handler does this, but if a webhook is missed, stale pending rows remain.

---

## Technical Debt

- `server/_core/storageProxy.ts` exists alongside `server/_core/imageProxy.ts` — the storageProxy pipes bytes for `/manus-storage/` on the dev server, while imageProxy handles `/api/img/` on production. This dual-proxy approach is confusing and should be unified.
- `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` / `VITE_SUPABASE_ANON_KEY` are defined in `env.ts` but never used — should be removed to reduce confusion.
- `client/public/images/` directory contains image files that are not deployed (only the sandbox has them). The `imageUtils.ts` CDN map is the source of truth, but the local files create a false sense of security.
- Some components use inline `style={{}}` objects alongside Tailwind classes — inconsistent styling approach.
- The `Home.tsx` file is extremely large (~1200+ lines) and should be split into sub-components.
- `exercises.ts` and `workoutData.ts` are large static data files that could be moved to the database for admin editability.
