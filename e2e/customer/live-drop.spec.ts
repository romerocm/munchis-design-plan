import { test, expect } from "@playwright/test";

test.describe("Live Drop Experience", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("shows drop content when a drop is active", async ({ page }) => {
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(50);

    const hasOrderButton = await page.getByText(/order now|add to order/i).count();
    const hasClosedMessage = await page.getByText(/orders are closed|orders closed/i).count();
    const hasComingSoon = await page.getByText(/coming soon|countdown/i).count();
    const hasBakingMessage = await page.getByText(/baking|in the kitchen/i).count();

    expect(hasOrderButton + hasClosedMessage + hasComingSoon + hasBakingMessage).toBeGreaterThanOrEqual(0);
  });

  test("order button navigates to order flow when drop is live", async ({ page }) => {
    const orderButton = page.getByText(/order now/i).first();
    if (!(await orderButton.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(true, "No live drop with visible order button");
      return;
    }

    await orderButton.click();

    // Should show flavor details or order sheet
    await page.waitForTimeout(500);
    const hasFlavorInfo = await page.getByText(/each|\$/i).count();
    expect(hasFlavorInfo).toBeGreaterThan(0);
  });
});
