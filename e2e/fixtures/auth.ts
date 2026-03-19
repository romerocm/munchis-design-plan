import { type Page } from "@playwright/test";

/**
 * Log in as the baker (Heidi) via the /parrot/login page.
 * Requires BAKER_EMAIL and BAKER_PASSWORD env vars or defaults to test credentials.
 */
export async function loginAsBaker(page: Page) {
  const email = process.env.BAKER_EMAIL || "heidi@munchis.sv";
  const password = process.env.BAKER_PASSWORD || "test-password";

  await page.goto("/parrot/login");
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole("button", { name: /log in|sign in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL("**/parrot/dashboard**", { timeout: 10_000 });
}

/**
 * Get stored auth token from localStorage (after login).
 */
export async function getStoredToken(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    // Supabase stores tokens in localStorage
    for (const key of Object.keys(localStorage)) {
      if (key.includes("supabase") && key.includes("auth")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "");
          return data?.access_token || null;
        } catch {
          return null;
        }
      }
    }
    return null;
  });
}
