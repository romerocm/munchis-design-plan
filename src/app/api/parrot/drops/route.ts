import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/verify";
import { DROP_DEFAULTS } from "@/lib/drops/constants";
import { cstToUTC } from "@/lib/format";

// Create a new drop
export async function POST(req: NextRequest) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const body = await req.json();

  // Get latest drop for smart defaults
  const { data: latest } = await supabase
    .from("drops")
    .select("*")
    .order("number", { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (latest?.number || 0) + 1;

  // Auto-schedule after the latest drop's pickup date
  // Default: next Monday after the latest pickup, or next Monday from today
  const lastPickup = latest?.pickup_date
    ? new Date(latest.pickup_date)
    : new Date();

  // Find next Monday after lastPickup
  const nextMonday = new Date(lastPickup);
  nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7));

  const nextThursday = new Date(nextMonday);
  nextThursday.setDate(nextThursday.getDate() + 3);

  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextSunday.getDate() + 6);

  // Format dates as YYYY-MM-DD for CST construction
  const fmtDate = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/El_Salvador" });

  const { data, error } = await supabase
    .from("drops")
    .insert({
      number: nextNumber,
      status: "draft",
      flavor_name: body.flavor_name || DROP_DEFAULTS.flavor_name,
      flavor_description: body.flavor_description || null,
      flavor_color: body.flavor_color || DROP_DEFAULTS.flavor_color,
      price_cents: body.price_cents || latest?.price_cents || DROP_DEFAULTS.price_cents,
      capacity: body.capacity || latest?.capacity || DROP_DEFAULTS.capacity,
      pickup_location: body.pickup_location || latest?.pickup_location || DROP_DEFAULTS.pickup_location,
      pickup_date: body.pickup_date || fmtDate(nextSunday),
      pickup_time_start: body.pickup_time_start || latest?.pickup_time_start || DROP_DEFAULTS.pickup_time_start,
      pickup_time_end: body.pickup_time_end || latest?.pickup_time_end || DROP_DEFAULTS.pickup_time_end,
      orders_open_at: body.orders_open_at || cstToUTC(fmtDate(nextMonday), "08:00"),
      orders_close_at: body.orders_close_at || cstToUTC(fmtDate(nextThursday), "23:59"),
      hero_image_url: body.hero_image_url || null,
      flavor_image_url: body.flavor_image_url || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ drop: data });
}

// Update a drop
export async function PATCH(req: NextRequest) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { id, ...updates } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Missing drop id" }, { status: 400 });
  }

  // Whitelist allowed fields to prevent arbitrary column updates
  const ALLOWED_FIELDS = [
    "flavor_name", "flavor_description", "flavor_color", "price_cents",
    "capacity", "pickup_location", "pickup_date", "pickup_time_start",
    "pickup_time_end", "orders_open_at", "orders_close_at",
    "hero_image_url", "flavor_image_url", "status", "recipe_id",
  ];
  const sanitized = Object.fromEntries(
    Object.entries(updates)
      .filter(([k]) => ALLOWED_FIELDS.includes(k))
      .map(([k, v]) => [k, v === "" ? null : v])  // convert empty strings to null for UUID fields
  );

  const { data, error } = await supabase
    .from("drops")
    .update(sanitized)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    // Surface human-readable messages from DB triggers
    const msg = error.message;
    if (msg.includes("overlaps")) {
      return NextResponse.json({ error: "This drop overlaps with another active drop. Adjust the dates." }, { status: 409 });
    }
    if (msg.includes("close date must be after")) {
      return NextResponse.json({ error: "Orders close date must be after the open date." }, { status: 400 });
    }
    if (msg.includes("Pickup date must be after")) {
      return NextResponse.json({ error: "Pickup date must be after orders close." }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ drop: data });
}
