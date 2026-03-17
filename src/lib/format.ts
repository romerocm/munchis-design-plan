/** Format cents to dollar string: $3.70 or $67 */
export function formatCents(cents: number, decimals: 0 | 2 = 2): string {
  return `$${(cents / 100).toFixed(decimals)}`;
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
