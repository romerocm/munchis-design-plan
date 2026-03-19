import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/twilio/client";
import { buildLastCallVars } from "@/lib/twilio/templates";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  // Find live drops closing tomorrow
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()).toISOString();
  const dayAfter = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1).toISOString();

  const { data: drops } = await supabase
    .from("drops")
    .select("id, number, flavor_name")
    .eq("status", "live")
    .gte("orders_close_at", tomorrowStart)
    .lt("orders_close_at", dayAfter);

  if (!drops?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const drop of drops) {
    // Get subscribers: global (drop_id IS NULL) + drop-specific
    const { data: subscribers } = await supabase
      .from("notify_list")
      .select("whatsapp")
      .or(`drop_id.is.null,drop_id.eq.${drop.id}`);

    if (!subscribers?.length) continue;

    // Deduplicate phone numbers
    const uniqueNumbers = [...new Set(subscribers.map((s) => s.whatsapp))];

    for (const whatsapp of uniqueNumbers) {
      const result = await sendWhatsApp({
        to: whatsapp,
        templateName: "last_call",
        variables: buildLastCallVars({
          dropNumber: drop.number,
          flavorName: drop.flavor_name,
        }),
        dropId: drop.id,
      });

      if (result.success && !result.skipped) sent++;
    }
  }

  return NextResponse.json({ sent });
}
