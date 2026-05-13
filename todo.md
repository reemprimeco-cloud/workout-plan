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

## Future / Pending (not blocking current releas- [x] WooCommerce webhook integration — auto-generates license key on order.processing/completed and emails customerPush notifications for workout reminders
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
- [ ] License keys: WooPoller marks expired keys as inactive automatically
