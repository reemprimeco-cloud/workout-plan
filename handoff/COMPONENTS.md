# Prime Fit — Component Reference

## Overview

Components live in `client/src/components/`. Page-level components live in `client/src/pages/`. The `ui/` subdirectory contains shadcn/ui primitives — these should not be modified directly; instead, compose them in feature components.

---

## Feature Components

### `ActiveSession.tsx`
Renders the live workout session interface. Shows the exercise list for the current session type, with checkboxes for each set, a rest timer countdown, and a "Finish Session" button. Reads exercise data from `exerciseData.ts` and merges CMS overrides from `exerciseOverrides`. All exercise images pass through `resolveImageUrl()`.

**Props:** `{ session: ActiveSession, tracker: GymTracker, gender: 'male'|'female' }`

---

### `AdminCMSTab.tsx`
The CMS management tab inside the Admin Panel. Allows the admin to upload custom images for each session type and each exercise. After upload, invalidates both `cms.listSessionIcons` and `cms.getPublicSessionIcons` (and the exercise equivalents) so changes appear instantly everywhere. Uses base64 encoding for image uploads.

**Key behaviour:** Upload success triggers React Query cache invalidation for both the admin preview and the public-facing queries. Cache busting (`?v=${Date.now()}`) is appended to uploaded image URLs in the preview grid.

---

### `AdminNotificationPopup.tsx`
Displays unread broadcast notifications as a full-screen overlay popup. Fetches from `notifications.getUnreadBroadcasts` on mount. Marks notifications as read when the user dismisses them. Supports optional CTA button and banner image.

---

### `AIChatBox.tsx`
Reusable full-featured chat interface with message history, streaming support, and Markdown rendering via `<Streamdown>`. Used by the AI Coach tab. Supports loading states and empty state messaging.

---

### `AppIcons.tsx`
A collection of inline SVG icon components used throughout the app. All icons are vector outlines (no emoji). Includes: `HomeIcon`, `StatsIcon`, `NutritionIcon`, `ExercisesIcon`, `CoachIcon`, `CommunityIcon`, `ProfileIcon`, `CheckIcon`, `PlusIcon`, `TrashIcon`, and many more.

**Important:** Always use these SVG icons instead of emoji. The project owner has explicitly requested all emoji be replaced with vector outlines.

---

### `ColorIcons.tsx`
Coloured SVG icon variants used for exercise category headers and session type cards. Includes icons for each muscle group and workout type.

---

### `DashboardLayout.tsx`
Pre-built dashboard layout with sidebar navigation, auth handling, and user profile display. **Not currently used** in Prime Fit (the app uses a custom bottom-tab navigation instead). Available for future admin panel redesign.

---

### `DashboardLayoutSkeleton.tsx`
Loading skeleton for the dashboard layout during auth checks.

---

### `ErrorBoundary.tsx`
React error boundary that catches render errors and displays a fallback UI. Wraps the entire app in `main.tsx`. Also reports errors to `appErrorLogs` via the tRPC `admin.logError` procedure.

---

### `ExerciseLibrary.tsx`
Browsable exercise catalogue grouped by category. Reads from `exerciseData.ts` (static data) and merges CMS overrides from `useCMS().exerciseOverrides`. Shows exercise images (via `resolveImageUrl()`), YouTube links, and favourite toggle. Supports filtering by category and search.

---

### `GymClassesAdminTab.tsx`
Admin tab for managing gyms, branches, and class schedules. Includes an Excel/CSV import feature that parses the file client-side and sends the data to `gymClasses.importSchedule`.

---

### `InstallPromptBanner.tsx`
PWA install prompt. On Android, shows the native `beforeinstallprompt` dialog. On iOS, shows a modal with step-by-step instructions ("Tap Share → Add to Home Screen"). Install state is persisted in localStorage.

---

### `LicenseGate.tsx`
Subscription gate that wraps the entire app. Checks `subscription.getStatus` on mount. If the user has no valid subscription, shows the pricing page. If the subscription is expired, shows a renewal prompt. Passes through to the app if the subscription is active.

---

### `ManusDialog.tsx`
Branded dialog component used for the Manus OAuth login prompt. Shows the app logo and a "Sign in with Manus" button.

---

### `Map.tsx`
Google Maps integration component. **Not currently used** in Prime Fit. Available for future gym location features.

---

### `MentionInput.tsx`
Text input with @mention autocomplete. Used in the community post creation form. Parses `@username` patterns and shows a dropdown of matching users. Stores mentions in `postMentions` on submit.

---

### `NotificationBell.tsx`
Bell icon in the header that shows an unread count badge. Clicking it opens the notifications panel.

---

### `NotificationSettings.tsx`
User notification preferences form. Reads from `notifications.getSettings` and updates via `notifications.updateSettings`.

---

### `NutritionMealsTab.tsx`
The meals section of the Nutrition tab. Shows today's meal log grouped by meal type. Includes food search (USDA), AI photo analysis, and manual entry.

---

### `PremiumGate.tsx`
Inline gate component for features that require a paid plan (Prime Plus or Prime Pro). Shows an upgrade prompt if the user is on the free plan.

---

### `PrivacySettingsSection.tsx`
Privacy settings form in the Profile tab. Controls profile visibility, weight display, and message permissions.

---

### `ProfilePanel.tsx`
The Profile tab content. Shows the user's profile photo, stats (XP, level, streak), weight log chart, and settings. Includes the language toggle, data reset button, and logout button.

---

### `SafeImage.tsx`
A wrapper around `<img>` that automatically passes the `src` through `resolveImageUrl()` and adds an `onError` fallback to `/api/img/placeholder.png`. **All new image tags should use this component** to ensure Safari compatibility and graceful fallback.

**Props:** `{ src: string, alt: string, className?: string, style?: CSSProperties, ...imgProps }`

---

### `SessionHistory.tsx`
Displays the user's workout session history as a list of cards. Each card shows the session type icon, date, duration, and calories burned. Supports delete with confirmation.

---

### `SkeletonLoader.tsx`
Generic skeleton loading placeholder. Used while data is being fetched.

---

### `SpinWheel.tsx`
Animated spin wheel component with weighted random selection. Shows the wheel animation, reward reveal, and rarity badge. Reads reward catalog from `spinWheel.getRewards`.

---

### `StatsPanel.tsx`
The Stats tab content. Shows workout frequency charts, total sessions, total calories burned, streak history, and weight progress chart. Uses Recharts for data visualisation.

---

### `UserGuide.tsx`
In-app help guide explaining how to use Prime Fit. Bilingual (Arabic/English). Static content.

---

### `WorkoutCalendar.tsx`
Monthly calendar view showing which days had workout sessions. Days with sessions are highlighted.

---

### `WorkoutGuide.tsx`
Workout program guide showing the recommended weekly schedule, exercise descriptions, and tips. Includes aqua and sauna session guides with images.

---

### `WorkoutTimer.tsx`
Countdown timer component used in `ActiveSession` for rest periods between sets.

---

## Page Components

| File | Route | Purpose |
|------|-------|---------|
| `pages/Home.tsx` | `/` | Main app screen with 7-tab navigation |
| `pages/AdminPanel.tsx` | `/admin` | Full admin management interface |
| `pages/AuthPage.tsx` | (modal/redirect) | Login/register page |
| `pages/Community.tsx` | (tab in Home) | Social feed |
| `pages/LegalPage.tsx` | `/privacy`, `/terms` | Legal documents |
| `pages/NotFound.tsx` | `*` | 404 page |
| `pages/Nutrition.tsx` | (tab in Home) | Nutrition tracking |
| `pages/Pricing.tsx` | (shown by LicenseGate) | Subscription plans |
| `pages/ProfileSetupPage.tsx` | `/profile-setup` | First-time profile setup |
| `pages/ResetPasswordPage.tsx` | `/reset-password` | Password reset via OTP |
| `pages/SubscriptionResult.tsx` | `/subscription/success`, `/subscription/error` | Post-payment result |

---

## shadcn/ui Primitives (`components/ui/`)

These are standard shadcn/ui components. They should not be modified. Compose them in feature components instead.

| Component | Purpose |
|-----------|---------|
| `accordion` | Collapsible content sections |
| `alert-dialog` | Confirmation dialogs |
| `alert` | Inline alert messages |
| `avatar` | User profile pictures with fallback initials |
| `badge` | Status/label badges |
| `button` | Primary interactive element |
| `calendar` | Date picker calendar |
| `card` | Content container with header/body/footer |
| `checkbox` | Boolean toggle input |
| `dialog` | Modal overlay dialogs |
| `dropdown-menu` | Context menus and action menus |
| `form` | React Hook Form integration |
| `input` | Text input field |
| `input-otp` | OTP code entry (6 digits) |
| `label` | Form field labels |
| `popover` | Floating content panels |
| `progress` | Progress bar |
| `radio-group` | Single-choice radio inputs |
| `scroll-area` | Custom scrollable containers |
| `select` | Dropdown select input |
| `separator` | Horizontal/vertical dividers |
| `sheet` | Slide-in panel (mobile drawer) |
| `skeleton` | Loading placeholder |
| `slider` | Range input |
| `sonner` | Toast notifications |
| `switch` | Toggle switch |
| `table` | Data table |
| `tabs` | Tab navigation |
| `textarea` | Multi-line text input |
| `tooltip` | Hover tooltips |

---

## Design System

**Colors (CSS variables in `client/src/index.css`):**

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#1B2E5E` (Navy Blue) | Primary brand color, buttons, headers |
| `--accent` | `#7BB8D4` (Sky Blue) | Accent color, highlights, active states |
| `--background` | `#F0F4F8` | Page background |
| `--card` | `#FFFFFF` | Card backgrounds |
| `--foreground` | `#1B2E5E` | Primary text |

**Typography:**
- Arabic: Cairo, Tajawal (Google Fonts, loaded in `client/index.html`)
- English: Inter (Google Fonts)
- Font is switched based on `lang` in `LanguageContext`

**Spacing/Radius:** Standard Tailwind 4 spacing scale. Cards use `rounded-2xl` (16px). Buttons use `rounded-xl` (12px).
