import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/verify";
import { sendWhatsApp } from "@/lib/twilio/client";
import {
  buildPickupReminderVars,
  buildLastCallVars,
} from "@/lib/twilio/templates";

export async function POST(req: NextRequest) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { dropId, type } = await req.json();

  if (!dropId || !type) {
    return NextResponse.json({ error: "dropId and type required" }, { status: 400 });
  }

  if (type !== "pickup_reminder" && type !== "last_call") {
    return NextResponse.json(
      { error: "type must be 'pickup_reminder' or 'last_call'" },
      { status: 400 }
    );
  }

  const { data: drop } = await supabase
    .from("drops")
    .select("*")
    .eq("id", dropId)
    .single();

  if (!drop) {
    return NextResponse.json({ error: "Drop not found" }, { status: 404 });
  }

  let sent = 0;
  let failed = 0;

  if (type === "pickup_reminder") {
    // Send to all confirmed orders
    const { data: orders } = await supabase
      .from("orders")
      .select("id, customer_whatsapp, quantity")
      .eq("drop_id", dropId)
      .eq("status", "confirmed");

    if (!orders?.length) {
      return NextResponse.json({ sent: 0, failed: 0, message: "No confirmed orders" });
    }

    for (const order of orders) {
      const result = await sendWhatsApp({
        to: order.customer_whatsapp,
        templateName: "pickup_reminder",
        variables: buildPickupReminderVars({
          pickupDate: drop.pickup_date,
          pickupTime: drop.pickup_time_start,
          pickupLocation: drop.pickup_location,
          quantity: order.quantity,
          flavorName: drop.flavor_name,
          mapQuery: encodeURIComponent(drop.pickup_location),
        }),
        orderId: order.id,
        dropId,
      });

      if (result.success && !result.skipped) sent++;
      else if (!result.success) failed++;
    }
  } else {
    // last_call: send to notify_list subscribers
    const { data: subscribers } = await supabase
      .from("notify_list")
      .select("whatsapp")
      .or(`drop_id.is.null,drop_id.eq.${dropId}`);

    if (!subscribers?.length) {
      return NextResponse.json({ sent: 0, failed: 0, message: "No subscribers" });
    }

    const uniqueNumbers = [...new Set(subscribers.map((s) => s.whatsapp))];

    for (const whatsapp of uniqueNumbers) {
      const result = await sendWhatsApp({
        to: whatsapp,
        templateName: "last_call",
        variables: buildLastCallVars({
          dropNumber: drop.number,
          flavorName: drop.flavor_name,
        }),
        dropId,
      });

      if (result.success && !result.skipped) sent++;
      else if (!result.success) failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}
