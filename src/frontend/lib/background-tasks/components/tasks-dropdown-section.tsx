"use client";

import { useTranslations } from "next-intl";

import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";

import { useBackgroundTasks } from "../hooks";
import type { BackgroundTask } from "../task-store";
import { getTaskPageUrl } from "../utils";
import { TaskStatusBadge } from "./task-status-badge";

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
