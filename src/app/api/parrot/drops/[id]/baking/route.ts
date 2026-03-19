import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/verify";

type Params = { params: Promise<{ id: string }> };

// Get baking steps for a drop
export async function GET(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("drop_baking_steps")
    .select("*")
    .eq("drop_id", id)
    .order("step_number");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ steps: data });
}

// Update baking step status
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();
  const { stepId, status } = await req.json();

  if (!stepId) {
    return NextResponse.json({ error: "Missing stepId" }, { status: 400 });
  }

  const validStatuses = ["pending", "active", "completed", "skipped"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { status };

  if (status === "active") {
    updateData.started_at = now;
  } else if (status === "completed" || status === "skipped") {
    updateData.completed_at = now;
  } else if (status === "pending") {
    updateData.started_at = null;
    updateData.completed_at = null;
  }

  const { data, error } = await supabase
    .from("drop_baking_steps")
    .update(updateData)
    .eq("id", stepId)
    .eq("drop_id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ step: data });
}
