import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as hooks from "../hooks";
import type { BackgroundTask } from "../task-store";
import { TasksDropdownSection } from "./tasks-dropdown-section";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const messages = {
  backgroundTasks: {
    dropdown: {
      title: "Tasks",
      viewAll: "+{count} more - View all",
      viewPage: "View",
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
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>{ui}</DropdownMenuContent>
      </DropdownMenu>
    </NextIntlClientProvider>
  );
};

const renderWithIntlNoWrapper = (ui: React.ReactElement) => {
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

describe("TasksDropdownSection", () => {
  beforeEach(() => {
    vi.spyOn(hooks, "useBackgroundTasks");
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should render nothing when no active tasks", () => {
    vi.mocked(hooks.useBackgroundTasks).mockReturnValue([]);

    const { container } = renderWithIntlNoWrapper(<TasksDropdownSection />);

    expect(container.firstChild).toBeNull();
  });

  it("should render nothing when all tasks are completed", () => {
    vi.mocked(hooks.useBackgroundTasks).mockReturnValue([
      createTask({ status: "completed" }),
      createTask({ id: "task-2", status: "failed" }),
    ]);

    const { container } = renderWithIntlNoWrapper(<TasksDropdownSection />);

    expect(container.firstChild).toBeNull();
  });

  it("should render section title when tasks exist", () => {
    vi.mocked(hooks.useBackgroundTasks).mockReturnValue([createTask()]);

    renderWithIntl(<TasksDropdownSection />);

    expect(screen.getByText("Tasks")).toBeInTheDocument();
  });

  it("should render task with owner/repo as display name", () => {
    vi.mocked(hooks.useBackgroundTasks).mockReturnValue([createTask()]);

    renderWithIntl(<TasksDropdownSection />);

    expect(screen.getByText("test-owner/test-repo")).toBeInTheDocument();
  });

  it("should render task type label", () => {
    vi.mocked(hooks.useBackgroundTasks).mockReturnValue([createTask()]);

    renderWithIntl(<TasksDropdownSection />);

    expect(screen.getByText("Spec Generation")).toBeInTheDocument();
  });

  it("should render queued status for queued tasks", () => {
    vi.mocked(hooks.useBackgroundTasks).mockReturnValue([
      createTask({ startedAt: null, status: "queued" }),
    ]);

    renderWithIntl(<TasksDropdownSection />);

    expect(screen.getByText("Queued")).toBeInTheDocument();
  });

  it("should render processing status with elapsed time", () => {
    const startedAt = new Date(Date.now() - 45000).toISOString();
    vi.mocked(hooks.useBackgroundTasks).mockReturnValue([
      createTask({ startedAt, status: "processing" }),
    ]);

    renderWithIntl(<TasksDropdownSection />);

    expect(screen.getByText("Processing 45s")).toBeInTheDocument();
  });

  it("should render View link for spec-generation tasks", () => {
    vi.mocked(hooks.useBackgroundTasks).mockReturnValue([createTask()]);

    renderWithIntl(<TasksDropdownSection />);

    expect(screen.getByText("View")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/analyze/test-owner/test-repo?tab=spec"
    );
  });

  it("should render View link for analysis tasks", () => {
    vi.mocked(hooks.useBackgroundTasks).mockReturnValue([createTask({ type: "analysis" })]);

    renderWithIntl(<TasksDropdownSection />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/analyze/test-owner/test-repo");
  });

  it("should render multiple tasks", () => {
    vi.mocked(hooks.useBackgroundTasks).mockReturnValue([
      createTask({ id: "task-1", status: "processing" }),
      createTask({
        id: "task-2",
        metadata: { owner: "other", repo: "repo2" },
        startedAt: null,
        status: "queued",
      }),
    ]);

    renderWithIntl(<TasksDropdownSection />);

    expect(screen.getByText("test-owner/test-repo")).toBeInTheDocument();
    expect(screen.getByText("other/repo2")).toBeInTheDocument();
  });
});
