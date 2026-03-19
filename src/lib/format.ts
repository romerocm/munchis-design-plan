/** Format cents to dollar string: $3.70 or $67 */
export function formatCents(cents: number, decimals: 0 | 2 = 2): string {
  return `$${(cents / 100).toFixed(decimals)}`;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Extract year/month/day from a date string without any timezone conversion.
 * Works with "2026-03-21" (date-only) and "2026-03-21T..." (ISO datetime, extracts date part).
 */
function ymd(dateStr: string): [number, number, number] {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return [+match[1], +match[2] - 1, +match[3]];
  // Fallback for unexpected formats
  const d = new Date(dateStr);
  return [d.getFullYear(), d.getMonth(), d.getDate()];
}

/**
 * Parse a date string into year/month/day without timezone shift.
 * Only use this when you need a Date object for comparisons.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = ymd(dateStr);
  return new Date(y, m, d);
}

/** Get the weekday name for a date string. Pure string math — no timezone issues. */
export function formatDay(dateStr: string): string {
  const [y, m, d] = ymd(dateStr);
  return DAYS[new Date(y, m, d).getDay()];
}

/** Shift a date string by N days and return the weekday name. Pure string math. */
export function formatDayOffset(dateStr: string, days: number): string {
  const [y, m, d] = ymd(dateStr);
  const shifted = new Date(y, m, d + days);
  return DAYS[shifted.getDay()];
}

/**
 * El Salvador is always CST (UTC-6, no DST).
 * Convert a UTC ISO string to { date: "YYYY-MM-DD", time: "HH:MM" } in CST.
 */
export function utcToCST(isoStr: string): { date: string; time: string } {
  const d = new Date(isoStr);
  // Format in CST
  const parts = d.toLocaleString("en-CA", { timeZone: "America/El_Salvador", hour12: false }).split(", ");
  // en-CA gives "YYYY-MM-DD, HH:MM:SS"
  const date = parts[0]; // "2026-03-19"
  const rawTime = (parts[1] || "00:00:00").slice(0, 5);
  // Some locales return "24:00" for midnight — normalize to "00:00"
  const time = rawTime === "24:00" ? "00:00" : rawTime;
  return { date, time };
}

/**
 * Build a UTC ISO string from a CST date + time.
 * E.g. cstToUTC("2026-03-19", "23:59") → "2026-03-20T05:59:00.000Z"
 */
export function cstToUTC(date: string, time: string): string {
  // CST is UTC-6, so append the offset and let Date parse it
  return new Date(`${date}T${time}:00-06:00`).toISOString();
}

/** Extract initials from a name: "Maria Alejandra" -> "MA" */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
