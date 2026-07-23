# Prime Fit — Feature Documentation

## 1. Authentication & Onboarding

**Purpose:** Securely identify users and collect the profile data needed to personalise the workout program.

**Flow:** A new visitor lands on the pricing/auth page. They can sign up via Manus OAuth, Google OAuth, or standalone email/password. After first login, if the user has no `name` set, they are redirected to `/profile-setup` to enter their name, gender, age, height, current weight, target weight, and activity level. Once the profile is complete, the LicenseGate checks for a valid subscription.

**Business Logic:**
- One free 7-day trial per email address. The system checks `accessCodes` for any existing row with the same email before creating a new trial.
- After the trial expires, the user must purchase a paid plan to continue.
- Users cannot bypass the license gate by logging out and logging back in — the gate checks the `subscriptions` table, not localStorage.
- Google OAuth users always have a name from Google, so they skip the profile setup redirect.

**Files Involved:** `client/src/pages/AuthPage.tsx`, `client/src/pages/ProfileSetupPage.tsx`, `client/src/components/LicenseGate.tsx`, `server/routers/standaloneAuth.ts`, `server/_core/oauth.ts`, `server/handlers/googleOAuth.ts`

**Database Tables:** `users`, `subscriptions`, `accessCodes`

**Future Improvements:** Add phone number verification for Kuwait-specific identity checks. Implement the automated invoice approval with contact number matching (referenced in project knowledge).

---

## 2. Subscription & License System

**Purpose:** Gate access to the app behind a paid subscription. Generate and distribute license keys after payment.

**Flow:**
1. User selects a plan on the pricing page (Free Trial, Prime Plus Monthly/Yearly, Prime Pro Monthly/Yearly)
2. For paid plans: `subscription.createCheckout` creates a MyFatoorah invoice and returns a payment URL. User is redirected to MyFatoorah's hosted payment page.
3. After payment, MyFatoorah sends a webhook to `/api/webhooks/myfatoorah`
4. The webhook handler verifies the HMAC signature, calls MyFatoorah's `getPaymentStatus` API to confirm payment, upserts the `subscriptions` row, generates a `PRIME-XXXX-XXXX` license key in `accessCodes`, and emails it to the customer
5. User is redirected to `/subscription/success?invoiceId=xxx` where the app polls for the license key

**License Key Format:** `PRIME-` followed by two groups of 4 random alphanumeric characters (e.g., `PRIME-A3K9-X7M2`). Generated in `server/handlers/licenseUtils.ts`.

**Business Logic:**
- License keys expire 7 days from first use (not from generation date)
- Old pending transactions are deleted when a new payment succeeds for the same user
- WooCommerce orders (legacy) are also processed and generate license keys via `/api/webhooks/woocommerce`
- Free trial: one per email, not per account — prevents creating multiple accounts to get multiple trials

**Files Involved:** `client/src/pages/Pricing.tsx`, `client/src/pages/SubscriptionResult.tsx`, `client/src/components/LicenseGate.tsx`, `server/routers/subscription.ts`, `server/_core/myfatoorah.ts`, `server/handlers/myfatoorahWebhook.ts`, `server/handlers/wooCommerceWebhook.ts`, `server/handlers/licenseUtils.ts`

**Database Tables:** `subscriptions`, `accessCodes`, `billingHistory`

**Future Improvements:** Automated invoice approval with contact number verification. Subscription renewal reminders via email/push.

---

## 3. Home Screen & Workout Check-in

**Purpose:** The primary screen. Shows today's gym classes, workout type selection cards, weight progress, and the active session banner.

**Flow:** The home screen has 7 tabs: Home, Stats, Nutrition, Exercises, Coach, Community, Profile. The Home tab shows:
- Weight progress bar (current → target)
- Today's Classes section (fetched from `gymClasses.getTodayClasses`)
- Workout type cards (Lower Body, Upper Body, Core & Cardio, Chest & Shoulders, Aqua, Sauna, Cardio)
- If a session is active, an "Active Session" banner replaces the cards

**Business Logic:**
- Session icons on the cards are loaded from the CMS (`cms.getPublicSessionIcons`). If an admin has uploaded a custom icon for a session type, it overrides the default. Default icons are CDN images served via `/api/img/`.
- All image `src` values pass through `resolveImageUrl()` from `imageUtils.ts` to ensure Safari compatibility.
- Tab switching uses haptic feedback (`useHaptic` hook) on supported devices.
- The active session state is persisted in localStorage via `useGymTracker`.

**Files Involved:** `client/src/pages/Home.tsx`, `client/src/hooks/useGymTracker.ts`, `client/src/contexts/CMSContext.tsx`, `client/src/lib/imageUtils.ts`

**Database Tables:** `gymClasses`, `joinedClasses`, `sessionIconOverrides`

**Future Improvements:** Fix the NaN% display in weight progress when both weights are 0 (new user before profile setup).

---

## 4. Active Session Tracker

**Purpose:** Real-time workout session tracking with exercise list, set/rep logging, rest timer, and notes.

**Flow:** When a user taps "Start Now" on a workout card, the `startSession()` function in `useGymTracker` creates an active session in localStorage. The `ActiveSession` component renders the exercise list for that session type (from `exerciseData.ts`), with checkboxes for each set. A rest timer counts down between sets. When the user taps "Finish Session", the session is saved to the database via `workout.createSession`.

**Business Logic:**
- Session types map to exercise categories: `lower_body` → Legs, `upper_arms` → Arms + Back, etc.
- Exercise images and YouTube links can be overridden by the admin via the CMS (`exerciseOverrides` table)
- Duration is calculated from start time to finish time
- Calories burned is estimated based on session type and duration
- XP is awarded on session completion

**Files Involved:** `client/src/components/ActiveSession.tsx`, `client/src/hooks/useGymTracker.ts`, `client/src/data/exercises.ts`, `client/src/lib/exerciseData.ts`, `server/routers/workout.ts`

**Database Tables:** `gymSessions`, `exerciseOverrides`

---

## 5. Gym Classes

**Purpose:** Show today's gym class schedule and allow members to join classes.

**Flow:** The "Today's Classes" section on the home screen fetches classes for the current weekday. Classes are grouped by gym and branch. Tapping a gym expands its class list. Tapping "Join" calls `gymClasses.joinClass`, which creates a `joinedClasses` row, awards XP, estimates calories, and creates a linked `gymSessions` row.

**Business Logic:**
- Classes are scheduled by weekday (Monday–Sunday), not by specific date. The app determines today's weekday and fetches matching classes.
- Gym logos are user-uploaded images stored in S3 and served via `/api/img/`.
- Admin can import class schedules from Excel/CSV files via the Admin Panel.
- Joining a class is equivalent to completing a workout session — it counts toward streaks and XP.

**Files Involved:** `client/src/pages/Home.tsx` (TodayClassesSection), `server/routers/gymClasses.ts`

**Database Tables:** `gyms`, `gymBranches`, `gymClasses`, `joinedClasses`, `gymSessions`

---

## 6. Nutrition Tracking

**Purpose:** Daily food and water logging with calorie goal tracking and AI food photo analysis.

**Flow:** The Nutrition tab shows daily calorie progress (consumed / goal / remaining), a water intake tracker, and a meal log grouped by meal type (Breakfast, Lunch, Dinner, Snack). Users can add foods by searching the USDA FoodData Central database or by photographing their meal for AI analysis.

**Business Logic:**
- Daily calorie and water intake resets at midnight. The reset is client-side — the app uses the current date (`YYYY-MM-DD`) as the key for all queries. Old records remain in the database as history.
- The calorie goal is synced from the TDEE calculation in the user's profile. If the user updates their profile weight or activity level, the nutrition goal updates accordingly.
- `kcal consumed` = sum of all `mealEntries.calories` for today. `goal` = `nutritionGoals.calories`. `remaining` = goal − consumed.
- AI food photo analysis calls `invokeLLM` with the image URL and a structured JSON schema response to extract food name, calories, and macros.

**Files Involved:** `client/src/pages/Nutrition.tsx`, `server/routers/nutrition.ts`, `client/src/lib/calorieCalc.ts`

**Database Tables:** `nutritionGoals`, `mealEntries`, `waterLogs`, `nutritionInsights`

---

## 7. AI Coach (MyCoach)

**Purpose:** Conversational AI fitness coach personalised to the user's profile and goals.

**Flow:** The Coach tab shows a chat interface. The user types a message and receives an AI response. The chat history is persisted in the database. The AI has access to the user's profile (weight, goal, gender, program) via a system prompt.

**Business Logic:**
- The system prompt includes the user's name, gender, current weight, target weight, and preferred language.
- Responses are in the user's preferred language (Arabic or English).
- Chat history is limited to the last 50 messages to keep context manageable.
- The AI uses the Manus built-in LLM (`invokeLLM`) — no OpenAI key required.

**Files Involved:** `client/src/pages/Home.tsx` (CoachTab), `server/routers/coach.ts`, `server/_core/llm.ts`

**Database Tables:** `coachChatHistory`, `coachMemory`, `coachCheckins`, `coachInsights`

---

## 8. Community

**Purpose:** Social feed for gym members to share achievements, post updates, and engage with each other.

**Flow:** The Community tab shows a paginated feed of posts. Users can create text or image posts, react with like/cheer/fire, and comment. The leaderboard shows the top XP earners.

**Business Logic:**
- Post visibility can be public, friends-only, or private.
- `likesCount` and `commentsCount` are denormalized counters on the `communityPosts` table for performance.
- @mentions are parsed from post content and stored in `postMentions`, triggering social notifications.
- XP is awarded for posting, commenting, and reacting.
- Real-time updates use Socket.IO — new posts appear in the feed without a page refresh.

**Files Involved:** `client/src/pages/Community.tsx`, `client/src/components/MentionInput.tsx`, `server/routers/community.ts`

**Database Tables:** `communityPosts`, `communityReactions`, `communityComments`, `postMentions`, `socialNotifications`, `communityXpLog`

---

## 9. Spin Wheel Rewards

**Purpose:** Gamified reward system tied to challenge completion. Users spin a weighted wheel to win prizes.

**Flow:** When a user completes a challenge, they earn a spin. The spin wheel uses weighted random selection from the `rewardProbabilities` table. Rewards include premium subscription days, XP bonuses, badges, and AI coaching boosts.

**Business Logic:**
- Reward rarities: common (high weight), uncommon, rare, jackpot (very low weight).
- Jackpot wins are recorded in `jackpotWinners` for display in a "recent winners" ticker.
- Admin can configure reward weights and values from the Admin Panel.
- Rewards are applied immediately after spinning (e.g., premium days are added to `subscriptions.expiresAt`).

**Files Involved:** `client/src/components/SpinWheel.tsx`, `server/routers/spinWheel.ts`

**Database Tables:** `rewardProbabilities`, `rewardSpins`, `rewardHistory`, `challengeRewards`, `jackpotWinners`

---

## 10. Admin Panel

**Purpose:** Full management interface for the gym owner. Accessible at `/admin` for users with `role === 'admin'`.

**Sections:**

| Section | Purpose |
|---------|---------|
| Users | View all users, promote to admin, deactivate accounts |
| Licenses | Create, extend, deactivate license keys. Copy-to-clipboard button on each key. |
| Billing | View all payment transactions |
| Notifications | Send broadcast notifications (in-app popup, email, or both) |
| CMS | Upload session icons and exercise images/videos |
| Gyms | Create and manage gyms, branches, and class schedules |
| Spin Wheel | Configure reward catalog |
| Error Logs | View and resolve client-side error reports |

**Business Logic:**
- Admin role is set in the `users.role` column. Promote a user via the Users tab or directly via SQL.
- License keys created manually by admin default to 7-day expiry from first use.
- Broadcast notifications can target all users, active subscribers, new subscribers, or specific user IDs.
- Excel/CSV class schedule import parses the file client-side and sends the parsed data to `gymClasses.importSchedule`.

**Files Involved:** `client/src/pages/AdminPanel.tsx`, `client/src/components/AdminCMSTab.tsx`, `server/routers/admin.ts`, `server/routers/cms.ts`, `server/routers/gymClasses.ts`, `server/routers/license.ts`

**Database Tables:** All tables (admin has read access to everything)

---

## 11. CMS (Content Management System)

**Purpose:** Allow the admin to customise workout session icons and exercise images without code changes.

**Flow:** In the Admin Panel's CMS tab, the admin can upload a custom image for each session type (Lower Body, Upper Body, etc.). The image is stored in S3 and the URL is saved in `sessionIconOverrides`. The home page's workout cards read from `cms.getPublicSessionIcons` and display the custom icon if one exists, falling back to the default CDN image.

**Business Logic:**
- After upload, both the admin CMS preview and the public home cards update instantly via React Query invalidation.
- Cache busting: uploaded image URLs in the CMS preview have `?v=${Date.now()}` appended to force browser refresh.
- Exercise overrides (images, YouTube links, name translations, sets/reps/rest) are stored in `exerciseOverrides` and merged into the exercise library at render time.

**Files Involved:** `client/src/components/AdminCMSTab.tsx`, `client/src/contexts/CMSContext.tsx`, `server/routers/cms.ts`

**Database Tables:** `sessionIconOverrides`, `exerciseOverrides`, `siteAppearance`

---

## 12. PWA (Progressive Web App)

**Purpose:** Allow users to install Prime Fit on their home screen for a native app-like experience.

**Flow:** On first visit, the app detects if the user is on Android (shows a native install prompt) or iOS (shows a manual guide: "Tap Share → Add to Home Screen"). The install state is persisted in localStorage to avoid showing the prompt repeatedly.

**Business Logic:**
- The `beforeinstallprompt` event is captured and stored for Android's native install prompt.
- iOS does not support `beforeinstallprompt` — a custom modal with step-by-step instructions is shown instead.
- The PWA manifest (`client/public/manifest.json`) defines the app name, icons, theme color, and display mode (`standalone`).
- Keyboard-aware layout: a CSS variable `--keyboard-height` is updated via a `visualViewport` resize listener to prevent the virtual keyboard from covering input fields.

**Files Involved:** `client/src/components/PWAInstallPrompt.tsx`, `client/public/manifest.json`, `client/index.html`

---

## 13. Exercise Library

**Purpose:** Browsable catalogue of all exercises in the user's program, with images, instructions, and YouTube links.

**Flow:** The Exercises tab shows exercises grouped by category (Chest, Back, Arms, Legs, Core, etc.). Each exercise card shows the exercise name (in the selected language), an image, and a YouTube link if available. Users can mark exercises as favourites.

**Business Logic:**
- Exercise data is defined in static TypeScript files (`client/src/data/exercises.ts`, `client/src/lib/exerciseData.ts`). These are large files — moving them to the database would allow admin editing without code changes.
- CMS overrides from `exerciseOverrides` are merged at render time via `useCMS()` in `ExerciseLibrary.tsx`.
- Exercise names are bilingual — Arabic names are shown when `lang === 'ar'`, English when `lang === 'en'`.
- Favourites are stored in the `exerciseFavorites` table and persist across devices.

**Files Involved:** `client/src/components/ExerciseLibrary.tsx`, `client/src/data/exercises.ts`, `client/src/lib/exerciseData.ts`, `server/routers/exerciseFavorites.ts`

**Database Tables:** `exerciseFavorites`, `exerciseOverrides`

---

## 14. Bilingual Support (Arabic/English)

**Purpose:** Full Arabic (Kuwaiti dialect) and English support throughout the app.

**Implementation:** The `LanguageContext` provides a `t()` translation function, `lang` ('ar'|'en'), and `isRTL` (true when Arabic). The context reads the user's preference from localStorage and defaults to Arabic. All UI strings have both Arabic and English versions defined in `client/src/contexts/LanguageContext.tsx`.

**Business Logic:**
- Arabic uses the Kuwaiti dialect (not Modern Standard Arabic).
- Dates are displayed in Gregorian format (DD/MM/YYYY) in both languages — not Hijri.
- RTL layout is applied via `dir="rtl"` on the root element when Arabic is active.
- Exercise titles on the home page translate when the language is switched.

**Files Involved:** `client/src/contexts/LanguageContext.tsx`
