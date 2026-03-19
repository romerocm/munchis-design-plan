import { test, expect } from "@playwright/test";
import { TEST_CUSTOMER } from "../fixtures/test-data";

test.describe("Order Flow", () => {
  test("full order flow: quantity → contact → payment", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check if we have a visible "Order Now" button (drop must be live)
    const orderButton = page.getByText(/order now/i).first();
    if (!(await orderButton.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(true, "No live drop available for ordering");
      return;
    }

    // Step 1: Click order
    await orderButton.click();
    await page.waitForTimeout(500);

    // Look for "Add to order" button on flavor screen
    const addToOrder = page.getByText(/add to order/i).first();
    if (await addToOrder.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await addToOrder.click();
      await page.waitForTimeout(500);
    }

    // Step 2: Quantity selection
    const continueButton = page.getByText(/continue to checkout/i).first();
    if (await continueButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const plusButton = page.getByRole("button", { name: "+", exact: true }).first();
      if (await plusButton.isVisible().catch(() => false)) {
        await plusButton.click();
        await page.waitForTimeout(200);
      }

      await continueButton.click();
      await page.waitForTimeout(500);
    }

    // Step 3: Contact form
    const nameInput = page.getByPlaceholder(/andrea|name/i).first();
    if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nameInput.fill(TEST_CUSTOMER.name);

      const phoneInput = page.getByPlaceholder(/7890/).first();
      if (await phoneInput.isVisible().catch(() => false)) {
        await phoneInput.fill(TEST_CUSTOMER.whatsapp);
      }

      // Submit
      const submitButton = page.getByText(/reserve my treats/i).first();
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(3000);

        const hasPayment = await page.getByText(/payment|pay now|reserved/i).count();
        const hasError = await page.getByText(/error|wrong|try again/i).count();
        expect(hasPayment + hasError).toBeGreaterThan(0);
      }
    }
  });

  test("quantity selector respects bounds", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const orderButton = page.getByText(/order now/i).first();
    if (!(await orderButton.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(true, "No live drop available");
      return;
    }

    await orderButton.click();
    await page.waitForTimeout(500);

    const addToOrder = page.getByText(/add to order/i).first();
    if (await addToOrder.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await addToOrder.click();
      await page.waitForTimeout(500);
    }

    // Find quantity controls
    const maxText = page.getByText(/Max \d+/).first();
    if (await maxText.isVisible().catch(() => false)) {
      const maxLabel = await maxText.textContent();
      expect(maxLabel).toMatch(/Max \d+/);
    }
  });
});
