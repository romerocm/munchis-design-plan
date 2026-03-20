import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * In-memory cache for verified users. Avoids re-calling Supabase auth
 * for every API request when the same token is used within 60s.
 */
const verifiedCache = new Map<string, { user: User; expiresAt: number }>();

/** Clear the auth cache (used in tests) */
export function clearAuthCache() {
  verifiedCache.clear();
}

/**
 * Verify the authenticated user from a Bearer token in the request header.
 * Caches results for 60s to avoid slow Supabase auth round-trips.
 */
export async function verifyAuth(req: NextRequest): Promise<User | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  // Check cache first
  const cached = verifiedCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Only allow whitelisted baker emails
  const bakerEmails = (process.env.BAKER_EMAILS || "heidi@munchis.sv").split(",");
  if (!user.email || !bakerEmails.includes(user.email)) return null;

  // Cache for 60 seconds
  verifiedCache.set(token, { user, expiresAt: Date.now() + 60_000 });

  // Evict old entries periodically
  if (verifiedCache.size > 50) {
    const now = Date.now();
    for (const [k, v] of verifiedCache) {
      if (v.expiresAt < now) verifiedCache.delete(k);
    }
  }

  return user;
}
