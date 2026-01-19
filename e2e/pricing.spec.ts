import { expect, test } from "@playwright/test";

test.describe("Pricing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/pricing");
  });

  test("should expand FAQ accordion", async ({ page }) => {
    const faqButton = page.getByRole("button", {
      name: "What is an AI Spec Document?",
    });

    // Verify FAQ button exists and is not expanded
    await expect(faqButton).toBeVisible();
    await expect(faqButton).not.toHaveAttribute("aria-expanded", "true");

    // Click to expand
    await faqButton.click();

    // Verify expanded state
    await expect(faqButton).toHaveAttribute("aria-expanded", "true");

    // Verify answer is visible
    await expect(
      page.getByText(/automatically organizes your test cases/i)
    ).toBeVisible();
  });

  test("should have all FAQ items", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "What is an AI Spec Document?" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "What is Analysis?" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "When will payments go live?" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "What is data retention?" })
    ).toBeVisible();
  });

  // Note: Pricing plan tests (display plans, Get Started buttons, Contact Us)
  // require API data and should be in pricing.mocked.spec.ts
});
