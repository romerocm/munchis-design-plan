import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase } from "../../../helpers/supabase-mock";
import { buildAuthRequest } from "../../../helpers/request-builder";
import { makeDrop } from "../../../fixtures/drops";

const { client, mockTable, reset } = createMockSupabase();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => client,
}));

const mockVerifyAuth = vi.fn();
vi.mock("@/lib/auth/verify", () => ({
  verifyAuth: (...args: unknown[]) => mockVerifyAuth(...args),
}));

import { PATCH } from "@/app/api/parrot/drop-status/route";

describe("PATCH /api/parrot/drop-status", () => {
  beforeEach(() => {
    reset();
    mockVerifyAuth.mockResolvedValue({ id: "u1", email: "heidi@munchis.sv" });
  });

  it("returns 401 without auth", async () => {
    mockVerifyAuth.mockResolvedValue(null);

    const req = buildAuthRequest("/api/parrot/drop-status", {
      method: "PATCH",
      body: { dropId: "drop-1", status: "scheduled" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid status", async () => {
    const req = buildAuthRequest("/api/parrot/drop-status", {
      method: "PATCH",
      body: { dropId: "drop-1", status: "nonexistent" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it("transitions draft -> scheduled", async () => {
    mockTable("drops", "select", { data: { status: "draft" }, error: null });
    mockTable("drops", "update", { data: makeDrop({ status: "scheduled" }), error: null });

    const req = buildAuthRequest("/api/parrot/drop-status", {
      method: "PATCH",
      body: { dropId: "drop-1", status: "scheduled" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it("transitions scheduled -> live", async () => {
    mockTable("drops", "select", { data: { status: "scheduled" }, error: null });
    mockTable("drops", "update", { data: makeDrop({ status: "live" }), error: null });

    const req = buildAuthRequest("/api/parrot/drop-status", {
      method: "PATCH",
      body: { dropId: "drop-1", status: "live" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it("transitions live -> closed", async () => {
    mockTable("drops", "select", { data: { status: "live" }, error: null });
    mockTable("drops", "update", { data: makeDrop({ status: "closed" }), error: null });

    const req = buildAuthRequest("/api/parrot/drop-status", {
      method: "PATCH",
      body: { dropId: "drop-1", status: "closed" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it("rejects invalid transition (draft -> live)", async () => {
    mockTable("drops", "select", { data: { status: "draft" }, error: null });

    const req = buildAuthRequest("/api/parrot/drop-status", {
      method: "PATCH",
      body: { dropId: "drop-1", status: "live" },
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Can't go from");
    expect(data.error).toContain("scheduled");
  });

  it("returns drop for no-op same-status transition", async () => {
    mockTable("drops", "select", { data: { status: "live" }, error: null });

    const req = buildAuthRequest("/api/parrot/drop-status", {
      method: "PATCH",
      body: { dropId: "drop-1", status: "live" },
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.drop.status).toBe("live");
  });

  it("returns 404 when drop not found", async () => {
    mockTable("drops", "select", { data: null, error: null });

    const req = buildAuthRequest("/api/parrot/drop-status", {
      method: "PATCH",
      body: { dropId: "nonexistent", status: "scheduled" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(404);
  });

  it("cleans up shopping/baking on rollback closed -> live", async () => {
    mockTable("drops", "select", { data: { status: "closed" }, error: null });
    mockTable("drops", "update", { data: makeDrop({ status: "live" }), error: null });
    mockTable("drop_shopping_items", "delete", { data: null, error: null });
    mockTable("drop_baking_steps", "delete", { data: null, error: null });

    const req = buildAuthRequest("/api/parrot/drop-status", {
      method: "PATCH",
      body: { dropId: "drop-1", status: "live" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    // Verify cleanup was called
    expect(client.from).toHaveBeenCalledWith("drop_shopping_items");
    expect(client.from).toHaveBeenCalledWith("drop_baking_steps");
  });

  it("resets baking steps on rollback baking -> closed", async () => {
    mockTable("drops", "select", { data: { status: "baking" }, error: null });
    mockTable("drops", "update", { data: makeDrop({ status: "closed" }), error: null });
    mockTable("drop_baking_steps", "update", { data: null, error: null });

    const req = buildAuthRequest("/api/parrot/drop-status", {
      method: "PATCH",
      body: { dropId: "drop-1", status: "closed" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });
});
