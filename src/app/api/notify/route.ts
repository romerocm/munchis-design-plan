import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { whatsapp, drop_id } = await req.json();

  const cleaned = String(whatsapp || "").trim().replace(/[^0-9+\-\s()]/g, "").slice(0, 20);
  const digitsOnly = cleaned.replace(/[\s\-()]/g, "");

  if (!cleaned || !/^\+?\d{7,15}$/.test(digitsOnly)) {
    return NextResponse.json(
      { error: "Valid WhatsApp number is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("notify_list").upsert(
    {
      whatsapp: cleaned,
      drop_id: drop_id || null,
    },
    { onConflict: "whatsapp,drop_id" }
  );

  if (error) {
    // Duplicate is fine, treat as success
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, already: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
