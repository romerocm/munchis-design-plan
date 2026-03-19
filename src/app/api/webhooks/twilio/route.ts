import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { recordOptOut, removeOptOut } from "@/lib/twilio/opt-out";

const STOP_KEYWORDS = ["stop", "unsubscribe", "cancel", "parar", "cancelar"];
const START_KEYWORDS = ["start", "subscribe", "iniciar", "suscribir"];

export async function POST(req: NextRequest) {
  // Twilio sends application/x-www-form-urlencoded
  const formData = await req.formData();
  const body = formData.get("Body")?.toString().trim().toLowerCase() || "";
  const from = formData.get("From")?.toString() || "";
  const messageStatus = formData.get("MessageStatus")?.toString();
  const messageSid = formData.get("MessageSid")?.toString() || formData.get("SmsSid")?.toString();

  // Handle delivery status callbacks
  if (messageStatus && messageSid) {
    const supabase = createServerClient();
    await supabase
      .from("whatsapp_messages")
      .update({
        status: messageStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("twilio_sid", messageSid);

    return new NextResponse("<Response/>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Handle opt-out / opt-in messages
  if (from) {
    // Strip whatsapp: prefix for storage
    const rawNumber = from.replace("whatsapp:", "");

    if (STOP_KEYWORDS.some((kw) => body === kw)) {
      await recordOptOut(rawNumber);
      console.log(`WhatsApp opt-out recorded: ${rawNumber}`);
    } else if (START_KEYWORDS.some((kw) => body === kw)) {
      await removeOptOut(rawNumber);
      console.log(`WhatsApp opt-in restored: ${rawNumber}`);
    }
  }

  // Always acknowledge with empty TwiML
  return new NextResponse("<Response/>", {
    headers: { "Content-Type": "text/xml" },
  });
}
