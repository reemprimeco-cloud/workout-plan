# Prime Fit — API Reference

## Overview

All API communication uses **tRPC 11** over HTTP. The tRPC endpoint is `/api/trpc`. There are no REST endpoints except for OAuth callbacks, webhooks, and the image proxy.

The tRPC client is configured in `client/src/main.tsx` with `httpBatchLink` pointing to `/api/trpc`, using `superjson` as the transformer and `credentials: "include"` for session cookies.

### Non-tRPC Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/oauth/callback` | Manus OAuth callback |
| GET | `/api/auth/google` | Google OAuth redirect |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| POST | `/api/webhooks/myfatoorah` | MyFatoorah payment webhook |
| POST | `/api/webhooks/woocommerce` | WooCommerce order webhook |
| GET | `/api/img/:key(*)` | Image proxy (Safari-safe, no redirect) |
| GET | `/manus-storage/:key(*)` | Storage proxy (dev server only) |

---

## tRPC Procedures

All procedures are called via `trpc.<router>.<procedure>.useQuery()` or `.useMutation()` on the frontend, or directly via `appRouter.createCaller()` in tests.

### `auth`

#### `auth.me`
Returns the currently authenticated user from the session cookie.
- **Type:** `publicProcedure` query
- **Input:** none
- **Returns:** `User | null`

#### `auth.logout`
Clears the session cookie.
- **Type:** `publicProcedure` mutation
- **Input:** none
- **Returns:** `{ success: true }`

---

### `standaloneAuth`

#### `standaloneAuth.register`
Creates a new email/password account.
- **Type:** `publicProcedure` mutation
- **Rate limit:** 5 per hour per IP
- **Input:** `{ name, email, password }`
- **Returns:** `{ success: true, user }` + sets session cookie
- **Errors:** `BAD_REQUEST` if email already exists

#### `standaloneAuth.login`
Authenticates with email/password.
- **Type:** `publicProcedure` mutation
- **Rate limit:** 10 per 15 min per IP
- **Input:** `{ email, password }`
- **Returns:** `{ success: true, user }` + sets session cookie
- **Errors:** `UNAUTHORIZED` if credentials invalid

#### `standaloneAuth.forgotPassword`
Sends a 6-digit OTP to the user's email.
- **Type:** `publicProcedure` mutation
- **Rate limit:** 3 per hour per IP
- **Input:** `{ email }`
- **Returns:** `{ success: true }`

#### `standaloneAuth.resetPassword`
Resets password using OTP.
- **Type:** `publicProcedure` mutation
- **Input:** `{ email, otp, newPassword }`
- **Returns:** `{ success: true }`
- **Errors:** `BAD_REQUEST` if OTP invalid or expired

---

### `userProfile`

#### `userProfile.getProfile`
Returns the current user's full profile.
- **Type:** `protectedProcedure` query
- **Returns:** User row with all profile fields

#### `userProfile.updateProfile`
Updates profile fields.
- **Type:** `protectedProcedure` mutation
- **Input:** Partial user fields (name, gender, age, height, currentWeight, targetWeight, activityLevel, bio, avatarUrl)
- **Returns:** Updated user row

#### `userProfile.uploadAvatar`
Uploads a base64 avatar image to S3.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ base64: string, mimeType: string }`
- **Returns:** `{ url: string }`

#### `userProfile.getWeightLog`
Returns weight history for the current user.
- **Type:** `protectedProcedure` query
- **Returns:** Array of `{ weight, date, createdAt }`

#### `userProfile.logWeight`
Adds a weight measurement.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ weight: number, date?: string }`
- **Returns:** Inserted row

#### `userProfile.resetData`
Deletes all workout sessions, weight logs, and nutrition data for the current user.
- **Type:** `protectedProcedure` mutation
- **Returns:** `{ success: true }`

---

### `subscription`

#### `subscription.getPlans`
Returns available subscription plans with prices.
- **Type:** `publicProcedure` query
- **Returns:** Array of plan objects with `{ id, nameEn, nameAr, features, prices }`

#### `subscription.getStatus`
Returns the current user's subscription status.
- **Type:** `publicProcedure` query (returns `none` for unauthenticated)
- **Returns:** `{ plan, status, expiresAt, licenseKey }` or subscription row

#### `subscription.startFreeTrial`
Generates a 7-day PRIME-XXXX-XXXX key and emails it. One per email address.
- **Type:** `publicProcedure` mutation
- **Input:** `{ customerName, customerEmail, customerPhone? }`
- **Returns:** `{ success, licenseKey, expiresAt, message }`
- **Errors:** `BAD_REQUEST` if email already used a trial

#### `subscription.activateFreeTrial`
Activates a license key for the current user.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ licenseKey: string }`
- **Returns:** `{ success, expiresAt, message }`

#### `subscription.activateFreeSubscription`
Activates a 7-day free subscription without a license key. One per account.
- **Type:** `protectedProcedure` mutation
- **Returns:** `{ success, alreadyActive?, plan, status }`

#### `subscription.createCheckout`
Creates a MyFatoorah invoice and returns the payment URL.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ plan, period, origin, customerName?, customerEmail?, customerPhone? }`
- **Returns:** `{ invoiceId, invoiceUrl }`

#### `subscription.getKeyByInvoice`
Returns the license key associated with a paid invoice.
- **Type:** `publicProcedure` query
- **Input:** `{ invoiceId? } | { paymentId? }`
- **Returns:** `{ licenseKey: string | null }`

---

### `license`

#### `license.list`
Admin: lists all license keys.
- **Type:** `adminProcedure` query
- **Returns:** Array of access code rows

#### `license.create`
Admin: creates a new license key.
- **Type:** `adminProcedure` mutation
- **Input:** `{ customerName, customerEmail?, note?, expiresAt?, plan? }`
- **Returns:** Created access code row

#### `license.extend`
Admin: extends a license key's expiry.
- **Type:** `adminProcedure` mutation
- **Input:** `{ id, period: 'monthly'|'yearly' }`
- **Returns:** Updated row

#### `license.deactivate`
Admin: deactivates a license key.
- **Type:** `adminProcedure` mutation
- **Input:** `{ id }`
- **Returns:** `{ success: true }`

---

### `workout`

#### `workout.getSessions`
Returns the current user's workout session history.
- **Type:** `protectedProcedure` query
- **Returns:** Array of `gymSessions` rows, newest first

#### `workout.createSession`
Records a completed workout session.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ sessionType, durationMin, caloriesBurned, exercisesCompleted, notes? }`
- **Returns:** Created session row

#### `workout.deleteSession`
Deletes a workout session.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ id }`
- **Returns:** `{ success: true }`

---

### `gymClasses`

#### `gymClasses.getGyms`
Returns all active gyms with their branches.
- **Type:** `publicProcedure` query
- **Returns:** Array of gym rows with nested branches

#### `gymClasses.getTodayClasses`
Returns classes scheduled for today (current weekday).
- **Type:** `publicProcedure` query
- **Returns:** Array of class rows with gym and branch info

#### `gymClasses.joinClass`
Records a user joining a class. Awards XP and logs calories.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ classId }`
- **Returns:** `{ success, caloriesBurned, xpAwarded }`

#### `gymClasses.leaveClass`
Removes a join record and its linked session.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ classId }`
- **Returns:** `{ success: true }`

#### `gymClasses.getJoinedClasses`
Returns today's joined classes for the current user.
- **Type:** `protectedProcedure` query
- **Returns:** Array of `{ classId }` objects

#### `gymClasses.createGym` / `updateGym` / `deleteGym`
Admin CRUD for gyms.
- **Type:** `adminProcedure` mutation

#### `gymClasses.createBranch` / `updateBranch` / `deleteBranch`
Admin CRUD for branches.
- **Type:** `adminProcedure` mutation

#### `gymClasses.importSchedule`
Admin: bulk import class schedule from parsed Excel/CSV data.
- **Type:** `adminProcedure` mutation
- **Input:** `{ gymId, branchId, classes: Array<ClassRow> }`
- **Returns:** `{ inserted, replaced }`

#### `gymClasses.uploadGymLogo`
Admin: uploads a gym logo image.
- **Type:** `adminProcedure` mutation
- **Input:** `{ gymId, base64, mimeType }`
- **Returns:** `{ url: string }`

---

### `nutrition`

#### `nutrition.getGoals`
Returns the current user's daily nutrition goals.
- **Type:** `protectedProcedure` query
- **Returns:** `nutritionGoals` row

#### `nutrition.setGoals`
Sets daily nutrition goals.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ calories, protein, carbs, fat, water }`

#### `nutrition.getMealEntries`
Returns meal entries for a given date.
- **Type:** `protectedProcedure` query
- **Input:** `{ date: string }` (YYYY-MM-DD)
- **Returns:** Array of `mealEntries` rows

#### `nutrition.addMealEntry`
Logs a food item.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ date, mealType, foodName, calories, protein, carbs, fat, servingSize, servingUnit, usdaFdcId? }`

#### `nutrition.deleteMealEntry`
Removes a logged food item.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ id }`

#### `nutrition.getWaterLog`
Returns water intake for a date.
- **Type:** `protectedProcedure` query
- **Input:** `{ date: string }`

#### `nutrition.logWater`
Logs water intake.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ date, amount }` (ml)

#### `nutrition.analyzeFoodPhoto`
AI food photo analysis — returns estimated nutritional values.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ imageUrl: string }`
- **Returns:** `{ foodName, calories, protein, carbs, fat, servingSize, servingUnit }`

#### `nutrition.searchUSDA`
Searches USDA FoodData Central for food items.
- **Type:** `protectedProcedure` query
- **Input:** `{ query: string }`
- **Returns:** Array of USDA food items

---

### `coach`

#### `coach.getHistory`
Returns the AI coach chat history for the current user.
- **Type:** `protectedProcedure` query
- **Returns:** Array of `coachChatHistory` rows

#### `coach.sendMessage`
Sends a message to the AI coach and returns the AI response.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ message: string }`
- **Returns:** `{ response: string }`

#### `coach.clearHistory`
Clears the AI coach chat history.
- **Type:** `protectedProcedure` mutation

#### `coach.getCheckin`
Returns today's wellness check-in.
- **Type:** `protectedProcedure` query

#### `coach.submitCheckin`
Submits a daily wellness check-in.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ feeling, energy, sleep }` (1–5 each)
- **Returns:** `{ aiResponse: string }`

---

### `community`

#### `community.getPosts`
Returns the community feed.
- **Type:** `protectedProcedure` query
- **Input:** `{ cursor?: number, limit?: number }`
- **Returns:** Paginated array of posts with author info

#### `community.createPost`
Creates a new community post.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ content, contentEn?, imageUrl?, imageKey?, type? }`

#### `community.reactToPost`
Adds or removes a reaction.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ postId, type: 'like'|'cheer'|'fire' }`

#### `community.addComment`
Adds a comment to a post.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ postId, content }`

#### `community.getLeaderboard`
Returns the XP leaderboard.
- **Type:** `protectedProcedure` query
- **Returns:** Array of `{ userId, name, xp, level, avatarUrl }`

---

### `notifications`

#### `notifications.getAll`
Returns all notifications for the current user.
- **Type:** `protectedProcedure` query

#### `notifications.markRead`
Marks a notification as read.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ id }`

#### `notifications.getUnreadBroadcasts`
Returns unread admin broadcast notifications for the current user.
- **Type:** `protectedProcedure` query
- **Returns:** Array of `broadcastNotifications` rows not yet read by this user

#### `notifications.markBroadcastRead`
Marks a broadcast notification as read.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ notificationId }`

#### `notifications.subscribePush`
Saves a Web Push subscription endpoint.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ endpoint, p256dh, auth }`

---

### `admin`

#### `admin.getUsers`
Returns all users.
- **Type:** `adminProcedure` query

#### `admin.updateUserRole`
Promotes or demotes a user.
- **Type:** `adminProcedure` mutation
- **Input:** `{ userId, role: 'admin'|'user' }`

#### `admin.getBillingHistory`
Returns all billing transactions.
- **Type:** `adminProcedure` query

#### `admin.sendNotification`
Sends a broadcast notification (in-app, email, or both).
- **Type:** `adminProcedure` mutation
- **Input:** `{ title, message, imageUrl?, ctaText?, ctaUrl?, targetType, targetUserIds?, sendInApp, sendEmail }`

#### `admin.getErrorLogs`
Returns app error logs.
- **Type:** `adminProcedure` query

#### `admin.resolveError`
Marks an error log as resolved.
- **Type:** `adminProcedure` mutation
- **Input:** `{ id }`

---

### `cms`

#### `cms.getAppearance`
Returns site appearance settings.
- **Type:** `publicProcedure` query

#### `cms.updateAppearance`
Updates site appearance.
- **Type:** `adminProcedure` mutation

#### `cms.listSessionIcons`
Admin: lists all session icon overrides.
- **Type:** `adminProcedure` query

#### `cms.getPublicSessionIcons`
Public: returns session icon overrides for the home page.
- **Type:** `publicProcedure` query
- **Returns:** Array of `{ sessionType, iconUrl }` (filtered to non-empty URLs)

#### `cms.uploadSessionIcon`
Admin: uploads a session icon image.
- **Type:** `adminProcedure` mutation
- **Input:** `{ sessionType, base64, mimeType }`
- **Returns:** `{ url: string }`

#### `cms.deleteSessionIcon`
Admin: removes a session icon override.
- **Type:** `adminProcedure` mutation
- **Input:** `{ sessionType }`

#### `cms.listExerciseOverrides`
Admin: lists all exercise overrides.
- **Type:** `adminProcedure` query

#### `cms.getPublicExerciseOverrides`
Public: returns all exercise overrides for the exercise library.
- **Type:** `publicProcedure` query

#### `cms.uploadExerciseImage`
Admin: uploads an exercise image.
- **Type:** `adminProcedure` mutation
- **Input:** `{ exerciseId, base64, mimeType }`

#### `cms.updateExerciseOverride`
Admin: updates exercise metadata override.
- **Type:** `adminProcedure` mutation
- **Input:** `{ exerciseId, youtubeUrl?, nameEn?, nameAr?, sets?, reps?, restSec?, notes? }`

---

### `spinWheel`

#### `spinWheel.getRewards`
Returns the reward catalog.
- **Type:** `publicProcedure` query

#### `spinWheel.spin`
Performs a weighted random spin.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ challengeId }`
- **Returns:** `{ reward, rarity, value, type }`

#### `spinWheel.getHistory`
Returns the current user's spin history.
- **Type:** `protectedProcedure` query

#### `spinWheel.adminUpdateReward`
Admin: updates a reward's weight, name, or value.
- **Type:** `adminProcedure` mutation

---

### `exerciseFavorites`

#### `exerciseFavorites.list`
Returns the current user's favourite exercises.
- **Type:** `protectedProcedure` query

#### `exerciseFavorites.toggle`
Adds or removes an exercise from favourites.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ exerciseId: string }`

---

### `health`

#### `health.ping`
Health check endpoint.
- **Type:** `publicProcedure` query
- **Returns:** `{ ok: true, timestamp }`

---

### `system`

#### `system.notifyOwner`
Sends an operational alert to the app owner.
- **Type:** `protectedProcedure` mutation
- **Input:** `{ title, content }`
- **Returns:** `{ success: boolean }`
