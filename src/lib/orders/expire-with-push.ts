import "server-only";
import { createServerClient } from "@/lib/supabase/server";
import { sendPushToAll } from "@/lib/push/send";

/**
 * Expire stale orders and send a push notification for each one.
 * Called lazily from page loads and the orders API — no cron needed.
 */
export async function expireOrdersWithPush() {
  const supabase = createServerClient();

  // Find orders that are about to be expired (before the RPC wipes them)
  const { data: staleOrders } = await supabase
    .from("orders")
    .select("id, customer_name, quantity, drops(flavor_name)")
    .eq("status", "pending")
    .lt("payment_expires_at", new Date().toISOString());

  // Run the actual expiration
  const { data: expiredCount } = await supabase.rpc("expire_stale_orders");

  // Send push for each expired order (fire-and-forget)
  if (staleOrders && staleOrders.length > 0) {
    for (const order of staleOrders) {
      const flavorName = (order.drops as any)?.flavor_name ?? "treats";
      await sendPushToAll({
        title: "Order expired",
        body: `${order.customer_name}'s ${order.quantity}x ${flavorName} — unpaid, spot freed`,
        url: "/parrot/dashboard?tab=orders",
        tag: `order-expired-${order.id}`,
      }).catch((err) => console.error("Push notification failed:", err));
    }
  }

  return expiredCount ?? 0;
}
