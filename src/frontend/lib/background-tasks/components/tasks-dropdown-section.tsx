"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";

import { useBackgroundTasks } from "../hooks";
import type { BackgroundTask, BackgroundTaskStatus } from "../task-store";

const formatElapsedTime = (startedAt: string | null): string => {
  if (!startedAt) return "";

  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));

  if (elapsed < 60) {
    return `${elapsed}s`;
  }

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${minutes}m ${seconds}s`;
};

const getTaskPageUrl = (task: BackgroundTask): string | null => {
  const { analysisId, owner, repo } = task.metadata;

  if (task.type === "spec-generation" && analysisId && owner && repo) {
    return `/analyze/${owner}/${repo}?tab=spec`;
  }

  if (task.type === "analysis" && owner && repo) {
    return `/analyze/${owner}/${repo}`;
  }

  return null;
};

type TaskStatusBadgeProps = {
  startedAt: string | null;
  status: BackgroundTaskStatus;
};

const TaskStatusBadge = ({ startedAt, status }: TaskStatusBadgeProps) => {
  const t = useTranslations("backgroundTasks.dropdown");
  const [elapsed, setElapsed] = useState(() => formatElapsedTime(startedAt));

  // Reset elapsed when startedAt changes
  useEffect(() => {
    setElapsed(formatElapsedTime(startedAt));
  }, [startedAt]);

  useEffect(() => {
    if (status !== "processing" || !startedAt) return;

    const interval = setInterval(() => {
      setElapsed(formatElapsedTime(startedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startedAt]);

  if (status === "processing") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        {t("processing", { time: elapsed })}
      </span>
    );
  }

  if (status === "queued") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-amber-500" />
        {t("queued")}
      </span>
    );
  }

  return null;
};

type TaskItemProps = {
  task: BackgroundTask;
};

const TaskItem = ({ task }: TaskItemProps) => {
  const tType = useTranslations("backgroundTasks.taskType");
  const tDropdown = useTranslations("backgroundTasks.dropdown");

  const pageUrl = getTaskPageUrl(task);
  const displayName =
    task.metadata.owner && task.metadata.repo
      ? `${task.metadata.owner}/${task.metadata.repo}`
      : tType(task.type);

  const content = (
    <div className="flex w-full flex-col gap-0.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{displayName}</span>
        {pageUrl && <span className="shrink-0 text-xs text-primary">{tDropdown("viewPage")}</span>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{tType(task.type)}</span>
        <TaskStatusBadge startedAt={task.startedAt} status={task.status} />
      </div>
    </div>
  );

  if (pageUrl) {
    return (
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href={pageUrl}>{content}</Link>
      </DropdownMenuItem>
    );
  }

  return <DropdownMenuItem disabled>{content}</DropdownMenuItem>;
};

type TasksDropdownSectionProps = {
  className?: string;
};

export const TasksDropdownSection = ({ className }: TasksDropdownSectionProps) => {
  const t = useTranslations("backgroundTasks.dropdown");
  const tasks = useBackgroundTasks();

  const activeTasks = tasks.filter(
    (task) => task.status === "queued" || task.status === "processing"
  );

  if (activeTasks.length === 0) {
    return null;
  }

  const MAX_DISPLAY_TASKS = 5;
  const displayedTasks = activeTasks.slice(0, MAX_DISPLAY_TASKS);
  const remainingCount = activeTasks.length - MAX_DISPLAY_TASKS;

  return (
    <div className={className}>
      <div className="px-2 py-1.5">
        <p className="text-xs font-medium text-muted-foreground">{t("title")}</p>
      </div>
      {displayedTasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
      {remainingCount > 0 && (
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground">
            {t("moreCount", { count: remainingCount })}
          </p>
        </div>
      )}
      <DropdownMenuSeparator />
    </div>
  );
};
