import type { Drop, DropStatus } from "@/types/database";

/**
 * Find the active drop from a list, by status priority + date tiebreaking.
 * Priority: live > closed > baking > ready > scheduled > draft > completed
 *
 * Within each tier, picks the drop with the soonest relevant date.
 * Skips drops with past pickup_date for non-completed statuses.
 */
const STATUS_PRIORITY: DropStatus[] = [
  "live",
  "closed",
  "baking",
  "ready",
  "scheduled",
  "draft",
  "completed",
];

function getTodayCST(now: Date): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/El_Salvador" });
}

function pickBest(candidates: Drop[], todayCST: string, status: DropStatus): Drop | undefined {
  if (status === "completed") {
    // Most recent pickup_date first
    return candidates.sort((a, b) => b.pickup_date.localeCompare(a.pickup_date))[0];
  }

  // Filter out drops with past pickup dates for non-completed statuses
  const future = candidates.filter((d) => d.pickup_date >= todayCST);
  const pool = future.length > 0 ? future : candidates;

  if (status === "draft" || status === "scheduled") {
    // Prefer soonest future orders_open_at
    const nowISO = new Date().toISOString();
    const futureOpens = pool.filter((d) => d.orders_open_at > nowISO);
    if (futureOpens.length > 0) {
      return futureOpens.sort((a, b) => a.orders_open_at.localeCompare(b.orders_open_at))[0];
    }
    // Fallback: soonest pickup_date
    return pool.sort((a, b) => a.pickup_date.localeCompare(b.pickup_date))[0];
  }

  // live, closed, baking, ready: soonest pickup_date
  return pool.sort((a, b) => a.pickup_date.localeCompare(b.pickup_date))[0];
}

export function findActiveDrop(drops: Drop[], now?: Date): Drop | undefined {
  if (drops.length === 0) return undefined;

  const currentNow = now ?? new Date();
  const todayCST = getTodayCST(currentNow);

  for (const status of STATUS_PRIORITY) {
    const candidates = drops.filter((d) => d.status === status);
    if (candidates.length === 0) continue;

    const best = pickBest(candidates, todayCST, status);
    if (best) return best;
  }

  return drops[0]; // fallback to newest
}
