import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fetchWithTimeout } from "./fetch-with-timeout";

/**
 * Create a Supabase client for server components/actions that uses
 * the publishable key + cookies for auth verification.
 * Unlike the service-role client in server.ts, this operates in the
 * user's auth context and is used for session verification only.
 */
export async function createAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { fetch: fetchWithTimeout },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can throw in Server Components when called from
            // a read-only context. This is safe to ignore — the middleware
            // handles cookie refreshes on the response.
          }
        },
      },
    }
  );
}
