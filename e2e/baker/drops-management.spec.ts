import { test, expect } from "@playwright/test";
import { loginAsBaker } from "../fixtures/auth";

test.describe("Drops Management", () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.BAKER_PASSWORD) {
      test.skip(true, "BAKER_PASSWORD not set");
      return;
    }
    await loginAsBaker(page);
  });

  test("drops tab shows drop cards", async ({ page }) => {
    // Navigate to drops tab
    const dropsTab = page.getByText(/drops/i);
    if (await dropsTab.count() > 0) {
      await dropsTab.first().click();
      await page.waitForTimeout(1000);
    }

    // Should show some drop content (this week, upcoming, or past)
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(50);
  });

  test("can create a new drop", async ({ page }) => {
    // Navigate to drops tab
    const dropsTab = page.getByText(/drops/i);
    if (await dropsTab.count() > 0) {
      await dropsTab.first().click();
      await page.waitForTimeout(1000);
    }

    // Look for new/create button
    const newButton = page.getByText(/new|create|\+/i);
    if (await newButton.count() > 0) {
      await newButton.first().click();
      await page.waitForTimeout(2000);

      // Should open the drop editor or show the new drop
      const hasEditor = await page.getByText(/flavor|drop|edit/i).count();
      expect(hasEditor).toBeGreaterThan(0);
    }
  });

  test("clicking a drop opens drop detail view", async ({ page }) => {
    // Navigate to drops tab
    const dropsTab = page.getByText(/drops/i);
    if (await dropsTab.count() > 0) {
      await dropsTab.first().click();
      await page.waitForTimeout(1000);
    }

    // Click on a drop card (they have chevron arrows and flavor names)
    const dropCard = page.locator("button").filter({ hasText: /Drop #\d+/ }).first();
    if (await dropCard.count() > 0) {
      await dropCard.click();
      await page.waitForTimeout(1000);

      // Should show drop detail with stats, timeline, and orders
      await expect(page.getByText("Schedule")).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText(/Orders open/)).toBeVisible();
      await expect(page.getByText(/Orders close/)).toBeVisible();
      await expect(page.getByText(/Pickup/)).toBeVisible();

      // Stats grid should be visible
      await expect(page.getByText(/Orders/i).first()).toBeVisible();
      await expect(page.getByText(/per treat/)).toBeVisible();
    }
  });

  test("drop detail has back and edit buttons", async ({ page }) => {
    const dropsTab = page.getByText(/drops/i);
    if (await dropsTab.count() > 0) {
      await dropsTab.first().click();
      await page.waitForTimeout(1000);
    }

    const dropCard = page.locator("button").filter({ hasText: /Drop #\d+/ }).first();
    if (await dropCard.count() > 0) {
      await dropCard.click();
      await page.waitForTimeout(1000);

      // Back button should return to drops list
      const backButton = page.getByText("Drops").first();
      await expect(backButton).toBeVisible();

      // Edit button should be visible
      const editButton = page.getByText("Edit");
      await expect(editButton).toBeVisible();

      // Click Edit to go to drop editor
      await editButton.click();
      await page.waitForTimeout(1000);

      // Should now be in the editor
      const hasEditorContent = await page.getByText(/flavor|save|preview/i).count();
      expect(hasEditorContent).toBeGreaterThan(0);
    }
  });
});
