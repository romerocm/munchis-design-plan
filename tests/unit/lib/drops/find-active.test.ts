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
    created_at: "2026-03-15T00:00:00Z",
    updated_at: "2026-03-15T00:00:00Z",
    ...overrides,
  };
}

describe("findActiveDrop", () => {
  it("returns live drop when available", () => {
    const drops = [
      makeDrop({ id: "draft", number: 2, status: "draft" }),
      makeDrop({ id: "live", number: 1, status: "live" }),
    ];
    expect(findActiveDrop(drops)?.id).toBe("live");
  });

  it("returns closed drop when no live drop exists", () => {
    const drops = [
      makeDrop({ id: "draft", number: 2, status: "draft" }),
      makeDrop({ id: "closed", number: 1, status: "closed" }),
    ];
    expect(findActiveDrop(drops)?.id).toBe("closed");
  });

  it("returns baking drop when no live or closed", () => {
    const drops = [
      makeDrop({ id: "baking", number: 1, status: "baking" }),
      makeDrop({ id: "completed", number: 0, status: "completed" }),
    ];
    expect(findActiveDrop(drops)?.id).toBe("baking");
  });

  it("returns draft when no active drops", () => {
    const drops = [
      makeDrop({ id: "draft", number: 1, status: "draft" }),
    ];
    expect(findActiveDrop(drops)?.id).toBe("draft");
  });

  it("returns first drop as fallback for empty priority match", () => {
    const drops = [
      makeDrop({ id: "completed", number: 1, status: "completed" }),
    ];
    expect(findActiveDrop(drops)?.id).toBe("completed");
  });

  it("returns undefined for empty array", () => {
    expect(findActiveDrop([])).toBeUndefined();
  });

  it("prioritizes live over newer draft", () => {
    const drops = [
      makeDrop({ id: "newer-draft", number: 3, status: "draft" }),
      makeDrop({ id: "old-live", number: 1, status: "live" }),
      makeDrop({ id: "older-completed", number: 0, status: "completed" }),
    ];
    expect(findActiveDrop(drops)?.id).toBe("old-live");
  });
});
