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
- [ ] Push notifications for workout reminders
