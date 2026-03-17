import type { Drop, DropStatus } from "@/types/database";

/**
 * Find the active drop from a list, by status priority.
 * Priority: live > closed > baking > draft > completed
 */
const STATUS_PRIORITY: DropStatus[] = ["live", "closed", "baking", "draft", "completed"];

export function findActiveDrop(drops: Drop[]): Drop | undefined {
  for (const status of STATUS_PRIORITY) {
    const found = drops.find((d) => d.status === status);
    if (found) return found;
  }
  return drops[0]; // fallback to newest
}
