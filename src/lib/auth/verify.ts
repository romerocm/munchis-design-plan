import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

/**
 * Verify the authenticated user from a Bearer token in the request header.
 * Used by all /api/parrot/* routes.
 */
export async function verifyAuth(req: NextRequest): Promise<User | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Only allow whitelisted baker emails
  const bakerEmails = (process.env.BAKER_EMAILS || "heidi@munchis.sv").split(",");
  if (!user.email || !bakerEmails.includes(user.email)) return null;

  return user;
}
