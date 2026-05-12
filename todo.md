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
- [ ] WooCommerce API integration (re-enable when server security issue resolved — currently returns 401)
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
- [ ] DB: community_posts table (id, userId, type, content, imageUrl, visibility, xpAwarded, createdAt)
- [ ] DB: community_post_reactions table (id, postId, userId, type: like/cheer/fire, createdAt)
- [ ] DB: community_comments table (id, postId, userId, content, createdAt)
- [ ] DB: community_stories table (id, userId, type, content, imageUrl, expiresAt, createdAt)
- [ ] DB: community_challenges table (id, title, titleAr, description, descriptionAr, type, targetValue, startDate, endDate, xpReward, createdAt)
- [ ] DB: community_challenge_participants table (id, challengeId, userId, progress, completedAt, joinedAt)
- [ ] DB: community_xp_log table (id, userId, event, points, refId, createdAt)
- [ ] pnpm db:push migrations applied
- [ ] server/db.ts: community DB helpers
- [ ] server/routers/community.ts: tRPC router (getFeed, createPost, reactToPost, getComments, addComment, getStories, getLeaderboard, getChallenges, joinChallenge, getMyXP, getAIInsights, autoGeneratePost)
- [ ] Register community router in server/routers.ts
- [ ] client/src/pages/Community.tsx: full page with stories bar, AI insight card, post feed, leaderboard, challenges, XP panel
- [ ] Stories bar: circular avatars with active streak indicators
- [ ] AI Insight card: personalized motivational card pinned at top of feed
- [ ] Post feed: Instagram-style cards with reactions (like/cheer/fire), comments, trending badge
- [ ] Post creation: text + image upload with visibility selector
- [ ] Weekly leaderboard: top 10 with XP, level badge, rank movement arrows
- [ ] Challenges section: active challenges with join button and progress bar
- [ ] XP & Level panel: user level, total XP, badges earned
- [ ] Auto-generated achievement posts (streak milestones, level-ups)
- [ ] Dark neon UI: navy + cyan/orange, smooth CSS animations, mobile-first
- [ ] Bilingual: Arabic RTL + English support throughout
- [ ] Add Community tab to bottom navigation in Home.tsx
- [ ] Write vitest tests for community router
