import { describe, it, expect } from "vitest";
import { DROP_STATUSES, DROP_TRANSITIONS, formatDropNumber } from "@/lib/drops/constants";

describe("formatDropNumber", () => {
  it("pads single digit with zero", () => {
    expect(formatDropNumber(1)).toBe("#01");
    expect(formatDropNumber(9)).toBe("#09");
  });

  it("preserves double digits", () => {
    expect(formatDropNumber(10)).toBe("#10");
    expect(formatDropNumber(99)).toBe("#99");
  });

  it("handles triple digits", () => {
    expect(formatDropNumber(100)).toBe("#100");
  });
});

describe("DROP_TRANSITIONS", () => {
  it("allows draft -> live only", () => {
    expect(DROP_TRANSITIONS.draft).toEqual(["live"]);
  });

  it("allows live -> closed only", () => {
    expect(DROP_TRANSITIONS.live).toEqual(["closed"]);
  });

  it("allows closed -> baking or re-open to live", () => {
    expect(DROP_TRANSITIONS.closed).toContain("baking");
    expect(DROP_TRANSITIONS.closed).toContain("live");
  });

  it("allows baking -> completed only", () => {
    expect(DROP_TRANSITIONS.baking).toEqual(["completed"]);
  });

  it("completed is terminal (no transitions)", () => {
    expect(DROP_TRANSITIONS.completed).toEqual([]);
  });

  it("every status has a transition entry", () => {
    for (const status of DROP_STATUSES) {
      expect(DROP_TRANSITIONS).toHaveProperty(status);
    }
  });
});
