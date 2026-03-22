import "server-only";
import { createServerClient } from "@/lib/supabase/server";
import { sendPushToAll } from "@/lib/push/send";
import { sendWhatsApp } from "@/lib/twilio/client";
import { buildOrderCancelledVars } from "@/lib/twilio/templates";
import { formatDay } from "@/lib/format";

/**
 * Expire stale orders and notify both baker (push) and customer (WhatsApp).
 * Called lazily from page loads and the orders API — no cron needed.
 */
export async function expireOrdersWithPush() {
  const supabase = createServerClient();

  // Find orders that are about to be expired (before the RPC wipes them)
  const { data: staleOrders } = await supabase
    .from("orders")
    .select("id, customer_name, customer_whatsapp, quantity, drop_id, drops(flavor_name, orders_close_at)")
    .eq("status", "pending")
    .lt("payment_expires_at", new Date().toISOString());

  // Run the actual expiration
  const { data: expiredCount } = await supabase.rpc("expire_stale_orders");

  // Notify for each expired order
  if (staleOrders && staleOrders.length > 0) {
    for (const order of staleOrders) {
      const drop = order.drops as any;
      const flavorName = drop?.flavor_name ?? "treats";
      const closeDay = drop?.orders_close_at ? formatDay(drop.orders_close_at) : "Thursday";

      // Push to baker
      await sendPushToAll({
        title: "Order expired",
        body: `${order.customer_name}'s ${order.quantity}x ${flavorName} — unpaid, spot freed`,
        url: "/parrot/dashboard?tab=orders",
        tag: `order-expired-${order.id}`,
      }).catch((err) => console.error("Push notification failed:", err));

      // WhatsApp to customer
      if (order.customer_whatsapp) {
        sendWhatsApp({
          to: order.customer_whatsapp,
          templateName: "order_cancelled",
          variables: buildOrderCancelledVars({
            customerName: order.customer_name,
            flavorName,
            closeDay,
          }),
          orderId: order.id,
          dropId: order.drop_id,
        }).catch((err) => console.error("WhatsApp order_cancelled failed:", err));
      }
    }
  }

  return expiredCount ?? 0;
}
