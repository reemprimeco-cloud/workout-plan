# Prime Fit — Known Bugs

## Active Bugs

### BUG-001: NaN% in Weight Progress Bar for New Users

**Severity:** Medium — visible to all new users on first launch

**Description:** The weight progress bar on the home screen displays "NaN% • Lost 0.0 kg" when both `currentWeight` and `targetWeight` are 0 (the default for new users who have not completed profile setup).

**Location:** `client/src/pages/Home.tsx`, `CheckInPanel` component, weight progress calculation.

**Cause:** The percentage is calculated as `((startWeight - currentWeight) / (startWeight - targetWeight)) * 100`. When `startWeight` and `targetWeight` are both 0, this results in a division by zero, producing `NaN`.

**Suggested Fix:** Add a guard clause before the calculation:
```tsx
const progressPercent = (startWeight === targetWeight || targetWeight === 0)
  ? 0
  : Math.max(0, Math.min(100, ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100));
```
Show a "Set your goal weight to track progress" message when `targetWeight === 0`.

---

### BUG-002: Workout Session Data Lost on New Device Login

**Severity:** High — data loss for users who switch devices

**Description:** All workout session history, weight logs, and active session state are stored in `localStorage` via the `useGymTracker` hook. When a user logs in on a different device or clears their browser data, all historical data is lost.

**Location:** `client/src/hooks/useGymTracker.ts`

**Cause:** The hook was originally designed for a single-device PWA. The database migration to tRPC-backed persistence was planned but not yet implemented.

**Suggested Fix:** Migrate `useGymTracker` to use tRPC procedures backed by the `gymSessions` and `weightLogs` database tables. See the full migration plan in `TODO.md` under "Cross-Device Data Sync".

---

### BUG-003: Arabic Feminine Text Shown to Male Users

**Severity:** Medium — affects all Arabic-speaking male users

**Description:** All Arabic text throughout the app uses the feminine grammatical form. Male users see grammatically incorrect Arabic (e.g., "أنتِ رائعة" instead of "أنتَ رائع").

**Location:** `client/src/contexts/LanguageContext.tsx`, `client/src/pages/Home.tsx`, `client/src/components/ActiveSession.tsx`, `client/src/components/WorkoutGuide.tsx`, `client/src/pages/Nutrition.tsx`, and `server/routers/coach.ts` (system prompt).

**Cause:** The app was initially designed for a female-only gym. Male user support was added later but the Arabic text was not updated to be gender-aware.

**Suggested Fix:** Add a `gender` parameter to the `t()` translation function in `LanguageContext.tsx`. Provide both masculine and feminine variants for all gender-sensitive strings. Use `profile.gender` to select the correct variant at render time.

---

### BUG-004: Profile Avatar Stored as Base64 in Database

**Severity:** Medium — performance and storage issue

**Description:** User profile photos are stored as base64-encoded strings directly in the `users.avatarUrl` column. This causes slow queries on the users table and wastes database storage.

**Location:** `client/src/components/ProfilePanel.tsx`, `server/routers/userProfile.ts`

**Cause:** The S3 upload flow for avatars was not implemented. Base64 was used as a quick workaround.

**Suggested Fix:** Implement the `uploadAvatar` tRPC procedure that accepts a base64 string, uploads it to S3 via `storagePut()`, and returns the storage URL. Update `ProfilePanel.tsx` to use this procedure. See `TODO.md` for the full task breakdown.

---

### BUG-005: Miss Platinum Gym Logo Shows Placeholder After Admin Upload

**Severity:** Medium — affects gym branding in the Today's Classes section

**Description:** When an admin uploads a gym logo via the Admin Panel, the logo URL is stored as `/manus-storage/gym-logos/xxx.png`. On the published site, this URL goes through the platform CDN which returns a `307` redirect to CloudFront. Safari and iOS PWA block this cross-origin redirect for `<img>` tags.

**Location:** `client/src/pages/Home.tsx`, the gym logo `<img>` in `TodayClassesSection`.

**Status:** Partially fixed — `resolveImageUrl()` is now called on the gym logo `src`. However, the `resolveImageUrl()` function only rewrites known static image paths from its `CDN_IMAGE_MAP`. Dynamic user-uploaded paths (like gym logos) are not in the map and are passed through unchanged.

**Suggested Fix:** Update `resolveImageUrl()` to rewrite **any** `/manus-storage/` path (not just known static ones) to `/api/img/`:
```ts
export function resolveImageUrl(url: string): string {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith('/manus-storage/')) {
    return url.replace('/manus-storage/', '/api/img/');
  }
  return CDN_IMAGE_MAP[url] ?? url;
}
```

---

### BUG-006: Community Post Images May Fail on Safari

**Severity:** Low — affects community feature on iOS

**Description:** Community post images are stored as `/manus-storage/community/xxx.jpg`. These URLs are rendered directly in `<img>` tags in `Community.tsx` without going through `resolveImageUrl()`.

**Location:** `client/src/pages/Community.tsx`

**Cause:** The same Safari 307 redirect blocking issue as BUG-005. Community images were not updated when the image proxy fix was applied.

**Suggested Fix:** Apply `resolveImageUrl()` to all community post image `src` values, or use `<SafeImage>` component.

---

### BUG-007: Duplicate Arabic Gender Fix Entries in todo.md

**Severity:** Low — documentation only

**Description:** The `todo.md` file contains two identical sets of Arabic gender fix tasks (lines 327–336 and lines 340–346). This is a documentation duplicate from two separate task sessions that addressed the same issue.

**Suggested Fix:** Remove the duplicate entries from `todo.md`.

---

## Resolved Bugs (Recent)

| Bug | Resolution |
|-----|-----------|
| Session icons showing broken placeholder on published site | Migrated all static image paths from `/manus-storage/` to `/api/img/` proxy which pipes bytes directly, bypassing platform CDN 307 redirect |
| Nav bar icons missing on iOS Safari | Downloaded icons from CloudFront (no CORS headers), uploaded to webdev storage, now served via `/api/img/` with `Access-Control-Allow-Origin: *` |
| CMS uploaded icons not appearing on home cards after upload | Added `getPublicSessionIcons` query invalidation to the upload mutation; reduced `staleTime` to 0 in CMSContext |
| StorageProxy returning 307 on dev server (Safari issue) | Rewrote `storageProxy.ts` to pipe image bytes directly instead of redirecting |
| Exercise library not showing CMS image overrides | Added `useCMS()` import and override merge in `ExerciseLibrary.tsx` |
| TypeScript error: `errorCountQuery.data?.count` on number type | Fixed to `typeof errorCountQuery.data === 'number' ? errorCountQuery.data : 0` |
