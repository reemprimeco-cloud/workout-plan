/**
 * Image Proxy — /api/img/:key
 *
 * The platform intercepts /manus-storage/* on production and returns a 307
 * redirect to a signed CloudFront URL. Safari/iOS PWA blocks cross-origin
 * 307 redirects for <img> tags, causing broken images.
 *
 * This proxy sits under /api/ which is NOT intercepted by the platform CDN.
 * It fetches the presigned URL from Forge and pipes the image bytes directly
 * to the client — no redirect, works on all browsers including Safari.
 */
import type { Express } from "express";
import { ENV } from "./env";

export function registerImageProxy(app: Express) {
  app.get("/api/img/:key(*)", async (req, res) => {
    const key = req.params.key;
    if (!key) {
      res.status(400).send("Missing image key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Image proxy not configured");
      return;
    }

    try {
      // Get presigned GET URL from Forge
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[ImageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      // Fetch image bytes from S3 and pipe directly — no redirect
      const imageResp = await fetch(url);
      if (!imageResp.ok) {
        console.error(`[ImageProxy] S3 fetch error: ${imageResp.status}`);
        res.status(502).send("Image fetch error");
        return;
      }

      const contentType = imageResp.headers.get("content-type") || "image/jpeg";
      const contentLength = imageResp.headers.get("content-length");

      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=604800, immutable"); // 7-day cache
      res.set("Access-Control-Allow-Origin", "*");
      if (contentLength) res.set("Content-Length", contentLength);

      const buffer = await imageResp.arrayBuffer();
      res.status(200).end(Buffer.from(buffer));
    } catch (err) {
      console.error("[ImageProxy] failed:", err);
      res.status(502).send("Image proxy error");
    }
  });
}
