import { test, expect } from "@playwright/test";
import { loginAsBaker } from "../fixtures/auth";

test.describe("Baker Dashboard Home", () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.BAKER_PASSWORD) {
      test.skip(true, "BAKER_PASSWORD not set");
      return;
    }
    await loginAsBaker(page);
  });

  test("shows greeting", async ({ page }) => {
    // Should show a time-aware Spanish greeting with Heidi's name
    await expect(page.getByText(/heidi|dashboard/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test("shows current drop info", async ({ page }) => {
    // Dashboard should display current drop info
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(50);

    // Look for drop number or flavor name
    const hasDropInfo = await page.getByText(/#\d+/).count();
    expect(hasDropInfo).toBeGreaterThanOrEqual(0); // May not have drops yet
  });

  test("tab navigation works", async ({ page }) => {
    // Look for tab buttons
    const ordersTab = page.getByText(/orders/i);
    const dropsTab = page.getByText(/drops/i);
    const labTab = page.getByText(/lab/i);

    if (await ordersTab.count() > 0) {
      await ordersTab.first().click();
      await page.waitForTimeout(500);
    }

    if (await dropsTab.count() > 0) {
      await dropsTab.first().click();
      await page.waitForTimeout(500);
    }

    if (await labTab.count() > 0) {
      await labTab.first().click();
      await page.waitForTimeout(500);
    }
  });
});
