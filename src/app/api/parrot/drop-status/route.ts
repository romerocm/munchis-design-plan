import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/verify";
import { DROP_STATUSES, DROP_TRANSITIONS } from "@/lib/drops/constants";

export async function PATCH(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use the server (secret) client for the actual update
  const supabase = createServerClient();

  const { dropId, status } = await req.json();

  if (!(DROP_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Get current status
  const { data: current } = await supabase
    .from("drops")
    .select("status")
    .eq("id", dropId)
    .single();

  if (!current) {
    return NextResponse.json({ error: "Drop not found" }, { status: 404 });
  }

  if (current.status === status) {
    return NextResponse.json({ drop: current }); // no-op
  }

  const allowed = DROP_TRANSITIONS[current.status as keyof typeof DROP_TRANSITIONS] || [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Can't go from "${current.status}" to "${status}". Allowed: ${allowed.join(", ") || "none (terminal state)"}` },
      { status: 400 }
    );
  }

  // Rollback cleanup: delete snapshots when going back to live, reset when going back to closed
  if (current.status === "closed" && status === "live") {
    // Rolling back to live: delete shopping + baking snapshots (will regenerate on next close)
    await supabase.from("drop_shopping_items").delete().eq("drop_id", dropId);
    await supabase.from("drop_baking_steps").delete().eq("drop_id", dropId);
  } else if (current.status === "baking" && status === "closed") {
    // Rolling back to closed: reset all baking step statuses to pending
    await supabase
      .from("drop_baking_steps")
      .update({ status: "pending", started_at: null, completed_at: null })
      .eq("drop_id", dropId);
  }

  const { data, error } = await supabase
    .from("drops")
    .update({ status })
    .eq("id", dropId)
    .select()
    .single();

  if (error) {
    const msg = error.message;
    if (msg.includes("overlaps")) {
      return NextResponse.json({ error: "Can't go live. This drop overlaps with another active drop." }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ drop: data });
}
