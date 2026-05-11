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
