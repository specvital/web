"use client";

import { Search, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { ShimmerBar } from "@/components/feedback";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";

import { useBackgroundTasks } from "../hooks";
import type { BackgroundTask, BackgroundTaskType } from "../task-store";
import { getTaskPageUrl, isTaskActive } from "../utils";
import { TaskStatusBadge } from "./task-status-badge";

const TASK_TYPE_ICONS: Record<BackgroundTaskType, typeof Search> = {
  analysis: Search,
  "spec-generation": Sparkles,
} as const;

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

  const isActive = isTaskActive(task.status);
  const Icon = TASK_TYPE_ICONS[task.type];

  const content = (
    <div className="flex w-full flex-col gap-0.5">
      <div className="flex items-center justify-between gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex min-w-0 items-center gap-2">
              <Icon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium">{displayName}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">{displayName}</TooltipContent>
        </Tooltip>
        {pageUrl && <span className="shrink-0 text-xs text-primary">{tDropdown("viewPage")}</span>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{tType(task.type)}</span>
        <TaskStatusBadge startedAt={task.startedAt} status={task.status} />
      </div>
      {isActive && (
        <div className="mt-1">
          <ShimmerBar aria-hidden="true" color="var(--primary)" duration={2} height="xs" />
        </div>
      )}
    </div>
  );

  if (pageUrl) {
    return (
      <DropdownMenuItem asChild>
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

  const MAX_DISPLAY_TASKS = 3;
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
        <DropdownMenuItem asChild>
          <Link href="/dashboard?section=tasks">
            <span className="text-xs text-muted-foreground">
              {t("viewAll", { count: remainingCount })}
            </span>
          </Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
    </div>
  );
};
