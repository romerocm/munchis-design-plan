import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/verify";
import { sendPushToAll } from "@/lib/push/send";

export async function POST(req: NextRequest) {
  // Only available in sandbox mode
  if (process.env.WOMPI_SANDBOX !== "true") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { orderId } = await req.json();

  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "confirmed",
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Push notification (fire-and-forget)
  if (data) {
    const { data: drop } = await supabase
      .from("drops")
      .select("flavor_name")
      .eq("id", data.drop_id)
      .single();

    await sendPushToAll({
      title: "Payment confirmed!",
      body: `${data.customer_name} paid for ${data.quantity}x ${drop?.flavor_name || "treats"}`,
      url: "/parrot/dashboard?tab=orders",
      tag: "payment-confirmed",
    }).catch((err) => console.error("Push notification failed:", err));
  }

  return NextResponse.json({ order: data });
}
