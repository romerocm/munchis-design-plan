import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/verify";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();

  // Only allow deleting draft drops
  const { data: drop } = await supabase
    .from("drops")
    .select("status")
    .eq("id", id)
    .single();

  if (!drop) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (drop.status !== "draft") {
    return NextResponse.json(
      { error: "Can only delete draft drops" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("drops").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
