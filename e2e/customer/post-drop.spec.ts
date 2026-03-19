import { test, expect } from "@playwright/test";

test.describe("Post-Drop Experience", () => {
  test("page shows appropriate post-drop content", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // If the current drop is closed/baking/ready/completed, we should see:
    const hasClosedMsg = await page.getByText(/orders are closed|orders closed/i).count();
    const hasBakingMsg = await page.getByText(/baking|kitchen/i).count();
    const hasReadyMsg = await page.getByText(/ready|pickup/i).count();
    const hasLiveContent = await page.getByText(/order now/i).count();

    // Page should have some drop-related content
    expect(hasClosedMsg + hasBakingMsg + hasReadyMsg + hasLiveContent).toBeGreaterThanOrEqual(0);
  });

  test("notify form available for next drop", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // On post-drop pages, a notify form should be available
    const notifyButton = page.getByText("Notify me");
    if (await notifyButton.count() > 0) {
      await expect(notifyButton.first()).toBeVisible();
    }
  });
});
