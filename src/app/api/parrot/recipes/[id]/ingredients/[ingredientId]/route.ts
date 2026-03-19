import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/verify";

type Params = { params: Promise<{ id: string; ingredientId: string }> };

// Update ingredient
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, ingredientId } = await params;
  const supabase = createServerClient();
  const updates = await req.json();

  const ALLOWED_FIELDS = ["name", "quantity", "unit", "sort_order", "category", "notes"];
  const sanitized = Object.fromEntries(
    Object.entries(updates).filter(([k]) => ALLOWED_FIELDS.includes(k))
  );

  const { data, error } = await supabase
    .from("recipe_ingredients")
    .update(sanitized)
    .eq("id", ingredientId)
    .eq("recipe_id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ingredient: data });
}

// Delete ingredient
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, ingredientId } = await params;
  const supabase = createServerClient();

  const { error } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("id", ingredientId)
    .eq("recipe_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
