import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiter, getTier } from "@/lib/rate-limit";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ limit: 3, windowMs: 60_000 });
  });

  it("allows requests within the limit", () => {
    const r1 = limiter.check("ip1");
    const r2 = limiter.check("ip1");
    const r3 = limiter.check("ip1");

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests exceeding the limit", () => {
    limiter.check("ip1");
    limiter.check("ip1");
    limiter.check("ip1");
    const r4 = limiter.check("ip1");

    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("tracks keys independently", () => {
    limiter.check("ip1");
    limiter.check("ip1");
    limiter.check("ip1");

    const r = limiter.check("ip2");
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(2);
  });

  it("allows requests again after window expires", () => {
    const now = 1000000;
    limiter.check("ip1", now);
    limiter.check("ip1", now + 100);
    limiter.check("ip1", now + 200);

    // Still blocked within window
    expect(limiter.check("ip1", now + 300).allowed).toBe(false);

    // After window passes, allowed again
    const afterWindow = now + 60_001;
    expect(limiter.check("ip1", afterWindow).allowed).toBe(true);
  });

  it("returns correct resetAt timestamp", () => {
    const now = 1000000;
    limiter.check("ip1", now);
    const r2 = limiter.check("ip1", now + 500);

    // Reset should be based on the oldest timestamp in the window
    expect(r2.resetAt).toBe(now + 60_000);
  });

  it("prune removes expired entries", () => {
    const now = 1000000;
    limiter.check("ip1", now);
    limiter.check("ip2", now);

    expect(limiter.size).toBe(2);

    // Prune after window expires
    limiter.prune(now + 60_001);
    expect(limiter.size).toBe(0);
  });

  it("prune keeps entries with valid timestamps", () => {
    const now = 1000000;
    limiter.check("ip1", now);
    limiter.check("ip2", now + 30_000);

    // Prune at a time where ip1 is expired but ip2 is still valid
    limiter.prune(now + 60_001);
    expect(limiter.size).toBe(1);
  });

  it("reset clears all state", () => {
    limiter.check("ip1");
    limiter.check("ip2");
    limiter.reset();
    expect(limiter.size).toBe(0);
  });
});

describe("getTier", () => {
  it("returns strict for POST /api/orders", () => {
    expect(getTier("/api/orders", "POST")).toBe("strict");
  });

  it("returns default for GET /api/orders (non-POST)", () => {
    expect(getTier("/api/orders", "GET")).toBe("default");
  });

  it("returns webhook for webhook routes", () => {
    expect(getTier("/api/webhooks/wompi", "POST")).toBe("webhook");
    expect(getTier("/api/webhooks/twilio", "POST")).toBe("webhook");
  });

  it("returns cron for cron routes", () => {
    expect(getTier("/api/cron/last-call", "GET")).toBe("cron");
  });

  it("returns auth for parrot routes", () => {
    expect(getTier("/api/parrot/drops", "GET")).toBe("auth");
    expect(getTier("/api/parrot/recipes/123", "PATCH")).toBe("auth");
  });

  it("returns default for health and other routes", () => {
    expect(getTier("/api/health", "GET")).toBe("default");
    expect(getTier("/api/notify", "POST")).toBe("default");
  });
});
