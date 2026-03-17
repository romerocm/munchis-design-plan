import type { DropStatus } from "@/types/database";

/** All valid drop statuses, in lifecycle order */
export const DROP_STATUSES = ["draft", "live", "closed", "baking", "completed"] as const;

/** Valid state transitions for drops */
export const DROP_TRANSITIONS: Record<DropStatus, DropStatus[]> = {
  draft: ["live"],
  live: ["closed"],
  closed: ["baking", "live"], // can re-open or proceed
  baking: ["completed"],
  completed: [], // terminal
};

/** Human-readable labels for drop statuses */
export const DROP_STATUS_LABELS: Record<DropStatus, string> = {
  draft: "Draft mode",
  live: "Orders are open",
  closed: "Orders closed",
  baking: "Baking in progress",
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

/** Format drop number as #01, #02, etc. */
export function formatDropNumber(n: number): string {
  return `#${String(n).padStart(2, "0")}`;
}
