// Storage abstraction backed by Supabase Storage.
//
// The application only ever calls storagePut / storageGet / storageGetSignedUrl
// and depends on the { key, url } return shape — it does not know about
// Supabase. Swapping to another provider means reimplementing this file only.
//
// Files are organized into buckets by the first path segment of the key
// (see BUCKET_FOR_PREFIX). health-reports is private (signed URLs only); the
// rest are public.

import { getSupabaseAdmin } from "./_core/supabase";

// ── Bucket routing ────────────────────────────────────────────────────────────
export const BUCKETS = ["avatars", "gyms", "exercises", "community", "health-reports", "ai-assets"] as const;
export type Bucket = (typeof BUCKETS)[number];

const PRIVATE_BUCKETS = new Set<Bucket>(["health-reports"]);

// Map the leading path segment of a key onto one of the six buckets.
const BUCKET_FOR_PREFIX: Record<string, Bucket> = {
  "user-avatars": "avatars",
  avatars: "avatars",
  "gym-logos": "gyms",
  gyms: "gyms",
  cms: "exercises",
  exercises: "exercises",
  community: "community",
  "health-reports": "health-reports",
  "ai-assets": "ai-assets",
  "admin-profile": "ai-assets",
};

export function bucketForKey(key: string): Bucket {
  const prefix = key.split("/")[0];
  return BUCKET_FOR_PREFIX[prefix] ?? "ai-assets";
}

export function isPrivateBucket(bucket: Bucket): boolean {
  return PRIVATE_BUCKETS.has(bucket);
}

// ── Key helpers ───────────────────────────────────────────────────────────────
function normalizeKey(relKey: string): string {
  // Reject path-traversal segments defensively.
  if (relKey.split(/[/\\]/).some((seg) => seg === "..")) {
    throw new Error("Invalid storage key: path traversal is not allowed");
  }
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

// ── Image validation (unchanged from the previous storage layer) ────────────────
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

function sniffImageMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
  return null;
}

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year (staging)

async function urlForObject(bucket: Bucket, objectPath: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  if (isPrivateBucket(bucket)) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) throw new Error(`Failed to sign URL: ${error?.message ?? "unknown"}`);
    return data.signedUrl;
  }
  return supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
  opts: { validateImage?: boolean } = {},
): Promise<{ key: string; url: string }> {
  const validateImage = opts.validateImage ?? true;
  let body: Buffer | Uint8Array | string = data;

  if (validateImage) {
    if (typeof data === "string") {
      throw new Error("Image upload must be binary data, not a string");
    }
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    if (buf.length > MAX_IMAGE_BYTES) {
      throw new Error(`Image too large: max ${Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))} MB`);
    }
    const sniffed = sniffImageMime(buf);
    if (!sniffed) {
      throw new Error("Unsupported image type: only JPEG, PNG, WebP, and GIF are allowed");
    }
    contentType = sniffed;
    body = buf;
  }

  const objectPath = appendHashSuffix(normalizeKey(relKey));
  const bucket = bucketForKey(objectPath);

  const supabase = getSupabaseAdmin();
  const uploadBody =
    typeof body === "string" ? body : (body instanceof Uint8Array ? body : new Uint8Array(body));
  const { error } = await supabase.storage.from(bucket).upload(objectPath, uploadBody, {
    contentType,
    upsert: false,
  });
  if (error) {
    throw new Error(`Storage upload failed (${bucket}/${objectPath}): ${error.message}`);
  }

  return { key: objectPath, url: await urlForObject(bucket, objectPath) };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: await urlForObject(bucketForKey(key), key) };
}

export async function storageGetSignedUrl(relKey: string, ttlSeconds = SIGNED_URL_TTL_SECONDS): Promise<string> {
  const key = normalizeKey(relKey);
  const bucket = bucketForKey(key);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(key, ttlSeconds);
  if (error || !data?.signedUrl) throw new Error(`Failed to sign URL: ${error?.message ?? "unknown"}`);
  return data.signedUrl;
}
