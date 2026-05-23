import type { SyntheticEvent } from "react";

/** Served from client/public/images/placeholder.png via Vite publicDir */
export const PLACEHOLDER_IMAGE = "/images/placeholder.png";

export const LOGO_URL = "/logo512.png";

/** Global img onError handler — prevents broken-image icon in the browser */
export function handleImageError(
  e: SyntheticEvent<HTMLImageElement, Event>
): void {
  const img = e.currentTarget;
  if (img.src.endsWith(PLACEHOLDER_IMAGE)) return;
  img.onerror = null;
  img.src = PLACEHOLDER_IMAGE;
}

/** Known manus-storage filenames → local public paths */
const MANUS_STORAGE_MAP: Record<string, string> = {
  "warmup_f8a00b2a.png": "/images/warmup.png",
  "treadmill_039009ca.jpg": "/images/treadmill.jpg",
  "machine-rower_003165e0.jpg": "/images/cardio_machines.jpg",
  "elliptical_25526689.jpg": "/images/elliptical.jpg",
  "cardio_machines_6b910eda.jpg": "/images/cardio_machines.jpg",
  "glutes_5f977189.jpg": "/images/glutes.jpg",
  "lunges_squats_536a67c0.jpg": "/images/lunges_squats.jpg",
  "deadlift_squat_0f651346.jpg": "/images/deadlift_squat.jpg",
  "arm_exercises_2b6ba203.jpg": "/images/arm_exercises.jpg",
  "lat_pulldown_fd6f2005.jpg": "/images/lat_pulldown.jpg",
  "plank_b44f6d96.jpg": "/images/plank.jpg",
  "ab_exercises_5c818dad.jpg": "/images/ab_exercises.jpg",
  "chest_shoulder_f2f90ec8.jpg": "/images/chest_shoulder.jpg",
  "shoulder_exercises_72e2de89.jpg": "/images/shoulder_exercises.jpg",
  "abs_glutes_eb1890bb.jpg": "/images/abs_glutes.jpg",
  "glute_exercises_6dfafade.jpg": "/images/glute_exercises.jpg",
  "sauna_b9935cdb.jpg": "/images/sauna.jpg",
  "aqua_690009c3.jpg": "/images/aqua.jpg",
  "aqua2_34967505.jpg": "/images/aqua2.jpg",
  "primefit_logo_49f796b1.PNG": "/logo512.png",
  "logo192_cf9ccb65.png": "/logo192.png",
  "logo512_95cc3580.png": "/logo512.png",
  "apple-touch-icon_e6fe2cf5.png": "/apple-touch-icon.png",
  // Machine images → closest category photo
  "machine-shoulder-press_471161cb.png": "/images/shoulder_exercises.jpg",
  "machine-lateral-raise_e9f5c24a.png": "/images/shoulder_exercises.jpg",
  "machine-rear-delt_3d456993.webp": "/images/shoulder_exercises.jpg",
  "machine-chest-press_82846c6c.jpg": "/images/chest_shoulder.jpg",
  "machine-pec-deck_585db15a.jpg": "/images/chest_shoulder.jpg",
  "machine-bicep-curl_0cb63636.jpg": "/images/arm_exercises.jpg",
  "machine-lat-pulldown_0cc3f20a.jpg": "/images/lat_pulldown.jpg",
  "machine-seated-row_95d26900.jpg": "/images/lat_pulldown.jpg",
  "machine-back-extension_c32dec11.jpg": "/images/lat_pulldown.jpg",
  "machine-leg-press_59da16cc.jpg": "/images/lunges_squats.jpg",
  "machine-leg-extension_74a07b5a.jpg": "/images/glutes.jpg",
  "machine-leg-curl_52a73a8d.jpg": "/images/glutes.jpg",
  "machine-calf-raise_56717650.jpg": "/images/glutes.jpg",
};

const LOCAL_IMAGES = new Set([
  "/images/warmup.png",
  "/images/warmup2.jpg",
  "/images/treadmill.jpg",
  "/images/elliptical.jpg",
  "/images/cardio_machines.jpg",
  "/images/glutes.jpg",
  "/images/lunges_squats.jpg",
  "/images/deadlift_squat.jpg",
  "/images/arm_exercises.jpg",
  "/images/lat_pulldown.jpg",
  "/images/plank.jpg",
  "/images/ab_exercises.jpg",
  "/images/chest_shoulder.jpg",
  "/images/shoulder_exercises.jpg",
  "/images/abs_glutes.jpg",
  "/images/glute_exercises.jpg",
  "/images/sauna.jpg",
  "/images/sauna_benefits.png",
  "/images/aqua.jpg",
  "/images/aqua2.jpg",
  "/images/nutrition.jpg",
  "/images/placeholder.png",
  "/logo192.png",
  "/logo512.png",
  "/apple-touch-icon.png",
  "/favicon-32.png",
  "/icon-192.png",
]);

function stripManusHash(filename: string): string {
  return filename.replace(/_[a-f0-9]{8}(\.[a-zA-Z]+)$/i, "$1");
}

function resolveManusFilename(filename: string): string | undefined {
  if (MANUS_STORAGE_MAP[filename]) return MANUS_STORAGE_MAP[filename];

  const stripped = stripManusHash(filename);
  const basePath = `/images/${stripped}`;
  if (LOCAL_IMAGES.has(basePath)) return basePath;

  const lower = stripped.toLowerCase();
  for (const local of Array.from(LOCAL_IMAGES)) {
    if (local.toLowerCase().endsWith(`/${lower}`)) return local;
  }

  if (filename.startsWith("machine-")) {
    if (/shoulder|lateral|rear-delt/i.test(filename)) return "/images/shoulder_exercises.jpg";
    if (/chest|pec/i.test(filename)) return "/images/chest_shoulder.jpg";
    if (/bicep|tricep|arm/i.test(filename)) return "/images/arm_exercises.jpg";
    if (/lat|row|back/i.test(filename)) return "/images/lat_pulldown.jpg";
    if (/leg|glute|calf/i.test(filename)) return "/images/glutes.jpg";
    if (/rower|cardio/i.test(filename)) return "/images/cardio_machines.jpg";
  }

  return undefined;
}

/**
 * Resolve a possibly broken /manus-storage/ URL to a local public path.
 * External URLs and already-local paths are returned unchanged.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (/^https?:\/\//i.test(url)) return url;

  if (url.startsWith("/manus-storage/")) {
    const filename = url.slice("/manus-storage/".length);
    return resolveManusFilename(filename) ?? PLACEHOLDER_IMAGE;
  }

  if (url.startsWith("/images/") || url.startsWith("/logo") || url.startsWith("/apple-touch-icon")) {
    return url;
  }

  return url;
}
