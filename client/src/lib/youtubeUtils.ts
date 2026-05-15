/**
 * YouTube thumbnail helper
 * Gets the best available thumbnail from a YouTube URL.
 * Uses img.youtube.com — free, no API key, always available.
 * Quality: maxresdefault (1280px) → hqdefault (480px) → mqdefault (320px)
 */

/** Extract video ID from any YouTube URL format */
export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

/** Get YouTube thumbnail URL — hqdefault is safest (always exists) */
export function getYouTubeThumbnail(url: string, quality: "hq" | "mq" | "max" = "hq"): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  const q = quality === "max" ? "maxresdefault" : quality === "hq" ? "hqdefault" : "mqdefault";
  return `https://img.youtube.com/vi/${id}/${q}.jpg`;
}

/**
 * Fallback Unsplash images for category thumbnails (no API key, free)
 * Using fixed Unsplash photo IDs — stable URLs.
 */
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  warmup:    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=640&q=80",
  treadmill: "https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?w=640&q=80",
  rower:     "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=640&q=80",
  elliptical:"https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=640&q=80",
  cardio:    "https://images.unsplash.com/photo-1538805060514-97d9cc172144?w=640&q=80",
  glutes:    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=640&q=80",
  lunges:    "https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=640&q=80",
  deadlift:  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=640&q=80",
  arms:      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=640&q=80",
  lat:       "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=640&q=80",
  plank:     "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=640&q=80",
  abs:       "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=640&q=80",
  chest:     "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=640&q=80",
  shoulder:  "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=640&q=80",
  absGlutes: "https://images.unsplash.com/photo-1544216717-3bbf52512659?w=640&q=80",
  glute2:    "https://images.unsplash.com/photo-1598971639058-fab3c3109a73?w=640&q=80",
  sauna:     "https://images.unsplash.com/photo-1554488383-03f54e78a87c?w=640&q=80",
  aqua:      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=640&q=80",
  // Machine exercises
  "shoulder-press":  "https://images.unsplash.com/photo-1590239926044-4131b5d057e9?w=640&q=80",
  "lateral-raise":   "https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?w=640&q=80",
  "chest-press":     "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=640&q=80",
  "pec-deck":        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=640&q=80",
  "bicep-curl":      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=640&q=80",
  "lat-pulldown":    "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=640&q=80",
  "seated-row":      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=640&q=80",
  "back-extension":  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=640&q=80",
  "leg-press":       "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=640&q=80",
  "leg-extension":   "https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=640&q=80",
  "leg-curl":        "https://images.unsplash.com/photo-1598971639058-fab3c3109a73?w=640&q=80",
  "calf-raise":      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=640&q=80",
  default:           "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=640&q=80",
};

/**
 * Get the best image for an exercise:
 * 1. YouTube thumbnail (from youtubeUrl)
 * 2. Category fallback from Unsplash
 * 3. Generic fitness fallback
 */
export function getExerciseImage(youtubeUrl?: string, categoryKey?: string): string {
  if (youtubeUrl) {
    const thumb = getYouTubeThumbnail(youtubeUrl, "hq");
    if (thumb) return thumb;
  }
  if (categoryKey && CATEGORY_FALLBACK_IMAGES[categoryKey]) {
    return CATEGORY_FALLBACK_IMAGES[categoryKey];
  }
  return CATEGORY_FALLBACK_IMAGES.default;
}
