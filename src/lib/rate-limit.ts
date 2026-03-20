/**
 * In-memory sliding window rate limiter.
 * Each key (e.g. IP address) tracks timestamps of recent requests.
 * Old entries are pruned automatically every 60 seconds.
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number; // Unix ms when the window resets
}

interface RateLimitConfig {
  /** Max requests allowed within the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

const DEFAULT_CLEANUP_INTERVAL_MS = 60_000;

export class RateLimiter {
  private hits = new Map<string, number[]>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Start automatic cleanup of expired entries.
   * Call this once when the limiter is used in a long-lived process.
   */
  startCleanup(intervalMs = DEFAULT_CLEANUP_INTERVAL_MS) {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => this.prune(), intervalMs);
    // Allow Node to exit even if interval is running
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Check and record a request for the given key.
   */
  check(key: string, now = Date.now()): RateLimitResult {
    const { limit, windowMs } = this.config;
    const windowStart = now - windowMs;

    let timestamps = this.hits.get(key);
    if (timestamps) {
      // Remove timestamps outside the current window
      timestamps = timestamps.filter((t) => t > windowStart);
    } else {
      timestamps = [];
    }

    const allowed = timestamps.length < limit;
    if (allowed) {
      timestamps.push(now);
    }

    this.hits.set(key, timestamps);

    const oldest = timestamps[0] ?? now;
    const resetAt = oldest + windowMs;
    const remaining = Math.max(0, limit - timestamps.length);

    return { allowed, remaining, limit, resetAt };
  }

  /** Remove all entries with no timestamps in the current window */
  prune(now = Date.now()) {
    const windowStart = now - this.config.windowMs;
    for (const [key, timestamps] of this.hits) {
      const valid = timestamps.filter((t) => t > windowStart);
      if (valid.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, valid);
      }
    }
  }

  /** Reset all state (used in tests) */
  reset() {
    this.hits.clear();
  }

  get size() {
    return this.hits.size;
  }
}

// Pre-configured limiters for each endpoint tier
const WINDOW_MS = 60_000; // 1 minute

export const limiters = {
  strict: new RateLimiter({ limit: 5, windowMs: WINDOW_MS }),
  webhook: new RateLimiter({ limit: 30, windowMs: WINDOW_MS }),
  cron: new RateLimiter({ limit: 10, windowMs: WINDOW_MS }),
  auth: new RateLimiter({ limit: 60, windowMs: WINDOW_MS }),
  default: new RateLimiter({ limit: 30, windowMs: WINDOW_MS }),
};

// Start cleanup for all limiters
for (const limiter of Object.values(limiters)) {
  limiter.startCleanup();
}

/**
 * Determine which rate limiter tier to use for a given pathname + method.
 */
export function getTier(
  pathname: string,
  method: string
): keyof typeof limiters {
  if (pathname === "/api/orders" && method === "POST") return "strict";
  if (pathname.startsWith("/api/webhooks/")) return "webhook";
  if (pathname.startsWith("/api/cron/")) return "cron";
  if (pathname.startsWith("/api/parrot/")) return "auth";
  return "default";
}
