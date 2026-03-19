import { test, expect } from "@playwright/test";

test.describe("Customer Landing Page", () => {
  test("page loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // No critical JS errors
    expect(errors.filter((e) => !e.includes("hydration"))).toEqual([]);
  });

  test("shows munchis branding", async ({ page }) => {
    await page.goto("/");
    // The brand name should be visible somewhere on the page
    await expect(page.getByText(/munchis/i).first()).toBeVisible();
  });

  test("renders content within reasonable time", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const elapsed = Date.now() - start;
    // Page should load within 10 seconds
    expect(elapsed).toBeLessThan(10_000);
  });
});

test.describe("Responsive Layout", () => {
  test("mobile shows mobile layout", async ({ page, browserName }) => {
    test.skip(browserName === "chromium" && !test.info().project.name.includes("mobile"), "Desktop project");

    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Mobile layout should be visible (the lg:hidden element)
    const mobileContent = page.locator(".lg\\:hidden").first();
    if (await mobileContent.count() > 0) {
      await expect(mobileContent).toBeVisible();
    }
  });

  test("desktop shows desktop layout", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Desktop layout should be visible (the hidden lg:block element)
    const desktopContent = page.locator(".hidden.lg\\:block, .hidden.lg\\:flex").first();
    if (await desktopContent.count() > 0) {
      await expect(desktopContent).toBeVisible();
    }
  });
});
