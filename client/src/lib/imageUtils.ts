import type { SyntheticEvent } from "react";

/**
 * Image URL constants — all static workout images are served via /api/img/
 * which is an Express proxy that pipes bytes directly (no redirect).
 *
 * Why /api/img/ and not /manus-storage/?
 * The platform CDN intercepts /manus-storage/* on production and returns a
 * 307 redirect to a signed CloudFront URL. Safari/iOS PWA blocks cross-origin
 * 307 redirects for <img> tags. /api/ routes bypass the platform CDN and go
 * directly to our Express server which pipes bytes with a 200 response.
 */
export const CDN = {
  placeholder:        "/api/img/placeholder_4de366d7.png",
  ab_exercises:       "/api/img/ab_exercises_e4d17f07.jpg",
  abs_glutes:         "/api/img/abs_glutes_ed35895a.jpg",
  aqua:               "/api/img/aqua_f892423a.jpg",
  aqua2:              "/api/img/aqua2_e15db429.jpg",
  arm_exercises:      "/api/img/arm_exercises_5b84dfc6.jpg",
  cardio_machines:    "/api/img/cardio_machines_8937836e.jpg",
  chest_shoulder:     "/api/img/chest_shoulder_f1405bff.jpg",
  deadlift_squat:     "/api/img/deadlift_squat_798a4a63.jpg",
  elliptical:         "/api/img/elliptical_5f632b3d.jpg",
  glute_exercises:    "/api/img/glute_exercises_ba40b0cd.jpg",
  glutes:             "/api/img/glutes_0a523f53.jpg",
  lat_pulldown:       "/api/img/lat_pulldown_fac5d232.jpg",
  lunges_squats:      "/api/img/lunges_squats_70531127.jpg",
  nutrition:          "/api/img/nutrition_1a15e6de.jpg",
  plank:              "/api/img/plank_75b3f965.jpg",
  sauna:              "/api/img/sauna_721a5de2.jpg",
  sauna_benefits:     "/api/img/sauna_benefits_8e077ed9.png",
  shoulder_exercises: "/api/img/shoulder_exercises_b5f42a3f.jpg",
  treadmill:          "/api/img/treadmill_d0f6a7fe.jpg",
  warmup:             "/api/img/warmup_f0d52c65.png",
  warmup2:            "/api/img/warmup2_e732b4f6.jpg",
} as const;

export const PLACEHOLDER_IMAGE = CDN.placeholder;
export const LOGO_URL = "/logo512.png";

/** Global img onError handler — prevents broken-image icon in the browser */
export function handleImageError(
  e: SyntheticEvent<HTMLImageElement, Event>
): void {
  const img = e.currentTarget;
  if (img.src.includes("placeholder")) return;
  img.onerror = null;
  img.src = PLACEHOLDER_IMAGE;
}

/** Map old /images/ local paths → /api/img/ proxy URLs */
const LOCAL_TO_CDN: Record<string, string> = {
  "/images/ab_exercises.jpg":       CDN.ab_exercises,
  "/images/abs_glutes.jpg":         CDN.abs_glutes,
  "/images/aqua.jpg":               CDN.aqua,
  "/images/aqua2.jpg":              CDN.aqua2,
  "/images/arm_exercises.jpg":      CDN.arm_exercises,
  "/images/cardio_machines.jpg":    CDN.cardio_machines,
  "/images/chest_shoulder.jpg":     CDN.chest_shoulder,
  "/images/deadlift_squat.jpg":     CDN.deadlift_squat,
  "/images/elliptical.jpg":         CDN.elliptical,
  "/images/glute_exercises.jpg":    CDN.glute_exercises,
  "/images/glutes.jpg":             CDN.glutes,
  "/images/lat_pulldown.jpg":       CDN.lat_pulldown,
  "/images/lunges_squats.jpg":      CDN.lunges_squats,
  "/images/nutrition.jpg":          CDN.nutrition,
  "/images/placeholder.png":        CDN.placeholder,
  "/images/plank.jpg":              CDN.plank,
  "/images/sauna.jpg":              CDN.sauna,
  "/images/sauna_benefits.png":     CDN.sauna_benefits,
  "/images/shoulder_exercises.jpg": CDN.shoulder_exercises,
  "/images/treadmill.jpg":          CDN.treadmill,
  "/images/warmup.png":             CDN.warmup,
  "/images/warmup2.jpg":            CDN.warmup2,
};

/** Map old /manus-storage/ hashed filenames → /api/img/ proxy URLs */
const LEGACY_MANUS_MAP: Record<string, string> = {
  // Old hashes from previous uploads
  "warmup_f8a00b2a.png":                CDN.warmup,
  "treadmill_039009ca.jpg":             CDN.treadmill,
  "machine-rower_003165e0.jpg":         CDN.cardio_machines,
  "elliptical_25526689.jpg":            CDN.elliptical,
  "cardio_machines_6b910eda.jpg":       CDN.cardio_machines,
  "glutes_5f977189.jpg":                CDN.glutes,
  "lunges_squats_536a67c0.jpg":         CDN.lunges_squats,
  "deadlift_squat_0f651346.jpg":        CDN.deadlift_squat,
  "arm_exercises_2b6ba203.jpg":         CDN.arm_exercises,
  "lat_pulldown_fd6f2005.jpg":          CDN.lat_pulldown,
  "plank_b44f6d96.jpg":                 CDN.plank,
  "ab_exercises_5c818dad.jpg":          CDN.ab_exercises,
  "chest_shoulder_f2f90ec8.jpg":        CDN.chest_shoulder,
  "shoulder_exercises_72e2de89.jpg":    CDN.shoulder_exercises,
  "abs_glutes_eb1890bb.jpg":            CDN.abs_glutes,
  "glute_exercises_6dfafade.jpg":       CDN.glute_exercises,
  "sauna_b9935cdb.jpg":                 CDN.sauna,
  "aqua_690009c3.jpg":                  CDN.aqua,
  "aqua2_34967505.jpg":                 CDN.aqua2,
  // New uploads (map manus-storage → api/img)
  "aqua_f892423a.jpg":                  CDN.aqua,
  "aqua2_e15db429.jpg":                 CDN.aqua2,
  "sauna_721a5de2.jpg":                 CDN.sauna,
  "glutes_0a523f53.jpg":                CDN.glutes,
  "treadmill_d0f6a7fe.jpg":             CDN.treadmill,
  "arm_exercises_5b84dfc6.jpg":         CDN.arm_exercises,
  "lat_pulldown_fac5d232.jpg":          CDN.lat_pulldown,
  "lunges_squats_70531127.jpg":         CDN.lunges_squats,
  "deadlift_squat_798a4a63.jpg":        CDN.deadlift_squat,
  "chest_shoulder_f1405bff.jpg":        CDN.chest_shoulder,
  "shoulder_exercises_b5f42a3f.jpg":    CDN.shoulder_exercises,
  "ab_exercises_e4d17f07.jpg":          CDN.ab_exercises,
  "abs_glutes_ed35895a.jpg":            CDN.abs_glutes,
  "glute_exercises_ba40b0cd.jpg":       CDN.glute_exercises,
  "plank_75b3f965.jpg":                 CDN.plank,
  "cardio_machines_8937836e.jpg":       CDN.cardio_machines,
  "elliptical_5f632b3d.jpg":            CDN.elliptical,
  "nutrition_1a15e6de.jpg":             CDN.nutrition,
  "warmup_f0d52c65.png":                CDN.warmup,
  "warmup2_e732b4f6.jpg":               CDN.warmup2,
  "sauna_benefits_8e077ed9.png":        CDN.sauna_benefits,
  "placeholder_4de366d7.png":           CDN.placeholder,
  // Machine images → closest category
  "machine-shoulder-press_471161cb.png":  CDN.shoulder_exercises,
  "machine-lateral-raise_e9f5c24a.png":   CDN.shoulder_exercises,
  "machine-rear-delt_3d456993.webp":      CDN.shoulder_exercises,
  "machine-chest-press_82846c6c.jpg":     CDN.chest_shoulder,
  "machine-pec-deck_585db15a.jpg":        CDN.chest_shoulder,
  "machine-bicep-curl_0cb63636.jpg":      CDN.arm_exercises,
  "machine-lat-pulldown_0cc3f20a.jpg":    CDN.lat_pulldown,
  "machine-seated-row_95d26900.jpg":      CDN.lat_pulldown,
  "machine-back-extension_c32dec11.jpg":  CDN.lat_pulldown,
  "machine-leg-press_59da16cc.jpg":       CDN.lunges_squats,
  "machine-leg-extension_74a07b5a.jpg":   CDN.glutes,
  "machine-leg-curl_52a73a8d.jpg":        CDN.glutes,
  "machine-calf-raise_56717650.jpg":      CDN.glutes,
};

function stripManusHash(filename: string): string {
  return filename.replace(/_[a-f0-9]{8}(\.[a-zA-Z]+)$/i, "$1");
}

function resolveManusFilename(filename: string): string | undefined {
  if (LEGACY_MANUS_MAP[filename]) return LEGACY_MANUS_MAP[filename];

  const stripped = stripManusHash(filename);
  const localPath = `/images/${stripped}`;
  if (LOCAL_TO_CDN[localPath]) return LOCAL_TO_CDN[localPath];

  const lower = stripped.toLowerCase();
  for (const [local, cdn] of Object.entries(LOCAL_TO_CDN)) {
    if (local.toLowerCase().endsWith(`/${lower}`)) return cdn;
  }

  if (filename.startsWith("machine-")) {
    if (/shoulder|lateral|rear-delt/i.test(filename)) return CDN.shoulder_exercises;
    if (/chest|pec/i.test(filename)) return CDN.chest_shoulder;
    if (/bicep|tricep|arm/i.test(filename)) return CDN.arm_exercises;
    if (/lat|row|back/i.test(filename)) return CDN.lat_pulldown;
    if (/leg|glute|calf/i.test(filename)) return CDN.glutes;
    if (/rower|cardio/i.test(filename)) return CDN.cardio_machines;
  }

  return undefined;
}

/**
 * Resolve any image URL to a working /api/img/ proxy URL.
 * - /images/* local paths → /api/img/
 * - /manus-storage/* paths → /api/img/ (bypasses platform CDN 307 redirect)
 * - External http(s) URLs → unchanged
 * - null/undefined → placeholder
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (/^https?:\/\//i.test(url)) return url;

  // Old /images/ local paths → /api/img/
  if (url.startsWith("/images/")) {
    return LOCAL_TO_CDN[url] ?? PLACEHOLDER_IMAGE;
  }

  // /manus-storage/ paths → /api/img/ to bypass platform CDN 307 redirect
  if (url.startsWith("/manus-storage/")) {
    const filename = url.slice("/manus-storage/".length);
    const resolved = resolveManusFilename(filename);
    if (resolved) return resolved;
    // Unknown manus-storage key — rewrite to /api/img/ anyway so it goes through our proxy
    return `/api/img/${filename}`;
  }

  // /api/img/ paths are already correct
  if (url.startsWith("/api/img/")) return url;

  // Logo and PWA icons
  if (url.startsWith("/logo") || url.startsWith("/apple-touch-icon") || url.startsWith("/icon-")) {
    return url;
  }

  return url;
}
