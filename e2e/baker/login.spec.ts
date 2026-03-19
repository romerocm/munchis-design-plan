import { test, expect } from "@playwright/test";
import { TEST_BAKER } from "../fixtures/test-data";

test.describe("Baker Login", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/parrot/login");
    await page.waitForLoadState("networkidle");

    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /log in|sign in/i })).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/parrot/login");

    await page.getByPlaceholder(/email/i).fill("wrong@example.com");
    await page.getByPlaceholder(/password/i).fill("wrong-password");
    await page.getByRole("button", { name: /log in|sign in/i }).click();

    // Should show an error message
    await expect(page.getByText(/invalid|error|wrong|failed/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    // Skip if no test credentials configured
    if (!process.env.BAKER_PASSWORD) {
      test.skip(true, "BAKER_PASSWORD not set — skipping login test");
      return;
    }

    await page.goto("/parrot/login");

    await page.getByPlaceholder(/email/i).fill(TEST_BAKER.email);
    await page.getByPlaceholder(/password/i).fill(TEST_BAKER.password);
    await page.getByRole("button", { name: /log in|sign in/i }).click();

    await page.waitForURL("**/parrot/dashboard**", { timeout: 10_000 });
    expect(page.url()).toContain("/parrot/dashboard");
  });
});
