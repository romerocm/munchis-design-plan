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
