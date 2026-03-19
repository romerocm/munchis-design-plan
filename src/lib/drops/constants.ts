import type { DropStatus } from "@/types/database";

/** All valid drop statuses, in lifecycle order */
export const DROP_STATUSES = ["draft", "scheduled", "live", "closed", "baking", "ready", "completed"] as const;

/** Valid state transitions for drops */
export const DROP_TRANSITIONS: Record<DropStatus, DropStatus[]> = {
  draft: ["scheduled"],
  scheduled: ["live", "draft"],            // go live now, or demote back to draft
  live: ["closed"],
  closed: ["baking", "live"],              // proceed or reopen
  baking: ["ready", "closed"],             // mark ready or roll back
  ready: ["completed", "baking"],          // complete or roll back
  completed: ["ready"],                    // undo complete
};

/** Human-readable labels for drop statuses */
export const DROP_STATUS_LABELS: Record<DropStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  live: "Orders are open",
  closed: "Orders closed",
  baking: "Baking in progress",
  ready: "Ready for pickup",
  completed: "Drop complete",
};

/** Default values for new drops */
export const DROP_DEFAULTS = {
  price_cents: 370,
  capacity: 200,
  pickup_location: "Multiplaza",
  pickup_time_start: "14:00",
  pickup_time_end: "16:00",
  flavor_name: "New Flavor",
  flavor_color: "#5C3D2E",
} as const;

/** Fields required to schedule a drop */
export const SCHEDULE_REQUIRED_FIELDS = [
  "flavor_name",
  "pickup_date",
  "pickup_time_start",
  "pickup_time_end",
  "orders_open_at",
  "orders_close_at",
  "price_cents",
  "capacity",
] as const;

/** Check if a drop has all required fields to be scheduled */
export function canScheduleDrop(drop: Record<string, unknown>): { ready: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const field of SCHEDULE_REQUIRED_FIELDS) {
    const val = drop[field];
    if (val === null || val === undefined || val === "" || val === 0) {
      missing.push(field);
    }
  }
  // flavor_name "New Flavor" is a default — should be customized
  if (drop.flavor_name === "New Flavor") {
    missing.push("flavor_name");
  }
  return { ready: missing.length === 0, missing: [...new Set(missing)] };
}

/** Human-readable field names for validation messages */
export const FIELD_LABELS: Record<string, string> = {
  flavor_name: "Flavor name",
  pickup_date: "Pickup date",
  pickup_time_start: "Pickup start time",
  pickup_time_end: "Pickup end time",
  orders_open_at: "Orders open date",
  orders_close_at: "Orders close date",
  price_cents: "Price",
  capacity: "Capacity",
};

/** Format drop number as #01, #02, etc. */
export function formatDropNumber(n: number): string {
  return `#${String(n).padStart(2, "0")}`;
}
