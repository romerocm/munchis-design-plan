import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/verify";

type Params = { params: Promise<{ id: string }> };

// Get shopping items for a drop
export async function GET(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("drop_shopping_items")
    .select("*")
    .eq("drop_id", id)
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}

// Sync shopping list from recipe — adds missing ingredients, preserves checked state
export async function POST(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();

  // Get drop + recipe
  const { data: drop } = await supabase.from("drops").select("recipe_id").eq("id", id).single();
  if (!drop?.recipe_id) {
    return NextResponse.json({ error: "No recipe linked to this drop" }, { status: 400 });
  }

  // Get recipe ingredients
  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("*")
    .eq("recipe_id", drop.recipe_id)
    .order("sort_order");

  // Get existing shopping items
  const { data: existing } = await supabase
    .from("drop_shopping_items")
    .select("*")
    .eq("drop_id", id);

  if (!ingredients) {
    return NextResponse.json({ error: "No ingredients found" }, { status: 404 });
  }

  // Get scale factor from confirmed orders
  const { data: recipe } = await supabase.from("recipes").select("base_yield").eq("id", drop.recipe_id).single();
  const { data: orderAgg } = await supabase.rpc("get_drop_remaining_capacity", { p_drop_id: id });

  // Simple scale: use count of confirmed orders
  const { count } = await supabase
    .from("orders")
    .select("quantity", { count: "exact", head: false })
    .eq("drop_id", id)
    .eq("status", "confirmed");

  // Calculate total confirmed quantity
  const { data: orderRows } = await supabase
    .from("orders")
    .select("quantity")
    .eq("drop_id", id)
    .eq("status", "confirmed");

  const confirmedQty = (orderRows || []).reduce((sum, o) => sum + o.quantity, 0);
  const baseYield = recipe?.base_yield || 1;
  const scale = Math.max(confirmedQty / baseYield, 1);

  // Find ingredients not yet in shopping list (by name match)
  const existingNames = new Set((existing || []).map((e) => e.ingredient_name.toLowerCase()));
  const newIngredients = ingredients.filter((ing) => !existingNames.has(ing.name.toLowerCase()));

  if (newIngredients.length === 0) {
    return NextResponse.json({ added: 0, items: existing });
  }

  // Insert new items
  const maxOrder = Math.max(0, ...(existing || []).map((e) => e.sort_order));
  const toInsert = newIngredients.map((ing, i) => ({
    drop_id: id,
    ingredient_name: ing.name,
    ingredient_category: ing.category,
    base_quantity: ing.quantity,
    scaled_quantity: Math.round(ing.quantity * scale * 100) / 100,
    unit: ing.unit,
    sort_order: maxOrder + 1 + i,
    checked: false,
  }));

  await supabase.from("drop_shopping_items").insert(toInsert);

  // Return full updated list
  const { data: updated } = await supabase
    .from("drop_shopping_items")
    .select("*")
    .eq("drop_id", id)
    .order("sort_order");

  return NextResponse.json({ added: newIngredients.length, items: updated });
}

// Toggle checked or update scaled_quantity
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();
  const { itemId, ...updates } = await req.json();

  if (!itemId) {
    return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
  }

  const ALLOWED_FIELDS = ["checked", "scaled_quantity"];
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(updates)) {
    if (ALLOWED_FIELDS.includes(k)) sanitized[k] = v;
  }

  // Auto-set checked_at timestamp
  if ("checked" in sanitized) {
    sanitized.checked_at = sanitized.checked ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from("drop_shopping_items")
    .update(sanitized)
    .eq("id", itemId)
    .eq("drop_id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
