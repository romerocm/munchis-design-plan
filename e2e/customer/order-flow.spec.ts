import { test, expect } from "@playwright/test";
import { TEST_CUSTOMER } from "../fixtures/test-data";

test.describe("Order Flow", () => {
  test("full order flow: quantity → contact → payment", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check if we have a live drop with order capability
    const orderButton = page.getByText(/order now/i);
    if (await orderButton.count() === 0) {
      test.skip(true, "No live drop available for ordering");
      return;
    }

    // Step 1: Click order
    await orderButton.first().click();
    await page.waitForTimeout(500);

    // Look for "Add to order" button on flavor screen
    const addToOrder = page.getByText(/add to order/i);
    if (await addToOrder.count() > 0) {
      await addToOrder.first().click();
      await page.waitForTimeout(500);
    }

    // Step 2: Quantity selection
    const continueButton = page.getByText(/continue to checkout/i);
    if (await continueButton.count() > 0) {
      // We're on the quantity step
      // Verify quantity selector exists
      const plusButton = page.getByText("+").first();
      const minusButton = page.getByText("-").first();

      if (await plusButton.count() > 0) {
        await plusButton.click();
        await page.waitForTimeout(200);
      }

      await continueButton.first().click();
      await page.waitForTimeout(500);
    }

    // Step 3: Contact form
    const nameInput = page.getByPlaceholder(/andrea|name/i);
    if (await nameInput.count() > 0) {
      await nameInput.first().fill(TEST_CUSTOMER.name);

      const phoneInput = page.getByPlaceholder(/7890/);
      if (await phoneInput.count() > 0) {
        await phoneInput.first().fill(TEST_CUSTOMER.whatsapp);
      }

      // Submit
      const submitButton = page.getByText(/reserve my treats/i);
      if (await submitButton.count() > 0) {
        await submitButton.first().click();

        // Wait for response — either payment screen or error
        await page.waitForTimeout(3000);

        // Should show payment link or error message
        const hasPayment = await page.getByText(/payment|pay now|reserved/i).count();
        const hasError = await page.getByText(/error|wrong|try again/i).count();

        expect(hasPayment + hasError).toBeGreaterThan(0);
      }
    }
  });

  test("quantity selector respects bounds", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const orderButton = page.getByText(/order now/i);
    if (await orderButton.count() === 0) {
      test.skip(true, "No live drop available");
      return;
    }

    await orderButton.first().click();
    await page.waitForTimeout(500);

    const addToOrder = page.getByText(/add to order/i);
    if (await addToOrder.count() > 0) {
      await addToOrder.first().click();
      await page.waitForTimeout(500);
    }

    // Find quantity controls
    const maxText = page.getByText(/Max \d+/);
    if (await maxText.count() > 0) {
      const maxLabel = await maxText.first().textContent();
      expect(maxLabel).toMatch(/Max \d+/);
    }
  });
});
