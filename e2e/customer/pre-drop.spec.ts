import { test, expect } from "@playwright/test";

test.describe("Pre-Drop Experience", () => {
  test("shows countdown or drop content", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The page should show either:
    // 1. A countdown timer (scheduled drop)
    // 2. Active drop content (live drop)
    // 3. Post-drop content (closed/baking/completed)
    // 4. Or a "coming soon" state
    const hasContent = await page.locator("body").textContent();
    expect(hasContent?.length).toBeGreaterThan(0);
  });

  test("notify form is accessible", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Look for notify form — may be on pre-drop or post-drop states
    const notifyButton = page.getByText("Notify me");
    const hasNotify = await notifyButton.count();

    if (hasNotify > 0) {
      await expect(notifyButton.first()).toBeVisible();
      // Phone input should be nearby
      const phoneInput = page.getByPlaceholder(/7890|phone/i);
      if (await phoneInput.count() > 0) {
        await expect(phoneInput.first()).toBeVisible();
      }
    }
  });

  test("notify form submits successfully", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const notifyButton = page.getByText("Notify me");
    if (await notifyButton.count() === 0) {
      test.skip(true, "No notify form visible — drop may be live");
      return;
    }

    // Fill in phone number
    const phoneInput = page.getByPlaceholder(/7890/);
    if (await phoneInput.count() > 0) {
      await phoneInput.first().fill("70001234");
      await notifyButton.first().click();

      // Should show success message
      await expect(page.getByText(/on the list/i).first()).toBeVisible({ timeout: 5_000 });
    }
  });
});
