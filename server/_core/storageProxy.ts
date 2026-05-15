import type { Express } from "express";
import { ENV } from "./env";

/**
 * Storage proxy that pipes image content through the server
 * instead of using 307 redirects (which break on iOS Safari).
 *
 * Flow: browser → our server → CloudFront signed URL → pipe bytes back
 * Adds Cache-Control so browsers cache the result and avoid repeated fetches.
 */
export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      // Step 1: Get the signed URL from the forge API
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
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      // Step 2: Fetch the actual file from CloudFront and pipe it through
      const fileResp = await fetch(url);
      if (!fileResp.ok || !fileResp.body) {
        console.error(`[StorageProxy] file fetch error: ${fileResp.status}`);
        res.status(502).send("Failed to fetch file from storage");
        return;
      }

      // Forward content-type from the upstream response
      const contentType = fileResp.headers.get("content-type");
      if (contentType) {
        res.set("Content-Type", contentType);
      }

      // Forward content-length if available
      const contentLength = fileResp.headers.get("content-length");
      if (contentLength) {
        res.set("Content-Length", contentLength);
      }

      // Cache for 1 day in browser, 7 days on CDN — avoids repeated proxy fetches
      res.set("Cache-Control", "public, max-age=86400, s-maxage=604800");
      res.set("Access-Control-Allow-Origin", "*");

      // Pipe the response body to the client using ReadableStream
      const reader = (fileResp.body as ReadableStream<Uint8Array>).getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            return;
          }
          if (!res.write(value)) {
            await new Promise<void>((resolve) => res.once("drain", resolve));
          }
        }
      };
      await pump();
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      if (!res.headersSent) {
        res.status(502).send("Storage proxy error");
      }
    }
  });
}
