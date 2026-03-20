import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { limiters, getTier } from "@/lib/rate-limit";

/**
 * Extract the client IP address from proxy headers or the request itself.
 */
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Add security headers to a response.
 */
function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

/**
 * Verify the Supabase session from cookies. Returns the authenticated user
 * or null. Also refreshes session cookies on the response when needed.
 */
async function verifySession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, response: supabaseResponse };
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── Auth guard for /parrot/* routes (except /parrot/login) ───
  if (pathname.startsWith("/parrot/") && pathname !== "/parrot/login") {
    const { user, response } = await verifySession(req);

    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/parrot/login";
      return NextResponse.redirect(url);
    }

    // Enforce baker email whitelist
    const bakerEmails = (process.env.BAKER_EMAILS || "heidi@munchis.sv").split(
      ","
    );
    if (!user.email || !bakerEmails.includes(user.email)) {
      const url = req.nextUrl.clone();
      url.pathname = "/parrot/login";
      return NextResponse.redirect(url);
    }

    return withSecurityHeaders(response);
  }

  // ─── Rate limiting for /api/* routes ───
  if (pathname.startsWith("/api/")) {
    const tier = getTier(pathname, req.method);

    // Skip rate limiting for webhooks — providers use shared IPs
    if (tier === "webhook") {
      return withSecurityHeaders(NextResponse.next());
    }

    const ip = getClientIp(req);

    // If we can't identify the client, let the request through
    if (ip === "unknown") {
      return withSecurityHeaders(NextResponse.next());
    }

    const limiter = limiters[tier];
    const key = `${ip}:${tier}`;
    const result = limiter.check(key);

    if (!result.allowed) {
      const retryAfterSecs = Math.ceil((result.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, retryAfterSecs)),
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
            "X-Content-Type-Options": "nosniff",
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(result.limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set(
      "X-RateLimit-Reset",
      String(Math.ceil(result.resetAt / 1000))
    );
    return withSecurityHeaders(response);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/parrot/((?!login).*)", "/api/:path*"],
};
