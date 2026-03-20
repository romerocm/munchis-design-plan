import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase } from "../../../helpers/supabase-mock";

const { client, mockTable, reset } = createMockSupabase();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => client,
}));

// Bypass Twilio signature verification in integration tests
vi.mock("@/lib/twilio/verify-signature", () => ({
  verifyTwilioSignature: () => true,
}));

import { POST } from "@/app/api/webhooks/twilio/route";

function buildFormRequest(body: Record<string, string>): Request {
  const formData = new URLSearchParams(body);
  return new Request("http://localhost:3860/api/webhooks/twilio", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });
}

describe("POST /api/webhooks/twilio", () => {
  beforeEach(() => {
    reset();
    mockTable("whatsapp_opt_outs", "upsert", { data: null, error: null });
    mockTable("whatsapp_opt_outs", "delete", { data: null, error: null });
    mockTable("whatsapp_messages", "update", { data: null, error: null });
  });

  it("records opt-out on STOP message", async () => {
    const req = buildFormRequest({
      Body: "STOP",
      From: "whatsapp:+50378901234",
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(client.from).toHaveBeenCalledWith("whatsapp_opt_outs");
  });

  it("records opt-out on lowercase stop", async () => {
    const req = buildFormRequest({
      Body: "stop",
      From: "whatsapp:+50378901234",
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(client.from).toHaveBeenCalledWith("whatsapp_opt_outs");
  });

  it("records opt-out on Spanish keyword 'parar'", async () => {
    const req = buildFormRequest({
      Body: "parar",
      From: "whatsapp:+50378901234",
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(client.from).toHaveBeenCalledWith("whatsapp_opt_outs");
  });

  it("handles opt-in on START message", async () => {
    const req = buildFormRequest({
      Body: "START",
      From: "whatsapp:+50378901234",
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(client.from).toHaveBeenCalledWith("whatsapp_opt_outs");
  });

  it("handles delivery status callback", async () => {
    const req = buildFormRequest({
      MessageStatus: "delivered",
      MessageSid: "SM1234567890",
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(client.from).toHaveBeenCalledWith("whatsapp_messages");
  });

  it("returns TwiML response", async () => {
    const req = buildFormRequest({ Body: "hello", From: "whatsapp:+503123" });
    const res = await POST(req as never);

    expect(res.headers.get("Content-Type")).toBe("text/xml");
    const text = await res.text();
    expect(text).toBe("<Response/>");
  });
});
