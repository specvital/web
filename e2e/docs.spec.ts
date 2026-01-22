import { expect, test } from "@playwright/test";

test.describe("Documentation Pages", () => {
  test.describe("Header Navigation", () => {
    test("should navigate to docs page from header Docs link", async ({
      page,
    }) => {
      await page.goto("/en");

      // Verify Docs link exists in header navigation
      const docsLink = page
        .getByRole("navigation", { name: /main/i })
        .getByRole("link", { name: "Docs" });
      await expect(docsLink).toBeVisible();

      // Click Docs link and wait for navigation
      await Promise.all([
        page.waitForURL("/en/docs"),
        docsLink.click(),
      ]);

      // Verify Docs link shows active state (has [active] attribute in accessibility tree)
      await expect(docsLink).toHaveAttribute("aria-current", "page");
    });

    test("should show Docs link alongside Explore and Pricing", async ({
      page,
    }) => {
      await page.goto("/en");

      const nav = page.getByRole("navigation", { name: /main/i });

      // Verify all three navigation links exist
      await expect(nav.getByRole("link", { name: "Explore" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Pricing" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Docs" })).toBeVisible();
    });
  });

  test.describe("Landing Page", () => {
    test("should display documentation landing page with all cards", async ({
      page,
    }) => {
      await page.goto("/en/docs");

      // Verify page title
      await expect(
        page.getByRole("heading", { name: "Documentation", level: 1 })
      ).toBeVisible();

      // Verify "How It Works" section
      await expect(
        page.getByRole("heading", { name: "How It Works", level: 2 })
      ).toBeVisible();

      // Verify 5 documentation cards exist
      const expectedCards = [
        {
          title: "Test Detection",
          href: "/en/docs/how-it-works/test-detection",
        },
        { title: "Usage & Billing", href: "/en/docs/how-it-works/usage-billing" },
        { title: "GitHub Access", href: "/en/docs/how-it-works/github-access" },
        {
          title: "Queue Processing",
          href: "/en/docs/how-it-works/queue-processing",
        },
        {
          title: "AI Spec Generation",
          href: "/en/docs/how-it-works/specview-generation",
        },
      ];

      for (const card of expectedCards) {
        const cardLink = page.getByRole("link", { name: new RegExp(card.title) });
        await expect(cardLink).toBeVisible();
        await expect(cardLink).toHaveAttribute("href", card.href);
      }
    });

    test("should navigate to individual doc page when card is clicked", async ({
      page,
    }) => {
      await page.goto("/en/docs");

      // Click Test Detection card
      await page
        .getByRole("link", { name: /Test Detection/ })
        .click();

      // Verify navigation to test-detection page
      await expect(page).toHaveURL("/en/docs/how-it-works/test-detection");
    });
  });

  test.describe("Sidebar Navigation", () => {
    // Desktop: sidebar is always visible (lg:block)
    // Mobile: sidebar is hidden, use sheet/dialog

    test("should display sidebar with all navigation links on desktop", async ({
      page,
    }) => {
      await page.goto("/en/docs/how-it-works/test-detection");

      // Desktop sidebar should be visible
      const docNav = page.getByRole("navigation", {
        name: /documentation navigation/i,
      });
      await expect(docNav).toBeVisible();

      // Verify all 5 document links are displayed
      await expect(docNav.getByRole("link", { name: "Test Detection" })).toBeVisible();
      await expect(docNav.getByRole("link", { name: "Usage & Billing" })).toBeVisible();
      await expect(docNav.getByRole("link", { name: "GitHub Access" })).toBeVisible();
      await expect(docNav.getByRole("link", { name: "Queue Processing" })).toBeVisible();
      await expect(docNav.getByRole("link", { name: "AI Spec Generation" })).toBeVisible();
    });

    test("should navigate to another doc page from sidebar", async ({
      page,
    }) => {
      await page.goto("/en/docs/how-it-works/test-detection");

      // Click Usage & Billing link in desktop sidebar
      const docNav = page.getByRole("navigation", {
        name: /documentation navigation/i,
      });
      await docNav.getByRole("link", { name: "Usage & Billing" }).click();

      // Verify navigation
      await expect(page).toHaveURL("/en/docs/how-it-works/usage-billing");
      await expect(
        page.getByRole("heading", { name: "Usage & Billing", level: 1 })
      ).toBeVisible();
    });

    test("should highlight current page in sidebar", async ({ page }) => {
      await page.goto("/en/docs/how-it-works/test-detection");

      // Verify Test Detection link is highlighted (uses bg-primary/10 class for active state)
      const docNav = page.getByRole("navigation", {
        name: /documentation navigation/i,
      });
      const testDetectionLink = docNav.getByRole("link", { name: "Test Detection" });
      await expect(testDetectionLink).toHaveClass(/bg-primary/);
    });
  });

  test.describe("Individual Page Content", () => {
    test("should display Test Detection page with supported frameworks table", async ({
      page,
    }) => {
      await page.goto("/en/docs/how-it-works/test-detection");

      // Verify page heading
      await expect(
        page.getByRole("heading", { name: "Test Detection", level: 1 })
      ).toBeVisible();

      // Verify supported frameworks section
      await expect(
        page.getByRole("heading", { name: "Supported Frameworks", level: 2 })
      ).toBeVisible();

      // Verify frameworks table exists with content
      const table = page.getByRole("table").first();
      await expect(table).toBeVisible();
      await expect(table.getByText("JavaScript / TypeScript")).toBeVisible();
      await expect(table.getByText(/Jest.*Vitest/)).toBeVisible();
    });

    test("should display Usage & Billing page with plan limits table", async ({
      page,
    }) => {
      await page.goto("/en/docs/how-it-works/usage-billing");

      // Verify page heading
      await expect(
        page.getByRole("heading", { name: "Usage & Billing", level: 1 })
      ).toBeVisible();

      // Verify plan limits section
      await expect(
        page.getByRole("heading", { name: "Plan Limits", level: 2 })
      ).toBeVisible();

      // Verify plan limits table
      const table = page.locator("table").filter({ hasText: "Plan" });
      await expect(table.getByText("Free")).toBeVisible();
      // Use exact match to avoid matching "Pro+"
      await expect(table.getByText("Pro", { exact: true })).toBeVisible();
    });

    test("should display GitHub Access page with OAuth scopes table", async ({
      page,
    }) => {
      await page.goto("/en/docs/how-it-works/github-access");

      // Verify page heading
      await expect(
        page.getByRole("heading", { name: "GitHub Access", level: 1 })
      ).toBeVisible();

      // Verify OAuth scopes section
      await expect(
        page.getByRole("heading", { name: "OAuth Scopes", level: 2 })
      ).toBeVisible();

      // Verify OAuth vs GitHub App comparison exists
      await expect(
        page.getByRole("heading", { name: "OAuth vs GitHub App", level: 2 })
      ).toBeVisible();
    });

    test("should display Queue Processing page with priority tiers table", async ({
      page,
    }) => {
      await page.goto("/en/docs/how-it-works/queue-processing");

      // Verify page heading
      await expect(
        page.getByRole("heading", { name: "Queue Processing", level: 1 })
      ).toBeVisible();

      // Verify priority tiers section
      await expect(
        page.getByRole("heading", { name: "Priority Tiers", level: 2 })
      ).toBeVisible();

      // Verify queue types are displayed (use exact match to avoid matching description text)
      await expect(page.getByText("Standard Queue", { exact: true })).toBeVisible();
      await expect(page.getByText("Priority Queue", { exact: true })).toBeVisible();
      await expect(page.getByText("Dedicated Queue", { exact: true })).toBeVisible();
    });

    test("should display AI Spec Generation page with test classification table", async ({
      page,
    }) => {
      await page.goto("/en/docs/how-it-works/specview-generation");

      // Verify page heading
      await expect(
        page.getByRole("heading", { name: "AI Spec Generation", level: 1 })
      ).toBeVisible();

      // Verify test classification section
      await expect(
        page.getByRole("heading", { name: "Test Classification", level: 2 })
      ).toBeVisible();

      // Verify classification types are displayed in table
      const table = page.locator("table").filter({ hasText: "Functional" });
      await expect(table).toBeVisible();
      await expect(table.getByText("Edge Case")).toBeVisible();
      await expect(table.getByText("Integration")).toBeVisible();
    });
  });
});
