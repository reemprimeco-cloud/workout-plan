/**
 * Image Proxy — GET /api/img/:key
 *
 * Serves image bytes from Supabase Storage under the same-origin /api/ path so
 * <img> tags work on iOS Safari / PWA (no cross-origin redirect). The key is a
 * storage object path; its bucket is derived from the key prefix.
 *
 * New uploads return absolute Supabase URLs directly (storagePut), so this
 * proxy mainly serves keys referenced as /api/img/<key>. Private buckets
 * (health-reports) are NOT served here — they require signed URLs.
 */
import type { Express } from "express";
import { getSupabaseAdmin } from "./supabase";
import { bucketForKey, isPrivateBucket } from "../storage";

export function registerImageProxy(app: Express) {
  app.get("/api/img/:key(*)", async (req, res) => {
    const key = req.params.key;
    if (!key) {
      res.status(400).send("Missing image key");
      return;
    }

    const bucket = bucketForKey(key);
    if (isPrivateBucket(bucket)) {
      // Private objects must be accessed via a signed URL, not this public proxy.
      res.status(403).send("Forbidden");
      return;
    }

    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.storage.from(bucket).download(key);
      if (error || !data) {
        console.error(`[ImageProxy] download error (${bucket}/${key}):`, error?.message);
        res.status(404).send("Not found");
        return;
      }

      const contentType = data.type || "image/jpeg";
      const buffer = Buffer.from(await data.arrayBuffer());

      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=604800, immutable");
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Content-Length", String(buffer.length));
      res.status(200).end(buffer);
    } catch (err) {
      console.error("[ImageProxy] failed:", err);
      res.status(502).send("Image proxy error");
    }
  });
}
