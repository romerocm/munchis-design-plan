import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isSandbox, verifyWompiSignature } from "@/lib/wompi/client";
import { sendWhatsApp } from "@/lib/twilio/client";
import { sendPushToAll } from "@/lib/push/send";
import {
  buildPaymentConfirmedVars,
  buildOrderCancelledVars,
} from "@/lib/twilio/templates";

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  // Verify webhook signature in production mode
  if (!isSandbox()) {
    const checksum = req.headers.get("x-wompi-checksum");
    const timestamp = req.headers.get("x-wompi-timestamp");

    if (!checksum || !timestamp) {
      console.error("Wompi webhook: missing signature headers");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const transaction = body.data?.transaction;
    if (!transaction) {
      return NextResponse.json({ error: "Missing transaction data" }, { status: 400 });
    }

    const valid = verifyWompiSignature(checksum, timestamp, {
      id: transaction.id,
      status: transaction.status,
      reference: transaction.reference,
      amount_in_cents: transaction.amount_in_cents,
    });

    if (!valid) {
      console.error("Wompi webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = body.event;
  const transaction = body.data?.transaction;
  const paymentLinkId = transaction?.payment_link_id;
  const status = transaction?.status;

  if (event === "transaction.updated" && paymentLinkId) {
    if (status === "APPROVED") {
      // Confirm order. Idempotent: .eq("status", "pending") prevents double-processing
      const { data: updatedOrders, error } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          paid_at: new Date().toISOString(),
        })
        .eq("wompi_payment_id", paymentLinkId)
        .eq("status", "pending")
        .select("id, customer_name, customer_whatsapp, quantity, drop_id");

      if (error) {
        console.error("Failed to confirm order:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }

      // Send payment confirmed WhatsApp (fire-and-forget)
      if (updatedOrders?.[0]) {
        const order = updatedOrders[0];
        const { data: drop } = await supabase
          .from("drops")
          .select("flavor_name, pickup_date, pickup_time_start, pickup_location")
          .eq("id", order.drop_id)
          .single();

        if (drop) {
          // Push notification to baker dashboard
          sendPushToAll({
            title: "Payment confirmed!",
            body: `${order.customer_name} paid for ${order.quantity}x ${drop.flavor_name}`,
            url: "/parrot/dashboard?tab=orders",
            tag: "payment-confirmed",
          }).catch((err) => console.error("Push notification failed:", err));

          sendWhatsApp({
            to: order.customer_whatsapp,
            templateName: "payment_confirmed",
            variables: buildPaymentConfirmedVars({
              customerName: order.customer_name,
              pickupDate: drop.pickup_date,
              pickupTime: drop.pickup_time_start,
              pickupLocation: drop.pickup_location,
              quantity: order.quantity,
              flavorName: drop.flavor_name,
              mapQuery: encodeURIComponent(drop.pickup_location),
            }),
            orderId: order.id,
            dropId: order.drop_id,
          }).catch((err) => console.error("WhatsApp payment_confirmed failed:", err));
        }
      }
    } else if (status === "DECLINED" || status === "VOIDED" || status === "ERROR") {
      // Free capacity by expiring the declined order
      const { data: updatedOrders, error } = await supabase
        .from("orders")
        .update({ status: "expired" })
        .eq("wompi_payment_id", paymentLinkId)
        .eq("status", "pending")
        .select("id, customer_name, customer_whatsapp, drop_id");

      if (error) {
        console.error("Failed to expire declined order:", error);
      }

      // Send order cancelled WhatsApp (fire-and-forget)
      if (updatedOrders?.[0]) {
        const order = updatedOrders[0];
        const { data: drop } = await supabase
          .from("drops")
          .select("flavor_name, orders_close_at")
          .eq("id", order.drop_id)
          .single();

        if (drop) {
          const closeDate = new Date(drop.orders_close_at);
          const closeDay = closeDate.toLocaleDateString("es-SV", { weekday: "long" });
          sendWhatsApp({
            to: order.customer_whatsapp,
            templateName: "order_cancelled",
            variables: buildOrderCancelledVars({
              customerName: order.customer_name,
              flavorName: drop.flavor_name,
              closeDay,
            }),
            orderId: order.id,
            dropId: order.drop_id,
          }).catch((err) => console.error("WhatsApp order_cancelled failed:", err));
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
