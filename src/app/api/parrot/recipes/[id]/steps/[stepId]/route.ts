import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/verify";

type Params = { params: Promise<{ id: string; stepId: string }> };

// Update step
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, stepId } = await params;
  const supabase = createServerClient();
  const updates = await req.json();

  const ALLOWED_FIELDS = ["title", "description", "step_number", "duration_min", "is_timer_step"];
  const sanitized = Object.fromEntries(
    Object.entries(updates).filter(([k]) => ALLOWED_FIELDS.includes(k))
  );

  const { data, error } = await supabase
    .from("recipe_steps")
    .update(sanitized)
    .eq("id", stepId)
    .eq("recipe_id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ step: data });
}

// Delete step
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, stepId } = await params;
  const supabase = createServerClient();

  const { error } = await supabase
    .from("recipe_steps")
    .delete()
    .eq("id", stepId)
    .eq("recipe_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
