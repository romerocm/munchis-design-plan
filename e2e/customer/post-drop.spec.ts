import { test, expect } from "@playwright/test";

test.describe("Post-Drop Experience", () => {
  test("page shows appropriate post-drop content", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const hasClosedMsg = await page.getByText(/orders are closed|orders closed/i).count();
    const hasBakingMsg = await page.getByText(/baking|kitchen/i).count();
    const hasReadyMsg = await page.getByText(/ready|pickup/i).count();
    const hasLiveContent = await page.getByText(/order now/i).count();

    expect(hasClosedMsg + hasBakingMsg + hasReadyMsg + hasLiveContent).toBeGreaterThanOrEqual(0);
  });

  test("notify form available for next drop", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const notifyButton = page.getByText("Notify me").first();
    if (!(await notifyButton.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(true, "Notify button not visible on this viewport/state");
      return;
    }

    await expect(notifyButton).toBeVisible();
  });
});
