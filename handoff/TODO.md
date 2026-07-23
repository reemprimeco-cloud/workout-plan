# Prime Fit — Pending Tasks

## High Priority

These items directly affect data integrity, cross-device functionality, or core user experience.

### Cross-Device Data Sync (Critical)
The `useGymTracker` hook currently stores all workout session data in **localStorage only**. This means sessions, weight logs, and active session state are lost when the user logs in on a different device. This is the single most important architectural issue to resolve.

- [ ] Audit all localStorage keys and data structures used in `useGymTracker` hook
- [ ] Create/verify DB tables: `workout_sessions`, `weight_logs`, `active_session`
- [ ] Build tRPC procedures: `createSession`, `getSessions`, `deleteSession`, `logWeight`, `getWeightLog`, `saveActiveSession`, `getActiveSession`, `clearActiveSession`
- [ ] Migrate `useGymTracker` hook to use tRPC instead of localStorage
- [ ] Add one-time data migration: import existing localStorage data to DB on first login
- [ ] Ensure profile data (name, age, height, weight, gender, goal) syncs from DB on all devices
- [ ] Test: login on device A, add session, login on device B, verify session appears

### Avatar Upload (S3)
Currently, profile photos are stored as base64 strings in the database, which causes performance issues and database bloat.

- [ ] Add `uploadAvatar` procedure to `userProfile` router (base64 → S3 → return URL)
- [ ] Update `ProfilePanel.tsx` to call `uploadAvatar` and store the S3 URL instead of base64

### Arabic Gender-Specific Text
The Arabic text throughout the app uses the feminine form by default. Male users see grammatically incorrect Arabic. This affects the entire Arabic experience.

- [ ] Fix all Arabic feminine text to show masculine form when `profile.gender === 'male'` across all pages and components:
  - `Home.tsx` / CheckInPanel: session start buttons, motivational text
  - `ProfilePanel.tsx`: plan description, BMI labels, goal text
  - `ActiveSession.tsx`: exercise instructions, motivational text
  - `SessionHistory.tsx`: session labels
  - `StatsPanel.tsx`: stats descriptions
  - `WorkoutGuide.tsx`: guide text
  - `Nutrition.tsx`: nutrition advice text
  - `MyCoach.tsx`: coach system prompt
  - `exercises.ts` / `exerciseData.ts`: any hardcoded Arabic feminine text

### NaN% Weight Progress Display
New users who have not set their weight yet see "NaN% • Lost 0.0 kg" in the weight progress bar on the home screen.

- [ ] Add null/zero guard in the weight progress calculation in `Home.tsx` CheckInPanel
- [ ] Show "Set your goal weight to track progress" message instead of NaN% for new users

---

## Medium Priority

These items improve the user experience but do not break core functionality.

### Nutrition Tab Redesign
The current meals tab is functional but lacks the polished iOS-style design the owner wants.

- [ ] Add `meal_favorites` table to DB schema and run `pnpm db:push`
- [ ] Server: `addFavorite`, `removeFavorite`, `getFavorites` procedures
- [ ] Server: `getHistory` grouped by day procedure
- [ ] Server: `getRecentMeals` procedure
- [ ] Server: `quickAdd` procedure
- [ ] Redesign `NutritionMealsTab`: daily view grouped by meal type (Breakfast, Lunch, Dinner, Snack)
- [ ] MealsTab: daily calorie/macro summary header
- [ ] MealsTab: water tracking row
- [ ] MealsTab: meal group sections with + add button per group
- [ ] MealsTab: floating FAB with quick-add sheet
- [ ] MealsTab: manual entry form
- [ ] MealsTab: History tab (browse previous days)
- [ ] MealsTab: Favorites section
- [ ] MealsTab: Recently Used section
- [ ] MealsTab: swipe-to-delete
- [ ] MealsTab: replace remaining emoji with SVG vector icons
- [ ] MealsTab: white background iOS-style cards

### Automated Invoice Approval
The owner wants the system to automatically approve MyFatoorah invoices by matching the contact number on the invoice.

- [ ] Design the contact number verification flow
- [ ] Add contact number field to the subscription checkout flow
- [ ] Implement server-side matching logic in the MyFatoorah webhook handler

### Help/User Guide Update
The in-app user guide (`UserGuide.tsx`) is outdated and does not reflect the current feature set.

- [ ] Update `UserGuide.tsx` with documentation for all current features
- [ ] Add screenshots or illustrations for key flows
- [ ] Ensure the guide is bilingual (Arabic Kuwaiti dialect + English)

### Exercise Data Migration to Database
Exercise data is currently hardcoded in `exercises.ts` and `exerciseData.ts`. This makes adding or editing exercises require a code deployment.

- [ ] Design the `exercises` database table schema
- [ ] Create a migration script to import all static exercise data into the DB
- [ ] Build admin UI for adding/editing exercises without code changes
- [ ] Update `ExerciseLibrary.tsx` and `ActiveSession.tsx` to fetch from DB instead of static files

---

## Low Priority

These items are improvements or nice-to-have features.

### Subscription Renewal Reminders
- [ ] Send email/push notification 3 days before subscription expiry
- [ ] Implement using the Heartbeat scheduled job system (`server/_core/heartbeat.ts`)

### Leaderboard & XP Improvements
- [ ] Add weekly/monthly leaderboard views (currently only all-time)
- [ ] Add XP history log visible to users
- [ ] Add level-up animation when user reaches a new XP threshold

### Community Improvements
- [ ] Add image compression before upload (currently uploads full-size images)
- [ ] Add post moderation tools to the Admin Panel
- [ ] Add "Report post" functionality for users

### Coach Memory Improvements
- [ ] Implement long-term coach memory that summarises past conversations
- [ ] Allow users to set specific goals for the coach to track over time

### PWA Improvements
- [ ] Add offline support with service worker caching for the exercise library
- [ ] Add background sync for workout sessions logged while offline

### Technical Debt
- [ ] Remove unused Supabase environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `VITE_SUPABASE_ANON_KEY`) from `server/_core/env.ts`
- [ ] Split `server/routers.ts` into per-feature router files (currently some logic is duplicated between `routers.ts` and `server/routers/`)
- [ ] Move all hardcoded Arabic/English strings in `LanguageContext.tsx` to a separate `i18n/` directory for easier translation management
- [ ] Add end-to-end tests for the payment flow (MyFatoorah webhook → license generation → email)
- [ ] Add integration tests for the gym class join flow
