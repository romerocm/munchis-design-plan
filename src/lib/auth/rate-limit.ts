/**
 * In-memory sliding-window rate limiter for login attempts.
 * Keyed by IP address. 5 attempts per 15-minute window.
 *
 * Note: in-memory only — resets on deploy/restart and is not shared
 * across instances. Sufficient for a small app with 1-2 bakers.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const MAX_ENTRIES = 100;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const attempts = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const entry = attempts.get(ip);

  // New window or expired window
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
    evictStaleEntries(now);
    return { allowed: true };
  }

  // Window still active, check limit
  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil(
      (entry.windowStart + WINDOW_MS - now) / 1000
    );
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

/** Remove expired entries when the map grows too large. */
function evictStaleEntries(now: number) {
  if (attempts.size <= MAX_ENTRIES) return;
  for (const [key, val] of attempts) {
    if (now - val.windowStart > WINDOW_MS) {
      attempts.delete(key);
    }
  }
}

/** Reset all entries (used in tests). */
export function resetRateLimiter() {
  attempts.clear();
}
