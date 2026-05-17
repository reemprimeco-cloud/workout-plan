/**
 * deviceId.ts
 * Generates and persists a stable device identifier in localStorage.
 * Used for single-device enforcement: each browser/device gets a unique UUID
 * that is sent with every API request via the x-device-id header.
 */

const DEVICE_ID_KEY = "primefit_device_id";

/**
 * Returns the persistent device ID for this browser.
 * Creates and stores a new UUID if one does not already exist.
 */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    // Fallback: generate a random ID without persisting (e.g., in private mode)
    return crypto.randomUUID();
  }
}
