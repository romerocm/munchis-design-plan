import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/twilio/client";
import { buildPaymentReminderVars } from "@/lib/twilio/templates";

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this automatically)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const now = new Date();
  const soonWindow = new Date(now.getTime() + 6 * 60 * 1000); // 6 minutes from now

  // Find pending orders expiring soon that haven't been reminded
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, customer_name, customer_whatsapp, quantity, drop_id, wompi_payment_id")
    .eq("status", "pending")
    .is("reminder_sent_at", null)
    .gte("payment_expires_at", now.toISOString())
    .lte("payment_expires_at", soonWindow.toISOString());

  if (error) {
    console.error("Payment reminders query failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!orders?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  for (const order of orders) {
    const { data: drop } = await supabase
      .from("drops")
      .select("flavor_name")
      .eq("id", order.drop_id)
      .single();

    if (!drop) continue;

    const result = await sendWhatsApp({
      to: order.customer_whatsapp,
      templateName: "payment_reminder",
      variables: buildPaymentReminderVars({
        customerName: order.customer_name,
        flavorName: drop.flavor_name,
        paymentId: order.wompi_payment_id || "",
      }),
      orderId: order.id,
      dropId: order.drop_id,
    });

    if (result.success) {
      await supabase
        .from("orders")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", order.id);
      sent++;
    }
  }

  return NextResponse.json({ sent });
}
