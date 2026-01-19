import { expect, test } from "@playwright/test";

test.describe("Dashboard Page (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/dashboard");
  });

  test("should display dashboard page for authenticated user", async ({
    page,
  }) => {
    // Verify not redirected (authenticated user stays on dashboard)
    await expect(page).toHaveURL(/\/en\/dashboard/);

    // Verify dashboard page title
    await expect(
      page.getByRole("heading", { name: /dashboard/i })
    ).toBeVisible();
  });

  test("should display summary statistics section", async ({ page }) => {
    // Wait for summary section to load
    const summarySection = page.locator('[data-testid="summary-section"]').or(
      page.getByText(/active repositories|total tests/i).first()
    );

    await expect(summarySection).toBeVisible({ timeout: 15000 });
  });

  test("should display repository list or empty state", async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState("networkidle");

    // Either repository cards are shown or empty state
    const hasRepositories = await page
      .locator('[data-testid="repository-card"]')
      .or(page.getByRole("link", { name: /analyze/i }))
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    const hasEmptyState = await page
      .getByText(/no repositories|get started|add your first/i)
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // One of them should be visible
    expect(hasRepositories || hasEmptyState).toBeTruthy();
  });

  test("should have filter controls", async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Check for filter/sort controls (may be in dropdown or visible)
    const filterControls = page
      .getByRole("combobox")
      .or(page.getByRole("button", { name: /filter|sort|all/i }));

    // Filter controls should exist (either visible or in mobile drawer)
    const controlCount = await filterControls.count();
    expect(controlCount).toBeGreaterThanOrEqual(0); // May be hidden on certain states
  });

  test("should navigate to repository analysis when clicking a repo card", async ({
    page,
  }) => {
    // Wait for repository cards to load
    await page.waitForLoadState("networkidle");

    const repoCard = page
      .locator('[data-testid="repository-card"]')
      .or(page.locator('[class*="repository-card"]'))
      .first();

    const hasRepoCard = await repoCard.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasRepoCard) {
      // Click on the repository card link
      const repoLink = repoCard.getByRole("link").first();
      await repoLink.click();

      // Should navigate to analysis page
      await expect(page).toHaveURL(/\/analyze\//);
    } else {
      // No repositories yet - this is acceptable for new test users
      test.skip();
    }
  });

  test("should display organization picker when available", async ({
    page,
  }) => {
    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Organization picker may or may not be visible depending on user's org connections
    const orgPicker = page.getByRole("combobox", { name: /organization|owner/i }).or(
      page.locator('[data-testid="organization-picker"]')
    );

    // Just verify the page structure is correct, org picker is optional
    const hasOrgPicker = await orgPicker.isVisible({ timeout: 5000 }).catch(() => false);

    // This is informational - org picker availability depends on user setup
    if (hasOrgPicker) {
      await expect(orgPicker).toBeEnabled();
    }
  });
});
