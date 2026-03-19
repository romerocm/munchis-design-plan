import { describe, it, expect } from "vitest";
import { findActiveDrop } from "@/lib/drops/find-active";
import type { Drop } from "@/types/database";

function makeDrop(overrides: Partial<Drop> = {}): Drop {
  return {
    id: "test-id",
    number: 1,
    status: "draft",
    flavor_name: "Test",
    flavor_description: null,
    flavor_color: "#000",
    price_cents: 370,
    capacity: 200,
    pickup_location: "Test",
    pickup_date: "2026-03-22",
    pickup_time_start: "14:00",
    pickup_time_end: "16:00",
    orders_open_at: "2026-03-16T00:00:00Z",
    orders_close_at: "2026-03-19T00:00:00Z",
    hero_image_url: null,
    flavor_image_url: null,
    closed_at: null,
    groceries_bought_at: null,
    recipe_id: null,
    created_at: "2026-03-15T00:00:00Z",
    updated_at: "2026-03-15T00:00:00Z",
    ...overrides,
  };
}

// Fix "now" for deterministic tests
const NOW = new Date("2026-03-18T12:00:00Z");

describe("findActiveDrop", () => {
  it("returns live drop when available", () => {
    const drops = [
      makeDrop({ id: "draft", number: 2, status: "draft" }),
      makeDrop({ id: "live", number: 1, status: "live" }),
    ];
    expect(findActiveDrop(drops, NOW)?.id).toBe("live");
  });

  it("returns closed drop when no live drop exists", () => {
    const drops = [
      makeDrop({ id: "draft", number: 2, status: "draft" }),
      makeDrop({ id: "closed", number: 1, status: "closed" }),
    ];
    expect(findActiveDrop(drops, NOW)?.id).toBe("closed");
  });

  it("returns baking drop when no live or closed", () => {
    const drops = [
      makeDrop({ id: "baking", number: 1, status: "baking" }),
      makeDrop({ id: "completed", number: 0, status: "completed" }),
    ];
    expect(findActiveDrop(drops, NOW)?.id).toBe("baking");
  });

  it("returns ready drop when no live, closed, or baking", () => {
    const drops = [
      makeDrop({ id: "ready", number: 1, status: "ready" }),
      makeDrop({ id: "draft", number: 2, status: "draft" }),
      makeDrop({ id: "completed", number: 0, status: "completed" }),
    ];
    expect(findActiveDrop(drops, NOW)?.id).toBe("ready");
  });

  it("returns draft when no active drops", () => {
    const drops = [makeDrop({ id: "draft", number: 1, status: "draft" })];
    expect(findActiveDrop(drops, NOW)?.id).toBe("draft");
  });

  it("returns completed as fallback", () => {
    const drops = [makeDrop({ id: "completed", number: 1, status: "completed" })];
    expect(findActiveDrop(drops, NOW)?.id).toBe("completed");
  });

  it("returns undefined for empty array", () => {
    expect(findActiveDrop([], NOW)).toBeUndefined();
  });

  it("prioritizes live over newer draft", () => {
    const drops = [
      makeDrop({ id: "newer-draft", number: 3, status: "draft" }),
      makeDrop({ id: "old-live", number: 1, status: "live" }),
      makeDrop({ id: "older-completed", number: 0, status: "completed" }),
    ];
    expect(findActiveDrop(drops, NOW)?.id).toBe("old-live");
  });

  // ── Date-aware tests ──

  it("picks soonest draft by future orders_open_at", () => {
    const drops = [
      makeDrop({
        id: "april-draft",
        number: 3,
        status: "draft",
        orders_open_at: "2026-04-05T00:00:00Z",
        pickup_date: "2026-04-12",
      }),
      makeDrop({
        id: "march-draft",
        number: 2,
        status: "draft",
        orders_open_at: "2026-03-20T00:00:00Z",
        pickup_date: "2026-03-22",
      }),
    ];
    expect(findActiveDrop(drops, NOW)?.id).toBe("march-draft");
  });

  it("skips draft with past pickup_date", () => {
    const drops = [
      makeDrop({
        id: "past-draft",
        number: 2,
        status: "draft",
        pickup_date: "2026-03-10",
        orders_open_at: "2026-03-05T00:00:00Z",
      }),
      makeDrop({
        id: "future-draft",
        number: 1,
        status: "draft",
        pickup_date: "2026-04-05",
        orders_open_at: "2026-04-01T00:00:00Z",
      }),
    ];
    expect(findActiveDrop(drops, NOW)?.id).toBe("future-draft");
  });

  it("scheduled takes priority over draft", () => {
    const drops = [
      makeDrop({ id: "draft-1", number: 2, status: "draft" }),
      makeDrop({
        id: "scheduled-1",
        number: 1,
        status: "scheduled",
        orders_open_at: "2026-03-20T00:00:00Z",
        pickup_date: "2026-03-25",
      }),
    ];
    expect(findActiveDrop(drops, NOW)?.id).toBe("scheduled-1");
  });

  it("picks soonest live drop by pickup_date", () => {
    const drops = [
      makeDrop({ id: "later-live", number: 2, status: "live", pickup_date: "2026-03-30" }),
      makeDrop({ id: "sooner-live", number: 1, status: "live", pickup_date: "2026-03-22" }),
    ];
    expect(findActiveDrop(drops, NOW)?.id).toBe("sooner-live");
  });

  it("picks most recent completed drop", () => {
    const drops = [
      makeDrop({ id: "old-completed", number: 1, status: "completed", pickup_date: "2026-02-15" }),
      makeDrop({ id: "recent-completed", number: 2, status: "completed", pickup_date: "2026-03-10" }),
    ];
    expect(findActiveDrop(drops, NOW)?.id).toBe("recent-completed");
  });
});
