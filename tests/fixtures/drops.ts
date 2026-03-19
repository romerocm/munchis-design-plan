import type { Drop } from "@/types/database";

let counter = 0;

export function makeDrop(overrides: Partial<Drop> = {}): Drop {
  counter++;
  const now = new Date().toISOString();
  return {
    id: `drop-${counter}-${Date.now()}`,
    number: counter,
    status: "draft",
    flavor_name: "Chocolate Chip Cookies",
    flavor_description: "Classic cookies with dark chocolate chips",
    flavor_color: "#5C3D2E",
    price_cents: 370,
    capacity: 200,
    pickup_location: "Multiplaza",
    pickup_date: "2026-03-22",
    pickup_time_start: "14:00",
    pickup_time_end: "16:00",
    orders_open_at: "2026-03-16T14:00:00.000Z",
    orders_close_at: "2026-03-20T06:00:00.000Z",
    closed_at: null,
    groceries_bought_at: null,
    recipe_id: null,
    hero_image_url: null,
    flavor_image_url: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function makeLiveDrop(overrides: Partial<Drop> = {}): Drop {
  const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  return makeDrop({
    status: "live",
    pickup_date: future,
    orders_open_at: new Date(Date.now() - 86400000).toISOString(),
    orders_close_at: new Date(Date.now() + 3 * 86400000).toISOString(),
    ...overrides,
  });
}

export function makeScheduledDrop(overrides: Partial<Drop> = {}): Drop {
  return makeDrop({
    status: "scheduled",
    orders_open_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    orders_close_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    ...overrides,
  });
}

export function makeCompletedDrop(overrides: Partial<Drop> = {}): Drop {
  const past = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  return makeDrop({
    status: "completed",
    pickup_date: past,
    orders_open_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    orders_close_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    closed_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    ...overrides,
  });
}
