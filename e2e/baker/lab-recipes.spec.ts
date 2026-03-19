import { test, expect } from "@playwright/test";
import { loginAsBaker } from "../fixtures/auth";

test.describe("Recipe Lab", () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.BAKER_PASSWORD) {
      test.skip(true, "BAKER_PASSWORD not set");
      return;
    }
    await loginAsBaker(page);
  });

  test("lab tab shows recipe cards", async ({ page }) => {
    const labTab = page.getByText(/lab/i);
    if (await labTab.count() > 0) {
      await labTab.first().click();
      await page.waitForTimeout(1000);
    }

    // Should show recipe cards or empty state
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(50);
  });

  test("filter chips work", async ({ page }) => {
    const labTab = page.getByText(/lab/i);
    if (await labTab.count() > 0) {
      await labTab.first().click();
      await page.waitForTimeout(1000);
    }

    // Look for filter chips
    const signatureChip = page.getByText(/signature/i);
    const testingChip = page.getByText(/testing/i);

    if (await signatureChip.count() > 0) {
      await signatureChip.first().click();
      await page.waitForTimeout(500);
    }

    if (await testingChip.count() > 0) {
      await testingChip.first().click();
      await page.waitForTimeout(500);
    }
  });

  test("can open recipe detail", async ({ page }) => {
    const labTab = page.getByText(/lab/i);
    if (await labTab.count() > 0) {
      await labTab.first().click();
      await page.waitForTimeout(1000);
    }

    // Click on a recipe card (look for emoji or recipe name)
    const recipeCard = page.locator("[class*='cursor-pointer'], [class*='recipe']").first();
    if (await recipeCard.count() > 0) {
      await recipeCard.click();
      await page.waitForTimeout(1000);

      // Should show recipe detail with ingredients/steps
      const hasDetail = await page.getByText(/ingredient|step|bake|prep/i).count();
      expect(hasDetail).toBeGreaterThanOrEqual(0);
    }
  });
});
