import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/twilio/client";
import { buildPickupReminderVars } from "@/lib/twilio/templates";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  // Find drops with pickup tomorrow that are in 'ready' status
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

  const { data: drops } = await supabase
    .from("drops")
    .select("id, flavor_name, pickup_date, pickup_time_start, pickup_location")
    .eq("status", "ready")
    .eq("pickup_date", tomorrowDate);

  if (!drops?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const drop of drops) {
    // Get confirmed orders for this drop
    const { data: orders } = await supabase
      .from("orders")
      .select("id, customer_whatsapp, quantity")
      .eq("drop_id", drop.id)
      .eq("status", "confirmed");

    if (!orders?.length) continue;

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
        dropId: drop.id,
      });

      if (result.success && !result.skipped) sent++;
    }
  }

  return NextResponse.json({ sent });
}
