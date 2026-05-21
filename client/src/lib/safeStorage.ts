/**
 * safeStorage — localStorage wrapper that never throws
 *
 * Instagram, Snapchat, TikTok, Facebook in-app browsers (WebViews) frequently:
 *   - Throw SecurityError on localStorage access
 *   - Block cookies with SameSite restrictions
 *   - Lack crypto.randomUUID() in older WebView versions
 *
 * This module silently falls back to an in-memory Map so the app never crashes.
 * Data won't persist across sessions in those browsers, but the app still works.
 */

const mem = new Map<string, string>();
let _available: boolean | null = null;

function available(): boolean {
  if (_available !== null) return _available;
  try {
    const k = "__pf_test__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    _available = true;
  } catch {
    _available = false;
  }
  return _available;
}

export const safeStorage = {
  getItem(key: string): string | null {
    if (available()) { try { return localStorage.getItem(key); } catch { /**/ } }
    return mem.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    if (available()) { try { localStorage.setItem(key, value); return; } catch { /**/ } }
    mem.set(key, value);
  },
  removeItem(key: string): void {
    if (available()) { try { localStorage.removeItem(key); } catch { /**/ } }
    mem.delete(key);
  },
  keys(): string[] {
    if (available()) { try { return Object.keys(localStorage); } catch { /**/ } }
    return Array.from(mem.keys());
  },
};
