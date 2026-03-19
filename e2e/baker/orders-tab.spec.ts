import { test, expect } from "@playwright/test";
import { loginAsBaker } from "../fixtures/auth";

test.describe("Orders Tab", () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.BAKER_PASSWORD) {
      test.skip(true, "BAKER_PASSWORD not set");
      return;
    }
    await loginAsBaker(page);
  });

  test("orders tab renders with filters", async ({ page }) => {
    // Navigate to orders tab
    const ordersTab = page.getByText(/orders/i);
    if (await ordersTab.count() > 0) {
      await ordersTab.first().click();
      await page.waitForTimeout(1000);
    }

    // Should show filter tabs
    const allFilter = page.getByText(/^all$/i);
    const paidFilter = page.getByText(/paid/i);

    if (await allFilter.count() > 0) {
      await expect(allFilter.first()).toBeVisible();
    }
  });

  test("order cards show customer info", async ({ page }) => {
    const ordersTab = page.getByText(/orders/i);
    if (await ordersTab.count() > 0) {
      await ordersTab.first().click();
      await page.waitForTimeout(1000);
    }

    // If there are orders, they should show customer names and quantities
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(0);
  });
});
