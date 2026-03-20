"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { checkRateLimit } from "@/lib/auth/rate-limit";

interface LoginResult {
  error?: string;
  rateLimited?: boolean;
  retryAfter?: number;
}

/**
 * Server action for baker login. Runs rate limiting server-side
 * before delegating to Supabase Auth.
 */
export async function loginAction(
  email: string,
  password: string
): Promise<LoginResult> {
  // Get client IP for rate limiting
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown";

  const { allowed, retryAfter } = checkRateLimit(ip);
  if (!allowed) {
    return {
      error: "Too many login attempts. Please try again later.",
      rateLimited: true,
      retryAfter,
    };
  }

  // Create a Supabase client with cookie handling for server actions
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { error: "Invalid credentials" };
  }

  return {};
}
