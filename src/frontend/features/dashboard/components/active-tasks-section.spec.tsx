import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import * as bgTasks from "@/lib/background-tasks";
import type { BackgroundTask } from "@/lib/background-tasks";

import { ActiveTasksSection } from "./active-tasks-section";

const messages = {
  backgroundTasks: {
    activeTasks: {
      countBadge: "{count}",
      title: "Active Tasks",
      viewTask: "View",
    },
    status: {
      processing: "Processing {time}",
      queued: "Queued",
    },
    taskType: {
      analysis: "Analysis",
      "spec-generation": "Spec Generation",
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

const createTask = (overrides: Partial<BackgroundTask> = {}): BackgroundTask => ({
  createdAt: new Date().toISOString(),
  id: "task-1",
  metadata: {
    analysisId: "analysis-123",
    owner: "test-owner",
    repo: "test-repo",
  },
  startedAt: new Date(Date.now() - 45000).toISOString(),
  status: "processing",
  type: "spec-generation",
  ...overrides,
});

describe("ActiveTasksSection", () => {
  beforeEach(() => {
    vi.spyOn(bgTasks, "useBackgroundTasks");
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should render nothing when no active tasks", () => {
    vi.mocked(bgTasks.useBackgroundTasks).mockReturnValue([]);

    const { container } = renderWithIntl(<ActiveTasksSection />);

    expect(container.firstChild).toBeNull();
  });

  it("should render nothing when all tasks are completed", () => {
    vi.mocked(bgTasks.useBackgroundTasks).mockReturnValue([
      createTask({ status: "completed" }),
      createTask({ id: "task-2", status: "failed" }),
    ]);

    const { container } = renderWithIntl(<ActiveTasksSection />);

    expect(container.firstChild).toBeNull();
  });

  it("should render section title with count badge when tasks exist", () => {
    vi.mocked(bgTasks.useBackgroundTasks).mockReturnValue([
      createTask(),
      createTask({ id: "task-2", status: "queued" }),
    ]);

    renderWithIntl(<ActiveTasksSection />);

    expect(screen.getByText("Active Tasks")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should expand/collapse on click", () => {
    vi.mocked(bgTasks.useBackgroundTasks).mockReturnValue([createTask()]);

    renderWithIntl(<ActiveTasksSection />);

    // Initially collapsed
    expect(screen.queryByText("test-owner/test-repo")).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText("Active Tasks"));

    // Now visible
    expect(screen.getByText("test-owner/test-repo")).toBeInTheDocument();
  });

  it("should render task with owner/repo as display name", () => {
    vi.mocked(bgTasks.useBackgroundTasks).mockReturnValue([createTask()]);

    renderWithIntl(<ActiveTasksSection />);
    fireEvent.click(screen.getByText("Active Tasks"));

    expect(screen.getByText("test-owner/test-repo")).toBeInTheDocument();
    expect(screen.getByText("Spec Generation")).toBeInTheDocument();
  });

  it("should render View link for tasks", () => {
    vi.mocked(bgTasks.useBackgroundTasks).mockReturnValue([createTask()]);

    renderWithIntl(<ActiveTasksSection />);
    fireEvent.click(screen.getByText("Active Tasks"));

    expect(screen.getByText("View")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/analyze/test-owner/test-repo?tab=spec"
    );
  });

  it("should render multiple tasks", () => {
    vi.mocked(bgTasks.useBackgroundTasks).mockReturnValue([
      createTask({ id: "task-1", status: "processing" }),
      createTask({
        id: "task-2",
        metadata: { owner: "other", repo: "repo2" },
        startedAt: null,
        status: "queued",
      }),
    ]);

    renderWithIntl(<ActiveTasksSection />);
    fireEvent.click(screen.getByText("Active Tasks"));

    expect(screen.getByText("test-owner/test-repo")).toBeInTheDocument();
    expect(screen.getByText("other/repo2")).toBeInTheDocument();
  });
});
