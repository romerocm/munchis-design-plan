import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the Supabase client
const mockGetUser = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

import { verifyAuth, clearAuthCache, invalidateToken } from "@/lib/auth/verify";

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/test", { headers });
}

describe("verifyAuth", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    clearAuthCache();
    process.env.BAKER_EMAILS = "heidi@munchis.sv";
  });

  it("returns null when Authorization header is missing", async () => {
    const result = await verifyAuth(makeRequest());
    expect(result).toBeNull();
  });

  it("returns null when Authorization header has no Bearer prefix", async () => {
    const result = await verifyAuth(makeRequest({ Authorization: "Token abc123" }));
    expect(result).toBeNull();
  });

  it("returns null when Supabase returns error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Invalid token"),
    });
    const result = await verifyAuth(makeRequest({ Authorization: "Bearer bad-token" }));
    expect(result).toBeNull();
  });

  it("returns null when Supabase returns no user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const result = await verifyAuth(makeRequest({ Authorization: "Bearer no-user-token" }));
    expect(result).toBeNull();
  });

  it("returns null when user email is not whitelisted", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "stranger@example.com" } },
      error: null,
    });
    const result = await verifyAuth(makeRequest({ Authorization: "Bearer valid-token" }));
    expect(result).toBeNull();
  });

  it("returns null when user has no email", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: null } },
      error: null,
    });
    const result = await verifyAuth(makeRequest({ Authorization: "Bearer valid-token" }));
    expect(result).toBeNull();
  });

  it("returns user when email is whitelisted", async () => {
    const user = { id: "u1", email: "heidi@munchis.sv" };
    mockGetUser.mockResolvedValue({
      data: { user },
      error: null,
    });
    const result = await verifyAuth(makeRequest({ Authorization: "Bearer valid-token" }));
    expect(result).toEqual(user);
  });

  it("supports multiple BAKER_EMAILS (comma-separated)", async () => {
    process.env.BAKER_EMAILS = "heidi@munchis.sv,assistant@munchis.sv";
    const user = { id: "u2", email: "assistant@munchis.sv" };
    mockGetUser.mockResolvedValue({
      data: { user },
      error: null,
    });
    const result = await verifyAuth(makeRequest({ Authorization: "Bearer valid-token" }));
    expect(result).toEqual(user);
  });

  it("uses default heidi@munchis.sv when BAKER_EMAILS is not set", async () => {
    delete process.env.BAKER_EMAILS;
    const user = { id: "u1", email: "heidi@munchis.sv" };
    mockGetUser.mockResolvedValue({
      data: { user },
      error: null,
    });
    const result = await verifyAuth(makeRequest({ Authorization: "Bearer valid-token" }));
    expect(result).toEqual(user);
  });

  it("extracts the token correctly from Bearer header", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "heidi@munchis.sv" } },
      error: null,
    });
    await verifyAuth(makeRequest({ Authorization: "Bearer my-secret-token" }));
    expect(mockGetUser).toHaveBeenCalledWith("my-secret-token");
  });

  it("caches the result and does not call Supabase again within TTL", async () => {
    const user = { id: "u1", email: "heidi@munchis.sv" };
    mockGetUser.mockResolvedValue({ data: { user }, error: null });

    await verifyAuth(makeRequest({ Authorization: "Bearer cached-token" }));
    await verifyAuth(makeRequest({ Authorization: "Bearer cached-token" }));

    // Only called once — second call served from cache
    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });

  it("invalidateToken removes a specific token from cache", async () => {
    const user = { id: "u1", email: "heidi@munchis.sv" };
    mockGetUser.mockResolvedValue({ data: { user }, error: null });

    await verifyAuth(makeRequest({ Authorization: "Bearer to-invalidate" }));
    expect(mockGetUser).toHaveBeenCalledTimes(1);

    invalidateToken("to-invalidate");

    await verifyAuth(makeRequest({ Authorization: "Bearer to-invalidate" }));
    // Called again because cache was invalidated
    expect(mockGetUser).toHaveBeenCalledTimes(2);
  });
});
