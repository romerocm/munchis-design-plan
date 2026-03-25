const KEY = "munchis_my_order_ids";

export function markOwnOrder(orderId: string): void {
  try {
    const ids: string[] = JSON.parse(sessionStorage.getItem(KEY) || "[]");
    ids.push(orderId);
    if (ids.length > 20) ids.shift();
    sessionStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // sessionStorage unavailable (SSR, private browsing edge cases)
  }
}

export function isOwnOrder(orderId: string): boolean {
  try {
    const ids: string[] = JSON.parse(sessionStorage.getItem(KEY) || "[]");
    return ids.includes(orderId);
  } catch {
    return false;
  }
}
