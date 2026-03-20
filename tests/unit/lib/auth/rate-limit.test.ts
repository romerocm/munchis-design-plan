import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimiter } from "@/lib/auth/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it("allows the first attempt", () => {
    const result = checkRateLimit("1.2.3.4");
    expect(result.allowed).toBe(true);
  });

  it("allows up to 5 attempts", () => {
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit("1.2.3.4");
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks the 6th attempt", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("1.2.3.4");
    }
    const result = checkRateLimit("1.2.3.4");
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("tracks different IPs independently", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("1.2.3.4");
    }
    // Different IP should still be allowed
    const result = checkRateLimit("5.6.7.8");
    expect(result.allowed).toBe(true);
  });

  it("returns retryAfter in seconds", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("1.2.3.4");
    }
    const result = checkRateLimit("1.2.3.4");
    expect(result.retryAfter).toBeLessThanOrEqual(15 * 60);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("resets after resetRateLimiter", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("1.2.3.4");
    }
    resetRateLimiter();
    const result = checkRateLimit("1.2.3.4");
    expect(result.allowed).toBe(true);
  });
});
