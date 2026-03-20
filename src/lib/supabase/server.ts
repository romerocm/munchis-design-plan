import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { fetchWithTimeout } from "./fetch-with-timeout";

export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { global: { fetch: fetchWithTimeout } }
  );
}
