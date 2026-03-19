import Twilio from "twilio";
import { createServerClient } from "@/lib/supabase/server";
import { isOptedOut } from "./opt-out";
import { getContentSid, TemplateName } from "./templates";

const SANDBOX = process.env.TWILIO_SANDBOX === "true";

interface SendWhatsAppParams {
  to: string;
  templateName: TemplateName;
  variables: string;
  orderId?: string;
  dropId?: string;
}

interface SendResult {
  messageSid: string | null;
  success: boolean;
  skipped?: boolean;
}

/**
 * Normalize a phone number to Twilio WhatsApp format: whatsapp:+503XXXXXXXX
 */
export function normalizeWhatsApp(phone: string): string {
  let digits = phone.replace(/[^0-9+]/g, "");

  // Ensure + prefix
  if (!digits.startsWith("+")) {
    // Assume El Salvador (+503) if no country code
    if (digits.length === 8) {
      digits = `+503${digits}`;
    } else {
      digits = `+${digits}`;
    }
  }

  return `whatsapp:${digits}`;
}

/**
 * Send a WhatsApp message via Twilio Content Templates.
 * Fire-and-forget: never throws, returns success/failure.
 */
export async function sendWhatsApp(
  params: SendWhatsAppParams
): Promise<SendResult> {
  const { to, templateName, variables, orderId, dropId } = params;
  const supabase = createServerClient();
  const contentSid = getContentSid(templateName);
  const recipient = normalizeWhatsApp(to);

  // Check opt-out
  const rawNumber = recipient.replace("whatsapp:", "");
  if (await isOptedOut(rawNumber)) {
    console.log(`WhatsApp skipped (opted out): ${templateName} → ${rawNumber}`);
    return { messageSid: null, success: true, skipped: true };
  }

  // Sandbox mode: log and return fake SID
  if (SANDBOX && !process.env.TWILIO_AUTH_TOKEN) {
    const fakeSid = `sandbox_${templateName}_${Date.now()}`;
    console.log(`[WhatsApp Sandbox] ${templateName} → ${recipient}`, variables);

    await supabase.from("whatsapp_messages").insert({
      order_id: orderId || null,
      drop_id: dropId || null,
      recipient: rawNumber,
      template_name: templateName,
      content_sid: contentSid || "sandbox",
      twilio_sid: fakeSid,
      status: "sent",
    });

    return { messageSid: fakeSid, success: true };
  }

  // Validate config
  if (!contentSid) {
    const err = `Missing ContentSid for template: ${templateName}`;
    console.error(err);
    await supabase.from("whatsapp_messages").insert({
      order_id: orderId || null,
      drop_id: dropId || null,
      recipient: rawNumber,
      template_name: templateName,
      content_sid: "missing",
      status: "failed",
      error_message: err,
    });
    return { messageSid: null, success: false };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    const err = "Twilio credentials not configured";
    console.error(err);
    await supabase.from("whatsapp_messages").insert({
      order_id: orderId || null,
      drop_id: dropId || null,
      recipient: rawNumber,
      template_name: templateName,
      content_sid: contentSid,
      status: "failed",
      error_message: err,
    });
    return { messageSid: null, success: false };
  }

  try {
    const client = Twilio(accountSid, authToken);
    const message = await client.messages.create({
      from,
      to: recipient,
      contentSid,
      contentVariables: variables,
    });

    await supabase.from("whatsapp_messages").insert({
      order_id: orderId || null,
      drop_id: dropId || null,
      recipient: rawNumber,
      template_name: templateName,
      content_sid: contentSid,
      twilio_sid: message.sid,
      status: message.status || "sent",
    });

    return { messageSid: message.sid, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`WhatsApp send failed (${templateName}):`, errorMessage);

    await supabase.from("whatsapp_messages").insert({
      order_id: orderId || null,
      drop_id: dropId || null,
      recipient: rawNumber,
      template_name: templateName,
      content_sid: contentSid,
      status: "failed",
      error_message: errorMessage,
    });

    return { messageSid: null, success: false };
  }
}
