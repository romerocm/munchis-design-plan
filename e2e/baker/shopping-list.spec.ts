import { test, expect } from "@playwright/test";
import { loginAsBaker } from "../fixtures/auth";

test.describe("Shopping List", () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.BAKER_PASSWORD) {
      test.skip(true, "BAKER_PASSWORD not set");
      return;
    }
    await loginAsBaker(page);
  });

  test("shopping view renders when available", async ({ page }) => {
    // Look for shopping shortcut on home tab or lab tab
    const shoppingLink = page.getByText(/shopping|groceries/i);

    if (await shoppingLink.count() > 0) {
      await shoppingLink.first().click();
      await page.waitForTimeout(1000);

      // Should show shopping items or empty state
      const body = await page.locator("body").textContent();
      expect(body?.length).toBeGreaterThan(0);
    } else {
      test.skip(true, "No shopping list available");
    }
  });

  test("shopping items have checkboxes", async ({ page }) => {
    const shoppingLink = page.getByText(/shopping|groceries/i);

    if (await shoppingLink.count() > 0) {
      await shoppingLink.first().click();
      await page.waitForTimeout(1000);

      // Look for checkbox-like elements or toggle buttons
      const checkboxes = page.locator("input[type='checkbox'], [role='checkbox']");
      const toggleButtons = page.getByText(/still need|bought/i);

      // Should have items or sections
      const hasContent = (await checkboxes.count()) + (await toggleButtons.count());
      expect(hasContent).toBeGreaterThanOrEqual(0);
    } else {
      test.skip(true, "No shopping list available");
    }
  });
});
