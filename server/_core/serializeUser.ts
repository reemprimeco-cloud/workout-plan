import type { User } from "../../drizzle/schema";

/** A user row with its `numeric` columns narrowed to numbers for the wire. */
export type SerializedUser<T extends User> = Omit<T, "currentWeight" | "targetWeight"> & {
  currentWeight: number | null;
  targetWeight: number | null;
};

/**
 * Prepare a users row for a client.
 *
 * `currentWeight` and `targetWeight` are Postgres `numeric`, which the driver
 * returns as **strings** — JS numbers can't hold arbitrary-precision decimals,
 * so Drizzle types them `string` and postgres-js hands back "75.50". Anything
 * that returns a raw user row therefore ships a string where a client
 * reasonably expects a number.
 *
 * That cost a user the ability to log in: the iOS client declares these as
 * `Double?`, so `auth.me` failed to decode for anyone who had ever saved a
 * weight, and the app reported "Unrecognized response (HTTP 200)" — a message
 * that points nowhere near a numeric column. Accounts with no weight set were
 * unaffected, which is why it looked like an intermittent auth failure.
 *
 * `userProfile.getProfile` already converted these inline; this centralises the
 * same rule so the next endpoint that returns a user doesn't have to rediscover
 * it. Generic over the row type so callers keep any extra fields they carry.
 */
export function serializeUser<T extends User>(user: T): SerializedUser<T>;
export function serializeUser<T extends User>(user: T | null): SerializedUser<T> | null;
export function serializeUser<T extends User>(user: T | null): SerializedUser<T> | null {
  if (!user) return null;
  return {
    ...user,
    currentWeight: numericToNumber(user.currentWeight),
    targetWeight: numericToNumber(user.targetWeight),
  };
}

/**
 * Returns null rather than NaN for an unparseable value: NaN serialises to
 * `null` in JSON anyway, and producing it here would let a corrupt row travel
 * as a number-shaped value that breaks arithmetic downstream instead of
 * reading as "not set".
 */
function numericToNumber(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
