/**
 * Apple root certificate provider for App Store Server Notification
 * verification.
 *
 * `SignedDataVerifier` from `@apple/app-store-server-library` takes the trust
 * anchors as an explicit list of DER-encoded root certificates — the library
 * deliberately does not bundle them, so the application decides what it
 * trusts. This module supplies them, in priority order:
 *
 *   1. `APPLE_ROOT_CERTS_B64` — base64 DER, comma-separated. Preferred for
 *      production: the trust anchors are then pinned in configuration and the
 *      server needs no outbound egress to verify a notification.
 *   2. Fetched once from Apple's certificate authority over TLS, then cached
 *      in module scope for the life of the process (a warm serverless
 *      instance fetches at most once).
 *
 * On the fetch path, TLS itself is the bootstrap: the connection to
 * `apple.com` is validated against the OS trust store, so the bytes are known
 * to come from Apple. Certificate verification is never disabled. Each
 * fetched certificate is additionally parsed and required to be a
 * self-signed CA before it is accepted as a root, and its SHA-256
 * fingerprint is logged so it can be captured and pinned via
 * `APPLE_ROOT_CERTS_B64`.
 */
import { X509Certificate } from "crypto";
import { ENV } from "./env";

/**
 * Apple's published root CAs. G3 is the anchor for the JWS chains on App
 * Store Server Notifications; the others are included so verification keeps
 * working if Apple re-anchors a chain, which it has done historically.
 */
const APPLE_ROOT_CERT_URLS = [
  "https://www.apple.com/certificateauthority/AppleRootCA-G3.cer",
  "https://www.apple.com/certificateauthority/AppleRootCA-G2.cer",
  "https://www.apple.com/certificateauthority/AppleIncRootCertificate.cer",
];

/** Resolved roots, cached for the life of the process. */
let cached: Buffer[] | null = null;
/** In-flight fetch, so concurrent requests on a cold start share one round. */
let inFlight: Promise<Buffer[]> | null = null;

/**
 * A DER buffer is only accepted as a trust anchor if it parses as an X.509
 * certificate that is self-signed — i.e. it really is a root, not an
 * intermediate or leaf that happened to be served.
 */
function isSelfSignedRoot(der: Buffer): boolean {
  try {
    const cert = new X509Certificate(der);
    return cert.verify(cert.publicKey);
  } catch {
    return false;
  }
}

function fingerprint(der: Buffer): string {
  try {
    return new X509Certificate(der).fingerprint256;
  } catch {
    return "<unparseable>";
  }
}

function fromEnv(): Buffer[] | null {
  if (ENV.appleRootCertsB64.length === 0) return null;
  const roots = ENV.appleRootCertsB64
    .map(b64 => Buffer.from(b64, "base64"))
    .filter(der => {
      if (isSelfSignedRoot(der)) return true;
      console.error("[AppleRoots] APPLE_ROOT_CERTS_B64 entry is not a self-signed root — ignoring");
      return false;
    });
  if (roots.length === 0) {
    console.error("[AppleRoots] APPLE_ROOT_CERTS_B64 was set but contained no usable roots");
    return null;
  }
  console.log(`[AppleRoots] Using ${roots.length} pinned root certificate(s) from env`);
  return roots;
}

async function fetchRoots(): Promise<Buffer[]> {
  const roots: Buffer[] = [];
  for (const url of APPLE_ROOT_CERT_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`[AppleRoots] ${url} → HTTP ${res.status}`);
        continue;
      }
      const der = Buffer.from(await res.arrayBuffer());
      if (!isSelfSignedRoot(der)) {
        console.error(`[AppleRoots] ${url} did not yield a self-signed root — skipping`);
        continue;
      }
      roots.push(der);
      // Logged so the operator can pin these exact anchors via
      // APPLE_ROOT_CERTS_B64 and drop the runtime fetch entirely.
      console.log(`[AppleRoots] Loaded ${url} (sha256 ${fingerprint(der)})`);
    } catch (err) {
      console.error(`[AppleRoots] Failed to fetch ${url}:`, err);
    }
  }
  return roots;
}

/**
 * Apple's root certificates as DER buffers.
 *
 * @throws if no trust anchor could be established. Callers must treat that as
 * "cannot verify" and reject the notification rather than accepting it — an
 * unverifiable billing notification is not a notification.
 */
export async function getAppleRootCertificates(): Promise<Buffer[]> {
  if (cached) return cached;

  const pinned = fromEnv();
  if (pinned) {
    cached = pinned;
    return cached;
  }

  // Collapse concurrent cold-start callers onto a single fetch.
  if (!inFlight) {
    inFlight = fetchRoots().finally(() => { inFlight = null; });
  }
  const fetched = await inFlight;

  if (fetched.length === 0) {
    throw new Error(
      "No Apple root certificates available — set APPLE_ROOT_CERTS_B64 or allow outbound HTTPS to apple.com"
    );
  }
  cached = fetched;
  return cached;
}

/** Test seam: drops the cached roots so the next call re-resolves. */
export function __resetAppleRootCertsCache(): void {
  cached = null;
  inFlight = null;
}
