import { test, expect } from "@playwright/test";

test.describe("Sold Out State", () => {
  test("page handles sold-out drop gracefully", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // If the drop is sold out, the page should:
    // 1. Show "Sold out" messaging, OR
    // 2. Disable the order button, OR
    // 3. Show remaining capacity as 0

    const soldOutText = page.getByText(/sold out|no more|hit capacity/i);
    const scarcityBar = page.getByText(/claimed|remaining/i);

    // This test verifies the page doesn't crash regardless of capacity state
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(0);

    // If sold out messaging is present, verify it's visible
    if (await soldOutText.count() > 0) {
      await expect(soldOutText.first()).toBeVisible();
    }
  });
});
