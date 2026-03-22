import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase } from "../../helpers/supabase-mock";
import { buildRequest } from "../../helpers/request-builder";
import { makeLiveDrop } from "../../fixtures/drops";

const { client, mockTable, mockRpc, reset } = createMockSupabase();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => client,
}));

vi.mock("@/lib/wompi/client", () => ({
  createPaymentLink: vi.fn().mockResolvedValue({
    paymentLinkUrl: "https://sandbox.wompi.co/pay/test",
    paymentId: "sandbox_test",
  }),
}));

vi.mock("@/lib/orders/expire-with-push", () => ({
  expireOrdersWithPush: vi.fn().mockResolvedValue(0),
}));

vi.mock("@/lib/push/send", () => ({
  sendPushToAll: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/orders/route";

describe("POST /api/orders", () => {
  const liveDrop = makeLiveDrop({ id: "drop-live-1", price_cents: 370 });

  beforeEach(() => {
    reset();
    mockTable("drops", "select", { data: liveDrop, error: null });
    mockRpc("expire_stale_orders", { data: 0, error: null });
    mockRpc("create_order_atomic", { data: "order-123", error: null });
  });

  it("creates order successfully with valid data", async () => {
    const req = buildRequest("/api/orders", {
      method: "POST",
      body: {
        drop_id: "drop-live-1",
        customer_name: "Maria Alejandra",
        customer_whatsapp: "+50378901234",
        quantity: 3,
      },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.order_id).toBe("order-123");
    expect(data.payment_link).toBe("https://sandbox.wompi.co/pay/test");
    expect(data.total_cents).toBe(1110);
    expect(data.expires_at).toBeDefined();
  });

  it("returns 400 for missing required fields", async () => {
    const req = buildRequest("/api/orders", {
      method: "POST",
      body: { drop_id: "drop-1" }, // missing name, whatsapp, quantity
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for quantity out of range", async () => {
    const req = buildRequest("/api/orders", {
      method: "POST",
      body: {
        drop_id: "drop-1",
        customer_name: "Maria",
        customer_whatsapp: "+50378901234",
        quantity: 100,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for name too short", async () => {
    const req = buildRequest("/api/orders", {
      method: "POST",
      body: {
        drop_id: "drop-1",
        customer_name: "M",
        customer_whatsapp: "+50378901234",
        quantity: 1,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid whatsapp number", async () => {
    const req = buildRequest("/api/orders", {
      method: "POST",
      body: {
        drop_id: "drop-1",
        customer_name: "Maria",
        customer_whatsapp: "abc",
        quantity: 1,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 404 when drop is not live", async () => {
    mockTable("drops", "select", { data: null, error: { message: "Not found" } });

    const req = buildRequest("/api/orders", {
      method: "POST",
      body: {
        drop_id: "drop-not-live",
        customer_name: "Maria",
        customer_whatsapp: "+50378901234",
        quantity: 1,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("returns 409 when capacity exceeded", async () => {
    mockRpc("create_order_atomic", {
      data: null,
      error: { message: "Not enough capacity. 2 remaining" },
    });

    const req = buildRequest("/api/orders", {
      method: "POST",
      body: {
        drop_id: "drop-live-1",
        customer_name: "Maria",
        customer_whatsapp: "+50378901234",
        quantity: 5,
      },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.remaining).toBe(2);
  });

  it("returns 502 when payment link creation fails", async () => {
    const { createPaymentLink } = await import("@/lib/wompi/client");
    vi.mocked(createPaymentLink).mockRejectedValueOnce(new Error("Wompi down"));

    const req = buildRequest("/api/orders", {
      method: "POST",
      body: {
        drop_id: "drop-live-1",
        customer_name: "Maria",
        customer_whatsapp: "+50378901234",
        quantity: 1,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(502);
  });
});
