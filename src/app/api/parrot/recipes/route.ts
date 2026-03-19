import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/verify";

// List recipes (optional ?status= filter)
export async function GET(req: NextRequest) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const status = req.nextUrl.searchParams.get("status");

  let query = supabase.from("recipes").select("*").order("updated_at", { ascending: false });
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ recipes: data });
}

// Create a new recipe
export async function POST(req: NextRequest) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const body = await req.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Recipe name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      name: body.name.trim(),
      description: body.description || null,
      status: "draft",
      base_yield: body.base_yield || 1,
      yield_unit: body.yield_unit || "batch",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ recipe: data });
}
