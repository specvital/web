import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as hooks from "../hooks";
import { TaskBadge } from "./task-badge";

const messages = {
  backgroundTasks: {
    badge: {
      ariaLabel: "{count, plural, =1 {1 task in progress} other {# tasks in progress}}",
    },
  },
};

const renderWithIntl = (ui: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
};

describe("TaskBadge", () => {
  beforeEach(() => {
    vi.spyOn(hooks, "useActiveTaskCount");
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("should render nothing when no active tasks", () => {
    vi.mocked(hooks.useActiveTaskCount).mockReturnValue(0);

    const { container } = renderWithIntl(<TaskBadge />);

    expect(container.firstChild).toBeNull();
  });

  it("should render badge when tasks are active", () => {
    vi.mocked(hooks.useActiveTaskCount).mockReturnValue(1);

    renderWithIntl(<TaskBadge />);

    const badge = screen.getByLabelText("1 task in progress");
    expect(badge).toBeInTheDocument();
  });

  it("should render badge with multiple tasks", () => {
    vi.mocked(hooks.useActiveTaskCount).mockReturnValue(3);

    renderWithIntl(<TaskBadge />);

    const badge = screen.getByLabelText("3 tasks in progress");
    expect(badge).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    vi.mocked(hooks.useActiveTaskCount).mockReturnValue(1);

    renderWithIntl(<TaskBadge className="custom-class" />);

    const badge = screen.getByLabelText("1 task in progress");
    expect(badge).toHaveClass("custom-class");
  });
});
