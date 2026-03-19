import { describe, it, expect } from "vitest";
import {
  DROP_STATUSES,
  DROP_TRANSITIONS,
  DROP_STATUS_LABELS,
  DROP_DEFAULTS,
  SCHEDULE_REQUIRED_FIELDS,
  canScheduleDrop,
  formatDropNumber,
} from "@/lib/drops/constants";

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
  it("allows draft -> scheduled only", () => {
    expect(DROP_TRANSITIONS.draft).toEqual(["scheduled"]);
  });

  it("allows scheduled -> live or back to draft", () => {
    expect(DROP_TRANSITIONS.scheduled).toContain("live");
    expect(DROP_TRANSITIONS.scheduled).toContain("draft");
    expect(DROP_TRANSITIONS.scheduled).toHaveLength(2);
  });

  it("allows live -> closed only", () => {
    expect(DROP_TRANSITIONS.live).toEqual(["closed"]);
  });

  it("allows closed -> baking or re-open to live", () => {
    expect(DROP_TRANSITIONS.closed).toContain("baking");
    expect(DROP_TRANSITIONS.closed).toContain("live");
  });

  it("allows baking -> ready or back to closed", () => {
    expect(DROP_TRANSITIONS.baking).toEqual(["ready", "closed"]);
  });

  it("allows ready -> completed or back to baking", () => {
    expect(DROP_TRANSITIONS.ready).toEqual(["completed", "baking"]);
  });

  it("allows completed -> back to ready", () => {
    expect(DROP_TRANSITIONS.completed).toEqual(["ready"]);
  });

  it("every status has a transition entry", () => {
    for (const status of DROP_STATUSES) {
      expect(DROP_TRANSITIONS).toHaveProperty(status);
    }
  });
});

describe("DROP_STATUS_LABELS", () => {
  it("has a label for every status", () => {
    for (const status of DROP_STATUSES) {
      expect(DROP_STATUS_LABELS[status]).toBeDefined();
      expect(typeof DROP_STATUS_LABELS[status]).toBe("string");
    }
  });
});

describe("SCHEDULE_REQUIRED_FIELDS", () => {
  it("has exactly 8 required fields", () => {
    expect(SCHEDULE_REQUIRED_FIELDS).toHaveLength(8);
  });

  it("includes all critical scheduling fields", () => {
    expect(SCHEDULE_REQUIRED_FIELDS).toContain("flavor_name");
    expect(SCHEDULE_REQUIRED_FIELDS).toContain("pickup_date");
    expect(SCHEDULE_REQUIRED_FIELDS).toContain("orders_open_at");
    expect(SCHEDULE_REQUIRED_FIELDS).toContain("orders_close_at");
    expect(SCHEDULE_REQUIRED_FIELDS).toContain("price_cents");
    expect(SCHEDULE_REQUIRED_FIELDS).toContain("capacity");
  });
});

describe("canScheduleDrop", () => {
  const validDrop = {
    flavor_name: "Chocolate Chip",
    pickup_date: "2026-03-22",
    pickup_time_start: "14:00",
    pickup_time_end: "16:00",
    orders_open_at: "2026-03-16T14:00:00Z",
    orders_close_at: "2026-03-20T06:00:00Z",
    price_cents: 370,
    capacity: 200,
  };

  it("returns ready=true when all fields are present", () => {
    const result = canScheduleDrop(validDrop);
    expect(result.ready).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("returns missing fields when some are null", () => {
    const result = canScheduleDrop({ ...validDrop, pickup_date: null });
    expect(result.ready).toBe(false);
    expect(result.missing).toContain("pickup_date");
  });

  it("returns missing fields when some are empty string", () => {
    const result = canScheduleDrop({ ...validDrop, flavor_name: "" });
    expect(result.ready).toBe(false);
    expect(result.missing).toContain("flavor_name");
  });

  it("returns missing fields when some are zero", () => {
    const result = canScheduleDrop({ ...validDrop, price_cents: 0 });
    expect(result.ready).toBe(false);
    expect(result.missing).toContain("price_cents");
  });

  it("rejects default 'New Flavor' as incomplete", () => {
    const result = canScheduleDrop({ ...validDrop, flavor_name: "New Flavor" });
    expect(result.ready).toBe(false);
    expect(result.missing).toContain("flavor_name");
  });

  it("deduplicates when 'New Flavor' is the default name", () => {
    const result = canScheduleDrop({ ...validDrop, flavor_name: "New Flavor" });
    // Should not have flavor_name twice
    const count = result.missing.filter((f) => f === "flavor_name").length;
    expect(count).toBe(1);
  });

  it("returns all missing fields at once", () => {
    const result = canScheduleDrop({});
    expect(result.ready).toBe(false);
    expect(result.missing.length).toBeGreaterThanOrEqual(8);
  });
});
