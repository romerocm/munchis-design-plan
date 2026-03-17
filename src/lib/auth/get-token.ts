import { createClient } from "@/lib/supabase/client";

/**
 * Get the current auth session's access token.
 * Returns null if not authenticated.
 */
export async function getToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
