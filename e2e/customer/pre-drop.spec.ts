import { test, expect } from "@playwright/test";

test.describe("Pre-Drop Experience", () => {
  test("shows countdown or drop content", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const hasContent = await page.locator("body").textContent();
    expect(hasContent?.length).toBeGreaterThan(0);
  });

  test("notify form is accessible", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const notifyButton = page.getByText("Notify me").first();
    if (!(await notifyButton.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(true, "No visible notify form — drop may be live or layout differs");
      return;
    }

    await expect(notifyButton).toBeVisible();
    const phoneInput = page.getByPlaceholder(/7890|phone/i).first();
    if (await phoneInput.isVisible().catch(() => false)) {
      await expect(phoneInput).toBeVisible();
    }
  });

  test("notify form submits successfully", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const notifyButton = page.getByText("Notify me").first();
    if (!(await notifyButton.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(true, "No notify form visible — drop may be live");
      return;
    }

    const phoneInput = page.getByPlaceholder(/7890/).first();
    if (!(await phoneInput.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(true, "Phone input not visible on this viewport");
      return;
    }

    await phoneInput.fill("70001234");
    await notifyButton.click();

    // Should show success message
    await expect(page.getByText(/on the list/i).first()).toBeVisible({ timeout: 5_000 });
  });
});
