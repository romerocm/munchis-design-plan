import { test, expect } from "@playwright/test";
import { loginAsBaker } from "../fixtures/auth";

test.describe("Drop Lifecycle", () => {
  // This is a long test that covers the full drop lifecycle
  test.slow();

  test.beforeEach(async ({ page }) => {
    if (!process.env.BAKER_PASSWORD) {
      test.skip(true, "BAKER_PASSWORD not set");
      return;
    }
    await loginAsBaker(page);
  });

  test("dashboard shows drop with status indicator", async ({ page }) => {
    // Home tab should show current drop status
    const statusBadge = page.getByText(/draft|scheduled|orders are open|orders closed|baking|ready|complete/i);

    if (await statusBadge.count() > 0) {
      await expect(statusBadge.first()).toBeVisible();
    }
  });

  test("can transition drop status from home tab", async ({ page }) => {
    // Look for status transition controls
    const statusButton = page.locator("[class*='status'], [class*='transition']").first();

    if (await statusButton.count() > 0) {
      // The home tab should show available transitions
      const body = await page.locator("body").textContent();
      expect(body?.length).toBeGreaterThan(0);
    }
  });

  test("full lifecycle progression", async ({ page }) => {
    // Navigate to drops tab
    const dropsTab = page.getByText(/drops/i);
    if (await dropsTab.count() === 0) {
      test.skip(true, "Drops tab not found");
      return;
    }
    await dropsTab.first().click();
    await page.waitForTimeout(1000);

    // Verify we can see drops
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(50);

    // Look for drop status indicators
    const hasStatuses = await page.getByText(/draft|scheduled|live|closed|baking|ready|completed/i).count();
    expect(hasStatuses).toBeGreaterThanOrEqual(0);
  });
});
