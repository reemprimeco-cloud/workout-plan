# Prime Fit — Project TODO

## Core App Features
- [x] Workout session tracking (localStorage-based)
- [x] Session history and stats
- [x] Exercise library with 60+ exercises
- [x] Cardio section with 4 machines: Treadmill, Rower, Precor Bike, Climbmill
- [x] All cardio machines have identical fillable fields (Speed/Rate, Incline/Resistance, Time, Distance, Calories)
- [x] Rowing Machine added to Active Session drag list
- [x] Gender-specific workout programs (men/women)
- [x] Arabic/English bilingual UI (RTL support)
- [x] User profile setup (name, weight, height, gender, target weight)
- [x] Weight progress tracker
- [x] EXERCISES_GUIDE.md developer documentation

## Full-Stack Upgrade
- [x] Upgraded to full-stack (tRPC + Express + MySQL/TiDB)
- [x] Database schema: users table
- [x] Database schema: access_codes table (id, code, customerName, customerEmail, note, isActive, usedAt, createdAt)
- [x] pnpm db:push migrations applied successfully

## License / Paywall System
- [x] LicenseGate component wrapping entire app
- [x] License key stored in localStorage after first verification
- [x] Auto-verify from URL ?key= param
- [x] Purchase button links to WooCommerce product page
- [x] "Change License Key" button in ProfilePanel
- [x] server/db.ts access code query helpers (verifyAccessCode, listAccessCodes, createAccessCode, toggleAccessCode, deleteAccessCode)
- [x] server/routers/license.ts updated to verify against DB access_codes table (replaced WooCommerce API)
- [x] LicenseGate placeholder updated to PRIME-XXXX-XXXX format
- [x] Admin panel (/admin) for managing access codes
- [x] Admin panel: create new codes (manual or auto-generated)
- [x] Admin panel: list all codes with status, customer info, used date
- [x] Admin panel: toggle active/inactive per code
- [x] Admin panel: delete codes with confirmation
- [x] Admin panel bypasses LicenseGate (has its own auth check)
- [x] 11 vitest tests passing (license system + auth logout)

## Future / Pending (not blocking current release)
- [x] WooCommerce webhook integration — auto-generates license key on order.processing/completed and emails customer
- [x] Push notifications for workout reminders
- [x] Add WhatsApp order note on LicenseGate screen (contact 65068000 after purchase to get access code)
- [x] Fix home page exercise sections: each section must show its own specific exercises (not all showing Elliptical)
- [x] Translate Guide tab (WorkoutGuide component) to English — currently all hardcoded Arabic
- [x] Rename 'Guide' tab to 'Schedule' in bottom navigation
- [x] Translate Arabic day badge labels in weekly plan to English (الجزء السفلي → Lower Body, etc.)

## Push Notifications
- [x] Install web-push npm package on server
- [x] Generate VAPID keys and store as env secrets
- [x] DB schema: push_subscriptions table (userId, endpoint, p256dh, auth, createdAt)
- [x] DB schema: notification_settings table (userId, enabled, reminderTime HH:MM, days JSON, taskUid)
- [x] pnpm db:push migrations applied
- [x] server/db.ts: push subscription helpers (upsertSubscription, deleteSubscription, getSubscriptionsByUser)
- [x] server/db.ts: notification settings helpers (getNotificationSettings, upsertNotificationSettings)
- [x] server/routers/notifications.ts: tRPC router (subscribe, unsubscribe, getSettings, updateSettings)
- [x] server/routers/notifications.ts: sendWorkoutReminder procedure (admin/cron only)
- [x] /api/scheduled/workoutReminder Express handler
- [x] Mount scheduled handler in server/_core/index.ts
- [x] client/public/sw.js: Service Worker for push event handling
- [x] NotificationSettings component: toggle enable, pick reminder time, pick days of week
- [x] Integrate NotificationSettings into ProfilePanel
- [x] Heartbeat cron: per-user cron created/updated when settings saved
- [x] Bilingual notification content (Arabic + English based on user's language pref)
- [x] Save checkpoint and deploy before activating crons

## Exercise Title Translation
- [x] Translate exercise titles in ActiveSession (exercise list during workout) to English when lang=en
- [x] Translate exercise titles in CheckInPanel (session preview expanded list) to English when lang=en
- [x] Translate exercise titles in ExerciseLibrary component to English when lang=en

## My Coach (AI Personal Trainer)
- [x] DB schema: coach_chat_history table (id, userId, role, content, createdAt)
- [x] DB schema: coach_checkins table (id, userId, feeling, energy, sleep, date, aiResponse, createdAt)
- [x] DB schema: coach_insights table (id, userId, type, content, createdAt)
- [x] DB schema: coach_memory table (id, userId, goalWeight, currentWeight, preferredLanguage, notes, updatedAt)
- [x] pnpm db:push migrations applied
- [x] server/db.ts: coach helpers (getChatHistory, saveChatMessage, saveCheckin, getCheckins, saveInsight, getInsights, getCoachMemory, upsertCoachMemory)
- [x] server/routers/coach.ts: tRPC router (chat, getHistory, checkin, getCheckins, getInsights, getMemory, generateInsights)
- [x] Register coach router in server/routers.ts
- [x] client/src/pages/MyCoach.tsx: full page with dashboard, check-in card, chat interface, insights
- [x] Dashboard stats: streak, weekly completion %, weight change, total sessions
- [x] Daily check-in card: feel/energy/sleep questions with AI response
- [x] Chat interface: message list, input, quick-action buttons, typing animation
- [x] AI insights section: auto-generated coaching feedback cards
- [x] Bilingual UI: Arabic RTL + English support
- [x] Add "My Coach" tab to bottom navigation in Home.tsx
- [x] Register /coach route rendered inline in Home.tsx tab system
- [x] Write vitest tests for coach router procedures (21 tests)

## Community Tab
- [x] DB: community_posts table (id, userId, type, content, imageUrl, visibility, xpAwarded, createdAt)
- [x] DB: community_post_reactions table (id, postId, userId, type: like/cheer/fire, createdAt)
- [x] DB: community_comments table (id, postId, userId, content, createdAt)
- [x] DB: community_stories table (id, userId, type, content, imageUrl, expiresAt, createdAt)
- [x] DB: community_challenges table (id, title, titleAr, description, descriptionAr, type, targetValue, startDate, endDate, xpReward, createdAt)
- [x] DB: community_challenge_participants table (id, challengeId, userId, progress, completedAt, joinedAt)
- [x] DB: community_xp_log table (id, userId, event, points, refId, createdAt)
- [x] pnpm db:push migrations applied
- [x] server/db.ts: community DB helpers
- [x] server/routers/community.ts: tRPC router (getFeed, createPost, reactToPost, getComments, addComment, getStories, getLeaderboard, getChallenges, joinChallenge, getMyXP, getAIInsights, autoGeneratePost)
- [x] Register community router in server/routers.ts
- [x] client/src/pages/Community.tsx: full page with stories bar, AI insight card, post feed, leaderboard, challenges, XP panel
- [x] Stories bar: circular avatars with active streak indicators
- [x] AI Insight card: personalized motivational card pinned at top of feed
- [x] Post feed: Instagram-style cards with reactions (like/cheer/fire), comments, trending badge
- [x] Post creation: text + image upload with visibility selector
- [x] Weekly leaderboard: top 10 with XP, level badge, rank movement arrows
- [x] Challenges section: active challenges with join button and progress bar
- [x] XP & Level panel: user level, total XP, badges earned
- [x] Auto-generated achievement posts (streak milestones, level-ups)
- [x] Dark neon UI: navy + cyan/orange, smooth CSS animations, mobile-first
- [x] Bilingual: Arabic RTL + English support throughout
- [x] Add Community tab to bottom navigation in Home.tsx
- [x] Write vitest tests for community router (27 tests)

## UI Restructuring
- [x] Move Help tab content into Profile page as a collapsible section
- [x] Remove Help tab from bottom navigation bar

## Community FAB
- [x] Add floating action button (FAB) for new post in Community feed tab

## New Workout Category Cards
- [x] Add 6 new session types to exercises.ts (warm_up, stretching, home_workouts, pilates, mobility, quick_workouts)
- [x] Add exercise data for each new category (Arabic + English names)
- [x] Add new cards to CheckInPanel grid using exact same card style
- [x] Wire new session types into ActiveSession for exercise list, timer, progress tracking
- [x] Bilingual support: Arabic + English for all new content

## Icon & Layout Update
- [x] Generate navy blue outline SVG icons for all 14 workout category cards
- [x] Generate navy blue outline SVG icons for all 8 bottom nav tabs
- [x] Upload all icons to manus-storage
- [x] Replace emoji icons in workout cards (exercises.ts sessionTypes) with SVG images
- [x] Replace bottom nav tab emoji icons in Home.tsx with SVG images
- [x] Fix app layout to perfectly fit mobile screen (no horizontal overflow, proper viewport)
- [x] Ensure sticky header + scrollable content + fixed bottom nav with no overlap

## English Translation Fixes
- [x] Fix sessionTypes: add nameEn to all session types in exercises.ts
- [x] Fix workout card descriptions: show English descriptionEn when in English mode
- [x] Fix ActiveSession.tsx: translate all Arabic UI labels to English when lang=en
- [x] Fix SessionHistory.tsx: show English session names when in English mode
- [x] Fix StatsPanel.tsx: show English session names in Sessions by Type chart
- [x] Fix NaN duration bug in session history and active session

## Admin Panel Enhancements
- [x] Add language switcher (Arabic/English) to admin panel header
- [x] Add admin profile page: name, phone, email, profile image upload
- [x] Add DB tables: admin_profile, broadcast_notifications
- [x] Add server procedures: admin.getProfile, admin.updateProfile, admin.uploadPhoto
- [x] Add broadcast notification system: compose subject/body, send to all licensed customers via email
- [x] Add broadcast history: list of past broadcasts with date, subject, recipient count
- [x] Add admin stats: total licenses, active licenses, total broadcasts sent

## Broadcast & License Enhancements
- [x] Broadcast: add "Send to specific customer" option (target one email address)
- [x] License keys: add expiresAt column to access_codes table
- [x] License keys: show expiry date in admin license table
- [x] License keys: add expiry date picker in create code form
- [x] License keys: auto-deactivate expired keys on verification attempt
- [x] License keys: WooPoller marks expired keys as inactive automatically

## MyFatoorah Subscription Integration
- [x] DB schema: subscriptions table (user_id, plan, status, period, starts_at, expires_at, invoice_id)
- [x] DB schema: billing_history table (user_id, plan, period, amount, currency, status, invoice_id, payment_ref)
- [x] Run db:push migration
- [x] Set MYFATOORAH_API_KEY, MYFATOORAH_WEBHOOK_SECRET, MYFATOORAH_API_URL secrets
- [x] server/_core/myfatoorah.ts: createInvoice, getPaymentStatus helpers
- [x] server/handlers/myfatoorahWebhook.ts: verify secret, activate subscription on Paid
- [x] server/routers/subscription.ts: getPlans, getStatus, createCheckout, getBillingHistory
- [x] Register MyFatoorah webhook route in server/_core/index.ts
- [x] client/src/contexts/SubscriptionContext.tsx: plan/feature access provider
- [x] client/src/components/PremiumGate.tsx: block premium features for free users
- [x] client/src/pages/Pricing.tsx: bilingual plan cards with MyFatoorah checkout
- [x] Register /pricing route in App.tsx
- [x] Add Pricing link to main nav/login screen

## Feature Batch 7
- [x] Admin panel: add Subscriptions tab showing all subscriptions (customer, plan, status, expiry, invoice ID)
- [x] Profile tab: add "My Subscription" section showing current plan, expiry, and Renew button
- [x] Free trial: user can subscribe using their existing license key (key acts as free trial identity)
- [x] Free trial: license key auto-expires when free plan period ends (link key expiresAt to subscription expiresAt)
- [x] Key reuse: after purchasing a paid plan, the same key becomes active again (re-activate on subscription payment)
- [x] WhatsApp card: make it compact/small in the footer of the main page (LicenseGate)
- [x] Profile page: add "Contact Us" WhatsApp button
- [x] Language auto-detect: set app language based on user's device/browser language on first load (Arabic if ar-*, English otherwise)

## Feature Batch 8 — User Profile Image & Editable Name
- [x] DB schema: add avatarUrl column to users table
- [x] Run db:push migration
- [x] server/routers/userProfile.ts: uploadAvatar procedure (base64 → S3), updateDisplayName procedure
- [x] Register userProfile router in server/routers.ts
- [x] ProfilePanel: avatar circle with tap-to-upload (file input, base64 encode, call mutation)
- [x] ProfilePanel: show avatar in profile card header; fallback to initials
- [x] ProfilePanel: inline name editing directly on the profile card (not just in the modal)
- [x] Home.tsx header: show user avatar circle next to name
- [x] Write vitest tests for userProfile router

## Feature Batch 9 — Community & Profile Improvements
- [x] ProfilePanel: profile completion progress bar (name, weight, height, age, gender, avatar)
- [x] ProfilePanel: small avatar icon next to name in profile card (already done via circle, refine size)
- [x] ProfilePanel: in-browser image crop/resize before upload (canvas-based square crop)
- [x] Community: show poster avatar in post cards (small icon, not clickable/openable)
- [x] Community: delete own post (owner only)
- [x] Community: edit own post text (owner only, fix typos)
- [x] Community: delete own comment
- [x] Community: edit own comment text
- [x] Community: @mention feature in comment input (autocomplete from community members)
- [x] Home.tsx: remove WhatsApp button from footer/nav area
- [x] Server: add deletePost, editPost, deleteComment, editComment procedures to community router
- [x] Server: add getMentionSuggestions procedure (search users by name prefix)
- [x] Write vitest tests for new community procedures

## Feature Batch 10 — License Key in My Subscription Card

- [x] ProfilePanel: show license key row under Status in My Subscription card (always visible, masked with copy button)

## Feature Batch 11 — Uploaded ZIP Patches

- [x] Apply primefit-trial-popup: LicenseGate with trial awareness popup + expiry check
- [x] Apply primefit-notif-fix: notifications router fix (VAPID check, preferences toggles), server index webhook fix, NotificationSettings UI improvements

## Feature Batch 12 — Instagram-style @Mention System

- [x] Server: searchUsers procedure for mention autocomplete (by first letters, Arabic + English)
- [x] Server: store mentions in a new post_mentions / comment_mentions table
- [x] Server: send push notification to mentioned user when post/comment is created
- [x] Client: MentionInput component — real-time @ dropdown, suggested users, smart autocomplete
- [x] Client: render clickable @mention chips in post content and comment content
- [x] Client: mobile-optimized UX (touch-friendly dropdown, keyboard avoidance)

## Feature Batch 13 — Challenge Reward Spin Wheel

- [x] Fix Community.tsx stray `};` syntax error (line 299)
- [x] Fix @mention system: remove remaining old mention state/functions
- [x] Schema: reward_spins, reward_history, reward_probabilities, challenge_rewards, jackpot_winners tables
- [x] Server: spin wheel router with probability engine (server-side), anti-abuse (one spin per challenge), reward dispatch
- [x] Server: admin CRUD for reward probabilities, enable/disable rewards, jackpot monitoring
- [x] SpinWheel component: canvas-based animated wheel, realistic spin physics, suspense effect, glowing winner
- [x] Confetti celebration overlay on win
- [x] Haptic vibration support (navigator.vibrate)
- [x] Sound effects support (Web Audio API)
- [x] Celebration popup showing reward won
- [x] Wire SpinWheel into Community challenges completion flow
- [x] Admin Rewards tab in AdminPanel: edit probabilities, add/remove rewards, track history, monitor jackpots

## Feature Batch 13 — Challenge Reward Spin Wheel

- [x] Schema: reward_spins, reward_history, reward_probabilities, challenge_rewards, jackpot_winners tables
- [x] Server: spinWheel router with probability engine, anti-abuse (one spin per challenge), admin CRUD
- [x] Server: seed default rewards (common/uncommon/rare/jackpot) on first query
- [x] SpinWheel component: canvas-based animated wheel, confetti, haptic, sound effects, celebration popup
- [x] Community: ChallengesPanel wired with completeChallenge + SpinWheel overlay
- [x] AdminPanel: Rewards tab with reward list editor, jackpot winners, spin history, stats
- [x] @mention system: MentionInput component, getMentionSuggestions, processMentions, mention notifications
- [x] Tests: 7 new spin wheel probability engine tests (111 total passing)

## Feature Batch 14 — Mention UX & Post Form Mobile Fix

- [x] MentionInput: dropdown always renders above the cursor/input, never below
- [x] MentionInput: large touch targets (min 56px row height) for easy mobile tapping
- [x] MentionInput: smooth scroll inside dropdown, max 4 items visible at once
- [x] MentionInput: dropdown positioned with fixed/portal rendering to avoid clipping
- [x] NewPostForm: full-screen bottom sheet on mobile (100vh, slides up from bottom)
- [x] NewPostForm: proper keyboard-aware layout (content scrolls, action bar stays pinned)
- [x] NewPostForm: close button at top, post button clearly visible

## Feature Batch 15 — Renewal ZIP + Swipe + Challenge Create + 7-day expiry

- [x] Apply primefit-renewal.zip: db.ts (getAccessCodeByEmail, extendSubscription), email.ts, myfatoorahWebhook.ts, AdminPanel.tsx
- [x] NewPostForm: swipe-down gesture on drag handle to dismiss
- [x] Admin panel: Create Challenge form (title, description, duration, XP reward)
- [x] License key: set expiresAt = usedAt + 7 days when key is first verified (first use triggers 7-day countdown)

- [x] Move History tab inside Stats tab as a sub-tab; remove History from bottom nav bar to free up a slot

## AI Nutrition System
- [x] DB schema: nutrition_goals, nutrition_logs, meal_entries, water_logs, nutrition_insights tables
- [x] Backend: nutrition tRPC router (getTodayLog, logMeal, deleteMeal, logWater, getWeeklyTrends, getInsights, scanFood, setGoals)
- [x] Frontend: Nutrition page with Dashboard tab (calories ring, macro cards, water tracker, weekly chart)
- [x] Frontend: Meal Tracking tab (breakfast/lunch/dinner/snacks with add/delete entries)
- [x] Frontend: AI Food Scanner (image upload → LLM analysis → confirm/edit → add to diary)
- [x] Frontend: AI Nutrition Insights tab (AI-generated insights based on workout + nutrition data)
- [x] Wire Nutrition tab into bottom nav (replace freed History slot)
- [x] Bilingual support (Arabic/English) throughout nutrition system
- [x] Integration with AI Coach context (pass nutrition data to coach system prompt)
- [x] Apply primefit-nutrition.zip: foodAnalysis.ts, usda.ts, nutritionDb.ts, new Nutrition.tsx with USDA integration
- [x] Apply primefit-svg-icons.zip: SVG icons for Nutrition and Pricing tabs in bottom nav
- [x] Add meal_logs and meal_log_items tables to DB schema (nutrition v2)
- [x] Add analyzeFood, saveMeal, getToday, getMealHistory, deleteMeal, searchFood procedures to nutrition router

## Nutrition UX Fix
- [x] Merge Nutrition pages: unified page with Dashboard/Meals/Scanner/Insights tabs; Scanner "Add to Diary" saves meal to correct meal type in Meals tab using v2 backend (saveMeal + getMealHistory)
- [x] Fix all Arabic dates to display Gregorian calendar (DD/MM/YYYY) instead of Hijri — LicenseGate, ProfilePanel, SessionHistory, AdminPanel, Nutrition, Home

## Feature Batch 16 — Nutrition Fixes & Profile Patches
- [x] Goals modal: fix typing issue (string-based inputs instead of type=number)
- [x] Goals modal: fix saving issue (try/catch + proper error handling)
- [x] Dashboard: fix macro sync — getTodayLog refetches with staleTime=0 + refetchOnWindowFocus
- [x] Dashboard: add ExceedWarning banner — shows when any macro/calorie exceeds daily goal, with AI advice and Adjust Goals button
- [x] Apply primefit-fixes.zip: env.ts, myfatoorah.ts, myfatoorahWebhook.ts, wooCommerceWebhook.ts, wooPoller.ts, community.ts, NotificationSettings.tsx
- [x] Apply primefit-profile-fix.zip + primefit-profile-fixrec.zip: new ProfilePanel.tsx
- [x] Community router: add missing procedures (deletePost, editPost, deleteComment, editComment, completeChallenge, getMentionSuggestions, createChallenge)
- [x] Fix createChallenge procedure to match schema (description/descriptionAr required, correct type enum)
- [x] Remove orange expiry banner and plan label badge from LicenseGate

## Feature Batch 17 — 3 Nutrition Improvements
- [x] TDEE auto-calculator button in Goals modal
- [x] Fix getWeeklyTrends to read from mealLogs (v2)
- [x] Link daily nutrition context to Coach AI

## Auth System Migration (Phase 4)
- [x] ProfileSetupPage component for new user onboarding (age, height, weight, gender)
- [x] updateProfile procedure in standaloneAuth router
- [x] logout procedure in standaloneAuth router
- [x] App.tsx routing to /profile-setup for incomplete profiles
- [x] Logout button in ProfilePanel with confirmation
- [x] All 111 tests passing, 0 TypeScript errors

## Feature Batch 19 — Avatar S3 Upload
- [ ] Add uploadAvatar procedure to userProfile router (base64 → S3 → return URL)
- [ ] Update ProfilePanel.tsx to call uploadAvatar and store S3 URL instead of base64

## Feature Batch 20 — Arabic Gender-Aware Text (Male vs Female)
- [ ] Fix all Arabic feminine text to show masculine form when profile.gender === 'male' — across all pages and components
- [ ] Home.tsx / CheckInPanel: session start buttons, motivational text
- [ ] ProfilePanel.tsx: plan description, BMI labels, goal text
- [ ] ActiveSession.tsx: exercise instructions, motivational text
- [ ] SessionHistory.tsx: session labels
- [ ] StatsPanel.tsx: stats descriptions
- [ ] WorkoutGuide.tsx: guide text
- [ ] Nutrition.tsx: nutrition advice text
- [ ] MyCoach.tsx: coach system prompt
- [ ] exercises.ts / exerciseData.ts: any hardcoded Arabic feminine text


## Feature Batch 20 — Arabic Gender-Aware Text (Male vs Female)
- [ ] Fix all Arabic feminine text to show masculine form when profile.gender === male
- [ ] Home.tsx / CheckInPanel: session start buttons, motivational text
- [ ] ProfilePanel.tsx: plan description, goal text
- [ ] ActiveSession.tsx: exercise instructions, motivational text
- [ ] WorkoutGuide.tsx: guide text
- [ ] Nutrition.tsx: nutrition advice text
- [ ] MyCoach.tsx: coach system prompt

## Feature Restore — Unified Subscription Flow & Admin Copy Buttons
- [x] Pricing.tsx: unified modal for all 3 plans (name + email + phone input)
- [x] Pricing.tsx: Free Trial → show key popup with copy button + expiry date after generation
- [x] Pricing.tsx: Free Trial form labels: "ابدأ تجربتك المجانية", "مجاناً — ٧ أيام", button "🎁 احصل على مفتاحي المجاني"
- [x] Pricing.tsx: Paid plans → redirect to MyFatoorah checkout after form submission
- [x] Pricing.tsx: Free plan button shows "ابدأ التجربة المجانية" if no key yet, "✓ خطتك الحالية" after key generated
- [x] AdminPanel: copy button next to each license key in Licenses tab (turns ✓ for 1.8s)
- [x] AdminPanel: copy button next to each license key in Subscriptions tab
- [x] Remove all WooCommerce/primeprint.com.kw links from LicenseGate and Pricing pages
- [x] Keep only MyFatoorah as payment gateway (removed WooCommerce webhook, ping route, and poller from server)

## Feature Restore — Unified Subscription Flow (Pricing.tsx)
- [x] Pricing.tsx: all 3 plan buttons open same modal (name + email + phone)
- [x] Pricing.tsx: Free Trial modal title "ابدأ تجربتك المجانية", summary "مجاناً — ٧ أيام", button "🎁 احصل على مفتاحي المجاني"
- [x] Pricing.tsx: after free trial generation → popup overlay with PRIME-XXXX-XXXX in large font + copy button (✓ for 2s) + expiry date + "حسناً، شكراً!" close button
- [x] Pricing.tsx: auto-email sent to customer with key after free trial generation (resendKeyEmail called in startFreeTrial)
- [x] Pricing.tsx: Plus/Pro → redirect to MyFatoorah checkout after form submission
- [x] Pricing.tsx: Free plan button shows "ابدأ التجربة المجانية" if no key yet, "✓ خطتك الحالية" after key generated

## Bug Fix — Free Plan Button & Admin Copy Buttons
- [x] Pricing.tsx: free plan "✓ خطتك الحالية" button now opens the info modal when no key generated yet, shows static badge after key generated
- [x] AdminPanel: copy button already exists next to each license key in Licenses tab (📋 → ✓ for 1.8s)
- [x] AdminPanel: copy button already exists next to each license key in Subscriptions tab

## UI Restore — Lost After Rollback
- [x] Home.tsx: 7 tabs only — removed "nutrition" tab from nav bar (home, stats, guide, exercises, coach, community, profile)
- [x] Home.tsx: streak badge moved from header to inside welcome card (top-right corner as 🔥 badge with day count)
- [x] Home.tsx: NutritionSummaryCard added above "Choose Today's Workout" section (calories + macros + water)

## Bug Fix — 3 UI Issues (May 16)
- [x] Home.tsx: replace /favicon.ico <img> with inline SVG PrimeFitLogo component in header
- [x] Home.tsx: fix streak badge overlap in RTL — move streak badge properly inside welcome card (not overlapping name)
- [x] ProfilePanel.tsx: add subscription status card at bottom reading from localStorage (key, plan, expiry, days left)

## Bug Fix — Streak Badge & Nutrition Tab (May 16 v2)
- [x] Home.tsx: fix streak badge overlap in LTR (English) — added paddingRight:72 wrapper so name text never goes under badge
- [x] Home.tsx: restore Nutrition tab in bottom nav — added back between Stats and Exercises using inline SVG nutrition icon

## UI Cleanup — May 16 v3
- [x] Home.tsx: remove streak badge from welcome card entirely
- [x] Home.tsx: remove profile image/avatar circle from header
- [x] ProfilePanel.tsx: remove profile image/avatar upload section (replaced with initials-only circle)
- [x] Home.tsx: remove NutritionSummaryCard from home page (Nutrition tab stays active)

## Bug Fix — 4 Issues (May 16 v4)
- [x] ExerciseLibrary: exercise images confirmed working — images show when row is expanded (? is the expand button, not a broken image)
- [x] Nutrition Goals modal: fixed input losing focus — moved GoalField component outside GoalsModal to prevent remount on each render
- [x] Nutrition Goals modal: fixed TDEE auto-calculator — was reading wrong localStorage key (primefit_data), fixed to gym_tracker_v3
- [x] Nutrition Insights tab: fixed AI generation — added onError handler + error message display so button no longer stays stuck in pending state

## Calories Burned & Nutrition Balance System
- [x] exercises.ts: met values added to all sessionTypes
- [x] exerciseData.ts: met values added to all individual exercises
- [x] client/src/lib/calorieCalc.ts: utility created (calcExerciseCalories, calcSessionCalories, estimateDuration, getDailyCaloriesBurned, getWeeklyCaloriesBurned, getMonthlyCaloriesBurned)
- [x] ActiveSession.tsx: live calorie counter + per-exercise "السعرات المحروقة التقديرية" display added
- [x] ActiveSession.tsx: total calories burned saved to session data on finish
- [x] StatsPanel.tsx: daily calories burned card (today) added
- [x] StatsPanel.tsx: weekly calories burned bar chart added
- [x] StatsPanel.tsx: monthly calories summary (4 weeks) added
- [x] Nutrition.tsx: workout calories row added to dashboard (goal / food / burned / remaining)
- [x] Nutrition.tsx: progress circle color reflects remaining calories (green/orange/red)
- [x] Nutrition.tsx: remaining = goal - food + estimated exercise calories
- [x] Nutrition.tsx Goals modal: goal mode selector (fat loss / maintain / muscle gain) already existed in TDEE section

## Nutrition Features — Auto-fill & Quick Meals (May 16 v5)
- [x] Nutrition.tsx Scanner: auto-fill calories/protein/carbs/fat from scan/search result (keep editable) — LLM fallback added in foodAnalysis.ts when USDA returns null/zeros
- [x] Nutrition.tsx Scanner: add famous meals quick-select grid (meals, coffee, drinks) — QuickMealsGrid component with 26 items across 3 categories, added above ManualSearch in ScannerTab idle state

## Bug Fix — Calorie Burn Inflation (May 16 v6)
- [x] calorieCalc.ts: use actual session duration (checkIn→checkOut) as primary formula instead of per-exercise estimation
- [x] calorieCalc.ts: fix rest time — apply REST_MET (1.3) during rest periods instead of full exercise MET
- [x] calorieCalc.ts: cardio fallback changed from 20 min to 15 min conservative estimate
- [x] calorieCalc.ts: session-type fallback changed from 45 min to 30 min conservative estimate
- [x] ActiveSession.tsx: pass checkInTime and checkOutTime to calcSessionCalories
- [x] Home.tsx: pass weightKg from profile to ActiveSession component

## Auth & Subscription System Migration (Safe)

- [x] DB: Add password_hash, auth_provider (google/email/manus), full_name fields to users table
- [x] DB: Update subscriptions table — add email, activation_code_id, payment_status, payment_provider, transaction_id, auto_renew fields; add free_trial to billing_cycle enum
- [x] Backend: Email + Password Sign Up procedure (bcrypt hash, unique email check)
- [x] Backend: Email + Password Login procedure (verify hash, issue JWT session)
- [x] Backend: Forgot Password procedure (send reset email with token)
- [x] Backend: Google Sign-In procedure (OAuth token verify, upsert user)
- [x] Backend: Update access control — premium access checks subscription.status == active
- [x] Backend: Update MyFatoorah webhook — detect plan, create/update subscription, calculate expiry
- [x] Frontend: New auth page with Google Sign-In + Email/Password tabs
- [x] Frontend: Forgot Password page
- [x] Frontend: Existing user migration flow — link activation code to new account once
- [x] Admin: Update subscriptions page — name, email, code, provider, plan, billing, dates, days remaining, payment status, color indicators (green/orange/red)
- [x] Profile: Show account email, subscription plan, expiry, days remaining, login provider


## New User Onboarding Flow (Auth System Migration)
- [x] Create ProfileSetupPage component for new users after login
- [x] Update standaloneAuth.login to redirect to profile setup page
- [x] Add logout procedure to standaloneAuth router
- [x] Trigger logout for all existing users on app startup (migration)
- [x] Save profile data to users table (full_name, age, height, current_weight, target_weight, gender)

## Google Sign-In Mobile Safari Fix

- [x] Replaced GIS popup/prompt flow with server-side OAuth redirect flow (/api/auth/google)
- [x] Added /api/auth/google and /api/auth/google/callback routes to Express server
- [x] Fixed verifySession to not reject sessions with empty name field
- [x] Ensured session name is always non-empty (fallback chain: fullName → name → displayName → email prefix → "User")
- [x] Added subscription linking by email after Google login
- [x] Added google_error query param handling in AuthPage for clear error messages
- [x] Removed infinite loading state (no more googleLoading stuck state)
- [x] GOOGLE_CLIENT_SECRET configured in environment
- [x] All 113 tests passing, 0 TypeScript errors

## Cross-Device Data Sync (Critical)
- [ ] Audit all localStorage keys and data structures used in useGymTracker hook
- [ ] Create DB tables: workout_sessions, weight_logs, active_session (if not already exist)
- [ ] Build tRPC procedures: createSession, getSessions, deleteSession, logWeight, getWeightLog, saveActiveSession, getActiveSession, clearActiveSession
- [ ] Migrate useGymTracker hook to use tRPC instead of localStorage
- [ ] Add one-time data migration: import existing localStorage data to DB on first login
- [ ] Ensure profile data (name, age, height, weight, gender, goal) syncs from DB on all devices
- [ ] Test: login on device A, add session, login on device B, verify session appears

## Profile & Auth UI Fixes (May 17)
- [ ] ProfilePanel: Remove "Change Key" button, keep only Logout
- [ ] ProfilePanel: Show subscription card (plan, expiry, days left, status color)
- [ ] ProfilePanel: Remove notification preferences section
- [ ] ProfilePanel: Remove workout reminder section
- [ ] ProfilePanel: Remove "Started: 17 May 2026", "Data saved locally", "Auto save enabled" text
- [ ] AuthPage: Replace "لديك كود وصول؟ ادخل كود الوصول" with WhatsApp support link (https://wa.me/96565068000)
- [ ] Help/UserGuide: Update with latest app features

## P1 — Single-Device Enforcement
- [x] DB: Add sessions table (id, userId, deviceId, userAgent, ipAddress, createdAt, expiresAt, revoked)
- [x] DB: Add activeDeviceId, activeSessionId fields to users table
- [x] Backend: On login — create session record, store deviceId, revoke all previous sessions
- [x] Backend: Middleware — reject requests where session.deviceId !== request.deviceId
- [x] Backend: Logout — mark session as revoked in DB
- [x] Frontend: Generate and persist deviceId in localStorage (crypto.randomUUID)
- [x] Frontend: Send x-device-id header on all tRPC requests

## P2 — Remove Google Sign-In Button
- [x] Remove Google Sign-In button from AuthPage UI (keep backend OAuth route for existing users)
- [x] Remove VITE_GOOGLE_CLIENT_ID dependency from AuthPage

## P3 — Security Hardening
- [x] Install helmet and express-rate-limit packages
- [x] Add helmet middleware to Express server
- [x] Add rate limiting on login endpoint (max 10 attempts per 15 min per IP)
- [x] Add rate limiting on signup endpoint (max 5 per hour per IP)
- [x] Add rate limiting on forgot-password endpoint (max 3 per hour per IP)

## Emoji Removal & Profile Redesign
- [x] AuthPage: Remove 💪 flexed arm emoji from sign-up subtitle
- [x] AuthPage: Remove 🙈 monkey emoji from password field toggle
- [x] AuthPage: Remove 🚀 rocket emoji from sign-up button
- [x] AuthPage: Remove 💬 speech bubble emoji from Need Help WhatsApp link
- [x] ResetPasswordPage: Remove 👁 eye emoji from password field toggle
- [x] ResetPasswordPage: Remove 🔑 key emoji from reset button
- [x] ProfilePanel Edit: Remove ⚖️ emoji from Current Weight label
- [x] ProfilePanel Edit: Remove 🎯 emoji from Target Weight label
- [x] ProfilePanel Edit: Remove ✏️ emoji from Edit Profile title
- [x] ProfilePanel Edit: Remove ✅ emoji from Save button
- [x] ProfilePanel: Redesign edit form fields to clean/simple look
- [x] ProfilePanel: Show registered email in profile by default

## Admin User Management & Subscription System
- [x] Fix admin page access issue (check auth gate)
- [x] Add "Users" tab in admin panel to list all registered email users
- [x] Show user details: name, email, registration date, auth provider, subscription status
- [x] Admin can activate/deactivate/delete user accounts
- [x] Replace license-code activation with admin-controlled email subscription system
- [x] Admin can create/assign subscription plans (free, prime_plus, prime_pro) to users
- [x] Admin can set subscription period (monthly, yearly, lifetime) and expiry dates
- [x] Admin can activate/deactivate/extend subscriptions for any user
- [x] Users see subscription status in their profile
- [x] App access gated by active subscription (not license codes)

## Notification System Upgrade
- [x] Add admin_notifications table for in-app popup notifications
- [x] Add notification_reads table to track read status per user
- [x] Admin can send notifications via: in-app popup, email, or both
- [x] In-app popup: modal with blurred background, title, message, optional image, close button
- [x] After closing, notification marked as read and never reappears
- [x] Notification targeting: all users, specific users, active subscribers, new subscribers
- [x] Optional CTA button with customizable text and link
- [x] Email notifications sent to registered user emails
- [x] Admin notification send UI in Broadcast tab (or new Notifications tab)

## Admin Access Fix
- [x] Admin users bypass subscription gate (LicenseGate checks user role)
- [x] Promote reemprimeco@gmail.com to admin role in DB
- [x] Disable device enforcement (activeDeviceId column not yet in DB)

## Admin Users Tab Fix
- [x] Filter out admin users from the Users tab (only show role = 'user' accounts)

## Delete User Button in Admin Users Tab
- [ ] Add Delete button to each user row in the admin Users tab
- [ ] Show confirmation dialog before deleting
- [ ] Wire to existing deleteUser tRPC procedure
- [ ] Refresh user list after successful deletion

## Admin Panel — Remove Licenses Tab & Update Dashboard
- [x] Remove the Licenses tab from the admin panel tab bar
- [x] Remove the entire Licenses tab content (create code form + access codes list)
- [x] Update Dashboard stats cards: replace Total Licenses / Active Licenses / Inactive Licenses with Total Users / Active Subscribers / Expired Subscriptions
- [x] Keep Broadcasts Sent and Total Recipients cards on Dashboard

## Admin Panel — Search/Filter Users & Remove Subscriptions Tab
- [x] Add search input (by name or email) to Users tab header
- [x] Add subscription status filter dropdown (All / Active / Trialing / Expired / No Subscription) to Users tab
- [x] Filter user list in real-time as admin types or selects filter
- [x] Remove the Subscriptions tab from the admin panel tab bar and content

## Profile Redesign & Admin Button
- [x] Redesign ProfilePanel to match clean card-based layout (avatar circle, name/stats row, Edit Profile button, subscription card, logout/reset buttons)
- [x] Remove license key from subscription card in ProfilePanel — show "Admin" for admin role, or plan name (Prime Plus / Prime Pro / Free) for regular users
- [x] Add Admin Panel button in the top bar of Home.tsx, visible only to admin users (role === 'admin')

## Connect Pricing Page to Auth Flow
- [x] Audit existing AuthPage, SubscriptionPage, and subscription backend
- [x] Store selected plan+billing in sessionStorage before redirecting to login
- [x] Show pricing page before login/signup for unauthenticated users
- [x] After login: if plan was selected, activate free plan or redirect to MyFatoorah
- [x] Skip pricing page for returning users with active subscription
- [x] Save plan, billing cycle, status, expiration to DB linked to user_id

## Edit Profile Redesign
- [x] Redesign Edit Profile form to match reference: white background, icon-prefixed fields (Name, Current Weight, Target Weight, Starting Weight, Height, Age), gender toggle (Male/Female), Health Summary section (BMI + weight classification), Save Changes + Cancel buttons, user avatar card at top

## AI Coach Page Redesign
- [x] Redesign AI Coach (مدربي الذكي) page: white background, navy blue accents, stats cards row (sessions/weight change/weekly achievement/streak), clean chat message bubbles, navy header card with coach icon, send button with navy color

## AI Coach Chat Layout Fix (WhatsApp-Style)
- [x] Fix MyCoach.tsx chat section: header + stats + tabs fixed at top, chat messages scroll independently, input bar fixed at bottom — nothing moves except the messages area
- [x] Entire MyCoach page must fill the screen height (no page-level scroll), integrated with the app shell (bottom nav stays fixed)
## Statistics Logic Fix
- [x] Fix streak calculation: use actual consecutive workout dates, NOT total session count
- [x] Fix weekly sessions: count sessions in current calendar week (Sun-Sat), not rolling 7 days
- [x] Fix monthly sessions: count sessions in current calendar month
- [x] Ensure total sessions = all completed sessions (verified correct)
- [x] Update StatsPanel UI labels to clearly distinguish streak vs total sessions

## Nutrition System Redesign (MyFitnessPal-style)
- [ ] DB schema: add meal_favorites table
- [ ] Run pnpm db:push for new tables
- [ ] Server: addFavorite, removeFavorite, getFavorites procedures
- [ ] Server: getHistory grouped by day procedure
- [ ] Server: getRecentMeals procedure
- [ ] Server: quickAdd procedure
- [ ] Redesign MealsTab: daily view grouped by meal type
- [ ] MealsTab: daily calorie/macro summary header
- [ ] MealsTab: water tracking row
- [ ] MealsTab: meal group sections with + add button per group
- [ ] MealsTab: floating FAB with quick-add sheet
- [ ] MealsTab: manual entry form
- [ ] MealsTab: History tab (browse previous days)
- [ ] MealsTab: Favorites section
- [ ] MealsTab: Recently Used section
- [ ] MealsTab: swipe-to-delete
- [ ] MealsTab: replace emoji with SVG vector icons
- [ ] MealsTab: white background iOS-style cards

## Notification Bell / XP Panel Clipping Fix
- [x] Move Community tab outside main element (like Coach tab) to fix overflow:hidden clipping of fixed-position panels

## Full-Site Emoji Removal (May 18)
- [x] Create AppIcons.tsx component with 100+ lucide-react icon wrappers
- [x] Replace all emoji icons in Home.tsx (nav tabs, session cards, header)
- [x] Replace all emoji icons in ActiveSession.tsx (mood buttons, cardio labels, rower fields)
- [x] Replace all emoji icons in SessionHistory.tsx (session type icon, mood display)
- [x] Replace all emoji icons in StatsPanel.tsx (stats cards, calorie cards, session type list)
- [x] Replace all emoji icons in Nutrition.tsx (macro cards, scanner, insights)
- [x] Replace all emoji icons in NutritionMealsTab.tsx
- [x] Replace all emoji icons in MyCoach.tsx (rating array, insight cards)
- [x] Replace all emoji icons in Community.tsx (badges, countdown, leaderboard)
- [x] Replace all emoji icons in ProfilePanel.tsx (section headers, buttons)
- [x] Replace all emoji icons in WorkoutGuide.tsx (tab icons, section headers)
- [x] Replace all emoji icons in AdminPanel.tsx (stat cards, tab icons, broadcast)
- [x] Replace all emoji icons in ExerciseLibrary.tsx (tips toggle, exercise expand arrows, category tabs)
- [x] Replace all emoji icons in WorkoutCalendar.tsx (header, day cells, completed badge)
- [x] Replace all emoji icons in WorkoutTimer.tsx (finish state)
- [x] Replace all emoji icons in NotificationSettings.tsx (warning banners)
- [x] Add AppIcons imports to all affected files
- [x] Fix all JSX parse errors caused by emoji replacement (unclosed tags, missing braces)
- [x] 0 TypeScript errors, 0 Vite errors after all replacements

## Favorite Exercises Feature
- [x] DB schema: add exercise_favorites table (id, userId, exerciseId, createdAt)
- [x] Run pnpm db:push to push schema
- [x] Server: addFavorite procedure (protectedProcedure, insert into exercise_favorites)
- [x] Server: removeFavorite procedure (protectedProcedure, delete from exercise_favorites)
- [x] Server: getFavorites procedure (protectedProcedure, return list of exerciseIds)
- [x] Register favorites router in server/routers.ts
- [x] ExerciseLibrary: rename "برنامجك" tab to "تماريني المفضلة" with heart SVG icon
- [x] ExerciseLibrary: add heart toggle button to each exercise card in "كل التمارين" tab
- [x] ExerciseLibrary: heart states — filled (favorite) vs outline (not favorite), SVG vectors only
- [x] ExerciseLibrary: smooth CSS transition animation on heart toggle
- [x] ExerciseLibrary: "تماريني المفضلة" tab shows only favorited exercises
- [x] ExerciseLibrary: empty state when no favorites — Arabic message + heart icon
- [x] ExerciseLibrary: optimistic UI updates for instant heart toggle feedback
- [x] Write vitest tests for favorites procedures (13 tests)
- [x] Verify 0 TypeScript errors after all changes

## Vibrant Colored SVG Icons (May 18)
- [x] Create ColorIcons.tsx component with vibrant colored SVG icons
- [x] Nutrition tabs: colored dashboard (orange), fork/meals (green), camera/scanner (purple), robot/insights (cyan)
- [x] Nutrition: colored water drop icon (blue), macronutrients cloud icon (teal)
- [x] Nutrition: colored water cup buttons (blue gradient)
- [x] Coach: colored robot header icon (cyan/blue gradient)
- [x] Coach tabs: colored message icon (blue), sun icon (orange/yellow), brain icon (purple)
- [x] Coach stat cards: colored dumbbell (navy), stats/chart (orange), check (green), flame/streak (red-orange)
- [x] Community leaderboard: gold medal (rank 1), silver medal (rank 2), bronze medal (rank 3) — colored SVG
- [x] Exercise categories: colored icons for Lower Body, Upper Body, Core, Cardio, etc.
- [x] 0 TypeScript errors after all changes

## Water Cards & Meal Food Icons (May 18)
- [x] Water intake cards: replace "water" text with water drop SVG vector (small cup, cup, can, bottle)
- [x] Meal cards: replace generic fork icon with food-specific colored SVG per meal name (plate/coffee cup/juice cup per category; food-specific per item)
- [x] Category tabs: Meals = plate icon, Coffee = coffee cup icon, Drinks = juice cup icon
- [x] 0 TypeScript errors after changes

## Legal Pages (Privacy Policy & Terms of Service)
- [x] Write full Privacy Policy content in English (13 sections)
- [x] Write full Privacy Policy content in Arabic (13 sections, Kuwaiti dialect)
- [x] Write full Terms of Service content in English (13 sections)
- [x] Write full Terms of Service content in Arabic (13 sections, Kuwaiti dialect)
- [x] Build shared LegalPage.tsx component with AR/EN language toggle, clean white layout, Prime Fit branding
- [x] Register /privacy and /terms routes in App.tsx (public pages, no auth required)
- [x] Add Legal section to ProfilePanel HelpSection with Privacy Policy and Terms of Service links
- [x] 0 TypeScript errors after all changes
