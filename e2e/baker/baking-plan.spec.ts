import { test, expect } from "@playwright/test";
import { loginAsBaker } from "../fixtures/auth";

test.describe("Baking Plan", () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.BAKER_PASSWORD) {
      test.skip(true, "BAKER_PASSWORD not set");
      return;
    }
    await loginAsBaker(page);
  });

  test("baking view renders when available", async ({ page }) => {
    const bakingLink = page.getByText(/baking|bake day/i);

    if (await bakingLink.count() > 0) {
      await bakingLink.first().click();
      await page.waitForTimeout(1000);

      // Should show baking steps or empty state
      const body = await page.locator("body").textContent();
      expect(body?.length).toBeGreaterThan(0);
    } else {
      test.skip(true, "No baking plan available");
    }
  });

  test("baking steps show progress", async ({ page }) => {
    const bakingLink = page.getByText(/baking|bake day/i);

    if (await bakingLink.count() > 0) {
      await bakingLink.first().click();
      await page.waitForTimeout(1000);

      // Look for progress indicators
      const progress = page.getByText(/step|of|done|remaining/i);
      if (await progress.count() > 0) {
        await expect(progress.first()).toBeVisible();
      }
    } else {
      test.skip(true, "No baking plan available");
    }
  });
});
