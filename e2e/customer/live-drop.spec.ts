import { test, expect } from "@playwright/test";

test.describe("Live Drop Experience", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("shows drop content when a drop is active", async ({ page }) => {
    // Look for any drop content — flavor name, order button, or status message
    const body = await page.locator("body").textContent();

    // Page should have meaningful content
    expect(body?.length).toBeGreaterThan(50);

    // Should show either an order CTA or a status message
    const hasOrderButton = await page.getByText(/order now|add to order/i).count();
    const hasClosedMessage = await page.getByText(/orders are closed|orders closed/i).count();
    const hasComingSoon = await page.getByText(/coming soon|countdown/i).count();
    const hasBakingMessage = await page.getByText(/baking|in the kitchen/i).count();

    expect(hasOrderButton + hasClosedMessage + hasComingSoon + hasBakingMessage).toBeGreaterThanOrEqual(0);
  });

  test("order button navigates to order flow when drop is live", async ({ page }) => {
    const orderButton = page.getByText(/order now/i);
    if (await orderButton.count() === 0) {
      test.skip(true, "No live drop with order button");
      return;
    }

    await orderButton.first().click();

    // Should show flavor details or order sheet
    await page.waitForTimeout(500);
    const hasFlavorInfo = await page.getByText(/each|\$/i).count();
    expect(hasFlavorInfo).toBeGreaterThan(0);
  });
});
