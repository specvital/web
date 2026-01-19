import { expect, test } from "@playwright/test";

test.describe("Account Page (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/account");
  });

  test("should display account page for authenticated user", async ({
    page,
  }) => {
    // Verify not redirected (authenticated user stays on account page)
    await expect(page).toHaveURL(/\/en\/account/);

    // Verify account page title
    await expect(
      page.getByRole("heading", { name: /account/i })
    ).toBeVisible();
  });

  test("should display current plan section", async ({ page }) => {
    // Wait for plan section to load
    await expect(page.getByText(/current plan/i)).toBeVisible({
      timeout: 10000,
    });

    // Verify plan tier is displayed (Free, Pro, Pro+, or Enterprise)
    const planTiers = page.getByText(/free|pro|enterprise/i);
    await expect(planTiers.first()).toBeVisible();
  });

  test("should display usage section", async ({ page }) => {
    // Wait for usage section to load
    await expect(page.getByText(/usage this period/i)).toBeVisible({
      timeout: 10000,
    });

    // Verify usage metrics are displayed
    await expect(page.getByText(/ai spec docs/i)).toBeVisible();
    await expect(page.getByText(/analysis/i)).toBeVisible();
  });

  test("should display data retention information", async ({ page }) => {
    // Verify data retention info is shown in plan details
    await expect(page.getByText(/data retention/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
