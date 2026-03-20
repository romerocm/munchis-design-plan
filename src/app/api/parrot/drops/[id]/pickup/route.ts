import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/verify";

type Params = { params: Promise<{ id: string }> };

// Get pickup-eligible orders for a drop
export async function GET(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();

  // Query confirmed + picked_up orders first, then try no_show separately
  // (no_show enum may not exist yet if migration hasn't run)
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("drop_id", id)
    .in("status", ["confirmed", "picked_up"])
    .order("created_at");

  // Try to also fetch no_show orders (will silently fail if enum doesn't exist yet)
  const { data: noShowData } = await supabase
    .from("orders")
    .select("*")
    .eq("drop_id", id)
    .eq("status", "no_show")
    .order("created_at");

  const allOrders = [...(data || []), ...(noShowData || [])]
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: allOrders });
}

// Update order pickup status
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();
  const { orderId, action } = await req.json();

  if (!orderId || !action) {
    return NextResponse.json({ error: "Missing orderId or action" }, { status: 400 });
  }

  // Verify order belongs to this drop
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, drop_id")
    .eq("id", orderId)
    .eq("drop_id", id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found in this drop" }, { status: 404 });
  }

  const transitions: Record<string, { from: string[]; update: Record<string, unknown> }> = {
    pickup: {
      from: ["confirmed"],
      update: { status: "picked_up", picked_up_at: new Date().toISOString() },
    },
    no_show: {
      from: ["confirmed"],
      update: { status: "no_show", picked_up_at: null },
    },
    undo_no_show: {
      from: ["no_show"],
      update: { status: "confirmed", picked_up_at: null },
    },
    undo_pickup: {
      from: ["picked_up"],
      update: { status: "confirmed", picked_up_at: null },
    },
  };

  const transition = transitions[action];
  if (!transition) {
    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  }

  if (!transition.from.includes(order.status)) {
    return NextResponse.json(
      { error: `Cannot ${action} from status "${order.status}"` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .update(transition.update)
    .eq("id", orderId)
    .eq("drop_id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ order: data });
}
