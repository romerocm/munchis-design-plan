import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/verify";
import { RECIPE_STATUSES, RECIPE_TRANSITIONS } from "@/lib/recipes/constants";

type Params = { params: Promise<{ id: string }> };

// Get recipe detail with ingredients + steps
export async function GET(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();

  const [recipeRes, ingredientsRes, stepsRes] = await Promise.all([
    supabase.from("recipes").select("*").eq("id", id).single(),
    supabase.from("recipe_ingredients").select("*").eq("recipe_id", id).order("sort_order"),
    supabase.from("recipe_steps").select("*").eq("recipe_id", id).order("step_number"),
  ]);

  if (!recipeRes.data) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  return NextResponse.json({
    recipe: {
      ...recipeRes.data,
      ingredients: ingredientsRes.data || [],
      steps: stepsRes.data || [],
    },
  });
}

// Update recipe fields
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();
  const updates = await req.json();

  const ALLOWED_FIELDS = [
    "name", "description", "emoji", "image_url", "base_yield", "yield_unit",
    "prep_time_min", "bake_time_min", "rest_time_min", "oven_temp_c", "oven_mode",
    "category", "notes", "status",
  ];

  // Validate status transition if status is being changed
  if (updates.status) {
    if (!(RECIPE_STATUSES as readonly string[]).includes(updates.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data: current } = await supabase.from("recipes").select("status").eq("id", id).single();
    if (!current) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Archive is always allowed from any non-archived status
    const isArchiving = updates.status === "archived" && current.status !== "archived";
    const allowed = RECIPE_TRANSITIONS[current.status as keyof typeof RECIPE_TRANSITIONS] || [];
    if (!isArchiving && !allowed.includes(updates.status)) {
      return NextResponse.json(
        { error: `Can't go from "${current.status}" to "${updates.status}"` },
        { status: 400 }
      );
    }
  }

  const sanitized = Object.fromEntries(
    Object.entries(updates).filter(([k]) => ALLOWED_FIELDS.includes(k))
  );

  const { data, error } = await supabase
    .from("recipes")
    .update(sanitized)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ recipe: data });
}

// Delete recipe (block if linked to active drops)
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();

  // Check for linked active drops
  const { data: linkedDrops } = await supabase
    .from("drops")
    .select("id, status")
    .eq("recipe_id", id)
    .in("status", ["live", "closed", "baking"]);

  if (linkedDrops && linkedDrops.length > 0) {
    return NextResponse.json(
      { error: "Can't delete recipe — it's linked to active drops" },
      { status: 400 }
    );
  }

  // Unlink from any completed/draft drops first
  await supabase.from("drops").update({ recipe_id: null }).eq("recipe_id", id);

  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
