import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/verify";

type Params = { params: Promise<{ id: string }> };

// Add step to recipe
export async function POST(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();
  const body = await req.json();

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Step title is required" }, { status: 400 });
  }

  // Get max step_number for this recipe
  const { data: maxRow } = await supabase
    .from("recipe_steps")
    .select("step_number")
    .eq("recipe_id", id)
    .order("step_number", { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (maxRow?.step_number ?? 0) + 1;

  const { data, error } = await supabase
    .from("recipe_steps")
    .insert({
      recipe_id: id,
      step_number: nextNumber,
      title: body.title.trim(),
      description: body.description || null,
      duration_min: body.duration_min || null,
      is_timer_step: body.is_timer_step || false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ step: data });
}
