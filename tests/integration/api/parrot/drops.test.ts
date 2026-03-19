import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase } from "../../../helpers/supabase-mock";
import { buildRequest, buildAuthRequest } from "../../../helpers/request-builder";
import { makeDrop } from "../../../fixtures/drops";

const { client, mockTable, reset } = createMockSupabase();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => client,
}));

const mockVerifyAuth = vi.fn();
vi.mock("@/lib/auth/verify", () => ({
  verifyAuth: (...args: unknown[]) => mockVerifyAuth(...args),
}));

import { POST, PATCH } from "@/app/api/parrot/drops/route";

describe("POST /api/parrot/drops", () => {
  const latestDrop = makeDrop({ number: 5, price_cents: 400, capacity: 150 });

  beforeEach(() => {
    reset();
    mockVerifyAuth.mockReset();
    mockTable("drops", "select", { data: latestDrop, error: null });
    mockTable("drops", "insert", { data: makeDrop({ number: 6 }), error: null });
  });

  it("returns 401 without auth", async () => {
    mockVerifyAuth.mockResolvedValue(null);

    const req = buildRequest("/api/parrot/drops", {
      method: "POST",
      body: {},
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("creates drop with smart defaults when authenticated", async () => {
    mockVerifyAuth.mockResolvedValue({ id: "u1", email: "heidi@munchis.sv" });

    const req = buildAuthRequest("/api/parrot/drops", {
      method: "POST",
      body: {},
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.drop).toBeDefined();
  });

  it("creates drop with custom flavor name", async () => {
    mockVerifyAuth.mockResolvedValue({ id: "u1", email: "heidi@munchis.sv" });

    const req = buildAuthRequest("/api/parrot/drops", {
      method: "POST",
      body: { flavor_name: "Cinnamon Rolls" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/parrot/drops", () => {
  beforeEach(() => {
    reset();
    mockVerifyAuth.mockReset();
    mockTable("drops", "update", { data: makeDrop({ flavor_name: "Updated" }), error: null });
  });

  it("returns 401 without auth", async () => {
    mockVerifyAuth.mockResolvedValue(null);

    const req = buildRequest("/api/parrot/drops", {
      method: "PATCH",
      body: { id: "drop-1", flavor_name: "New Name" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("updates drop when authenticated", async () => {
    mockVerifyAuth.mockResolvedValue({ id: "u1", email: "heidi@munchis.sv" });

    const req = buildAuthRequest("/api/parrot/drops", {
      method: "PATCH",
      body: { id: "drop-1", flavor_name: "Cinnamon Rolls" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 when id is missing", async () => {
    mockVerifyAuth.mockResolvedValue({ id: "u1", email: "heidi@munchis.sv" });

    const req = buildAuthRequest("/api/parrot/drops", {
      method: "PATCH",
      body: { flavor_name: "No ID" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});
