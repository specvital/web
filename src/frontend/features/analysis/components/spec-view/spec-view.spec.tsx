import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { CacheIndicator } from "./cache-indicator";
import { LanguageSelector } from "./language-selector";
import { SpecItem } from "./spec-item";
import { SpecViewSkeleton } from "./spec-view-skeleton";

const messages = {
  analyze: {
    specView: {
      cancel: "Cancel",
      convert: "Convert",
      errorTitle: "Conversion Failed",
      generatedAt: "Generated {time}",
      languageLabel: "Language",
      regenerate: "Regenerate",
      retry: "Try Again",
      summary: "{total} tests ({cached} cached, {converted} converted)",
    },
  },
};

describe("SpecItem", () => {
  it("renders converted name and original name on hover", () => {
    const item = {
      convertedName: "User authentication check",
      isFromCache: true,
      line: 42,
      originalName: "should authenticate user when credentials valid",
      status: "active" as const,
    };

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SpecItem index={0} item={item} totalItems={1} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("User authentication check")).toBeInTheDocument();
    expect(screen.getByText("should authenticate user when credentials valid")).toBeInTheDocument();
    expect(screen.getByText("L:42")).toBeInTheDocument();
  });

  it("displays correct status for different statuses via sr-only text", () => {
    const statuses = ["active", "focused", "skipped", "todo", "xfail"] as const;

    for (const status of statuses) {
      const item = {
        convertedName: `Test for ${status}`,
        isFromCache: false,
        line: 1,
        originalName: "original",
        status,
      };

      const { unmount } = render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <SpecItem index={0} item={item} totalItems={1} />
        </NextIntlClientProvider>
      );

      const statusLabels: Record<typeof status, string> = {
        active: "Active test",
        focused: "Focused test",
        skipped: "Skipped test",
        todo: "Todo test",
        xfail: "Expected failure",
      };

      expect(screen.getByText(`, ${statusLabels[status]}`)).toBeInTheDocument();
      unmount();
    }
  });

  it("has correct ARIA attributes for tree navigation", () => {
    const item = {
      convertedName: "Test item",
      isFromCache: false,
      line: 10,
      originalName: "original",
      status: "active" as const,
    };

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SpecItem index={2} item={item} totalItems={5} />
      </NextIntlClientProvider>
    );

    const treeItem = screen.getByRole("treeitem");
    expect(treeItem).toHaveAttribute("aria-level", "3");
    expect(treeItem).toHaveAttribute("aria-posinset", "3");
    expect(treeItem).toHaveAttribute("aria-setsize", "5");
  });
});

describe("LanguageSelector", () => {
  it("renders with current language", () => {
    const onChange = vi.fn();

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LanguageSelector onChange={onChange} value="en" />
      </NextIntlClientProvider>
    );

    expect(screen.getByRole("button")).toHaveTextContent("English");
  });
});

describe("SpecViewSkeleton", () => {
  it("renders loading skeleton", () => {
    render(<SpecViewSkeleton />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading spec view");
  });
});

describe("CacheIndicator", () => {
  const defaultProps = {
    convertedAt: "2026-01-05T10:30:00Z",
    isRegenerating: false,
    onRegenerate: vi.fn(),
  };

  const renderWithIntl = (ui: React.ReactElement, now?: Date) =>
    render(
      <NextIntlClientProvider locale="en" messages={messages} now={now} timeZone="UTC">
        {ui}
      </NextIntlClientProvider>
    );

  it("renders relative time", () => {
    renderWithIntl(<CacheIndicator {...defaultProps} />, new Date("2026-01-05T11:30:00Z"));

    expect(screen.getByText(/Generated/)).toBeInTheDocument();
  });

  it("displays regenerate button", () => {
    renderWithIntl(<CacheIndicator {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Regenerate" })).toBeInTheDocument();
  });

  it("calls onRegenerate when button clicked", () => {
    const onRegenerate = vi.fn();

    renderWithIntl(<CacheIndicator {...defaultProps} onRegenerate={onRegenerate} />);

    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it("disables button when regenerating", () => {
    renderWithIntl(<CacheIndicator {...defaultProps} isRegenerating={true} />);

    expect(screen.getByRole("button", { name: "Regenerate" })).toBeDisabled();
  });

  it("shows spinning animation when regenerating", () => {
    renderWithIntl(<CacheIndicator {...defaultProps} isRegenerating={true} />);

    const button = screen.getByRole("button", { name: "Regenerate" });
    const svg = button.querySelector("svg");
    expect(svg).toHaveClass("animate-spin");
  });
});
