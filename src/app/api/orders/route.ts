import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createPaymentLink } from "@/lib/wompi/client";
import { MAX_ORDER_QUANTITY, PAYMENT_WINDOW_MS } from "@/lib/orders/constants";
import { sendWhatsApp } from "@/lib/twilio/client";
import { buildOrderReceivedVars, formatCentsToDollars } from "@/lib/twilio/templates";

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  const body = await req.json();
  const { drop_id, customer_name, customer_whatsapp, customer_email, quantity } =
    body;

  // Validate required fields
  if (!drop_id || !customer_name || !customer_whatsapp || !quantity) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (quantity < 1 || quantity > MAX_ORDER_QUANTITY) {
    return NextResponse.json(
      { error: `Quantity must be between 1 and ${MAX_ORDER_QUANTITY}` },
      { status: 400 }
    );
  }

  // Input sanitization
  const nameClean = String(customer_name).trim().slice(0, 100);
  const whatsappClean = String(customer_whatsapp).trim().replace(/[^0-9+\-\s()]/g, "").slice(0, 20);

  if (nameClean.length < 2) {
    return NextResponse.json({ error: "Name too short" }, { status: 400 });
  }
  if (!/^\+?\d{7,15}$/.test(whatsappClean.replace(/[\s\-()]/g, ""))) {
    return NextResponse.json({ error: "Invalid WhatsApp number" }, { status: 400 });
  }

  // Get drop to calculate price
  const { data: drop, error: dropError } = await supabase
    .from("drops")
    .select("*")
    .eq("id", drop_id)
    .eq("status", "live")
    .single();

  if (dropError || !drop) {
    return NextResponse.json(
      { error: "Drop not found or not accepting orders" },
      { status: 404 }
    );
  }

  // Expire stale orders first to free capacity
  // Expire stale orders (best effort, pg_cron is the primary mechanism)
  try { await supabase.rpc("expire_stale_orders"); } catch { /* pg_cron handles this */ }

  // Validate quantity is a positive integer
  const qty = Math.floor(Number(quantity));
  if (!Number.isFinite(qty) || qty < 1 || qty > MAX_ORDER_QUANTITY) {
    return NextResponse.json(
      { error: `Quantity must be a whole number between 1 and ${MAX_ORDER_QUANTITY}` },
      { status: 400 }
    );
  }

  const totalCents = drop.price_cents * qty;
  const paymentExpiresAt = new Date(Date.now() + PAYMENT_WINDOW_MS).toISOString();

  // Create payment link
  let paymentLink;
  try {
    paymentLink = await createPaymentLink({
      orderId: crypto.randomUUID(),
      amountCents: totalCents,
      customerName: nameClean,
      customerWhatsapp: whatsappClean,
      description: `${qty}x ${drop.flavor_name}`,
    });
  } catch (err) {
    console.error("Payment link creation failed:", err);
    return NextResponse.json(
      { error: "Unable to create payment link. Please try again." },
      { status: 502 }
    );
  }

  // Create order atomically with capacity check (prevents race conditions)
  const { data: orderId, error: orderError } = await supabase.rpc(
    "create_order_atomic",
    {
      p_drop_id: drop_id,
      p_customer_name: nameClean,
      p_customer_whatsapp: whatsappClean,
      p_customer_email: customer_email?.trim() || null,
      p_quantity: qty,
      p_total_cents: totalCents,
      p_payment_expires_at: paymentExpiresAt,
      p_wompi_payment_id: paymentLink.paymentId,
      p_wompi_payment_link: paymentLink.paymentLinkUrl,
    }
  );

  if (orderError) {
    const msg = orderError.message;
    if (msg.includes("Not enough capacity")) {
      const remaining = msg.match(/(\d+) remaining/)?.[1] || "0";
      return NextResponse.json(
        { error: "Not enough capacity", remaining: parseInt(remaining) },
        { status: 409 }
      );
    }
    if (msg.includes("not accepting orders") || msg.includes("not live")) {
      return NextResponse.json(
        { error: "Drop is no longer accepting orders" },
        { status: 404 }
      );
    }
    console.error("Order creation failed:", msg);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }

  // Fire-and-forget: push notification to baker dashboard
  import("@/lib/push/send").then(({ sendPushToAll }) =>
    sendPushToAll({
      title: `New order! ${qty}x ${drop.flavor_name}`,
      body: `${nameClean} just ordered · ${formatCentsToDollars(totalCents)}`,
      url: "/parrot/dashboard?tab=orders",
      tag: "new-order",
    })
  ).catch((err) => console.error("Push notification failed:", err));

  // Fire-and-forget: send order received WhatsApp notification
  sendWhatsApp({
    to: whatsappClean,
    templateName: "order_received",
    variables: buildOrderReceivedVars({
      customerName: nameClean,
      quantity: qty,
      flavorName: drop.flavor_name,
      totalFormatted: formatCentsToDollars(totalCents),
      paymentId: paymentLink.paymentId,
    }),
    orderId: orderId as string,
    dropId: drop_id,
  }).catch((err) => console.error("WhatsApp order_received failed:", err));

  return NextResponse.json({
    order_id: orderId,
    payment_link: paymentLink.paymentLinkUrl,
    expires_at: paymentExpiresAt,
    total_cents: totalCents,
  });
}
