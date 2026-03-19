import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase } from "../../helpers/supabase-mock";
import { buildRequest } from "../../helpers/request-builder";

const { client, mockTable, reset } = createMockSupabase();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => client,
}));

import { POST } from "@/app/api/notify/route";

describe("POST /api/notify", () => {
  beforeEach(() => {
    reset();
    mockTable("notify_list", "upsert", { data: null, error: null });
  });

  it("subscribes with valid whatsapp number", async () => {
    const req = buildRequest("/api/notify", {
      method: "POST",
      body: { whatsapp: "+50378901234" },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it("returns 400 for invalid whatsapp (too short)", async () => {
    const req = buildRequest("/api/notify", {
      method: "POST",
      body: { whatsapp: "123" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty whatsapp", async () => {
    const req = buildRequest("/api/notify", {
      method: "POST",
      body: { whatsapp: "" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-numeric whatsapp", async () => {
    const req = buildRequest("/api/notify", {
      method: "POST",
      body: { whatsapp: "not-a-number" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles duplicate (23505) as success", async () => {
    mockTable("notify_list", "upsert", {
      data: null,
      error: { code: "23505", message: "duplicate" },
    });

    const req = buildRequest("/api/notify", {
      method: "POST",
      body: { whatsapp: "+50378901234" },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.already).toBe(true);
  });

  it("returns 500 on DB error", async () => {
    mockTable("notify_list", "upsert", {
      data: null,
      error: { code: "500", message: "DB connection error" },
    });

    const req = buildRequest("/api/notify", {
      method: "POST",
      body: { whatsapp: "+50378901234" },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("passes drop_id when provided", async () => {
    const req = buildRequest("/api/notify", {
      method: "POST",
      body: { whatsapp: "+50378901234", drop_id: "drop-1" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    // Verify the supabase client was called with the table
    expect(client.from).toHaveBeenCalledWith("notify_list");
  });
});
