import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/verify";

type Params = { params: Promise<{ id: string }> };

// Add ingredient to recipe
export async function POST(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();
  const body = await req.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Ingredient name is required" }, { status: 400 });
  }

  // Get max sort_order for this recipe
  const { data: maxRow } = await supabase
    .from("recipe_ingredients")
    .select("sort_order")
    .eq("recipe_id", id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("recipe_ingredients")
    .insert({
      recipe_id: id,
      name: body.name.trim(),
      quantity: body.quantity ?? 1,
      unit: body.unit || "unit",
      sort_order: nextOrder,
      category: body.category || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ingredient: data });
}
