import { NextRequest } from "next/server";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}

/**
 * Build a NextRequest for testing API route handlers.
 */
export function buildRequest(path: string, options: RequestOptions = {}): NextRequest {
  const { method = "GET", body, headers = {}, searchParams } = options;

  const url = new URL(path, "http://localhost:3695");
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const init: RequestInit = { method, headers: { ...headers } };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  return new NextRequest(url, init);
}

/**
 * Build an authenticated request with a Bearer token.
 */
export function buildAuthRequest(path: string, options: RequestOptions = {}): NextRequest {
  return buildRequest(path, {
    ...options,
    headers: {
      Authorization: "Bearer test-baker-token",
      ...options.headers,
    },
  });
}
