"use client";

import { ChevronDown, ExternalLink, ListTodo } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link } from "@/i18n/navigation";
import { type BackgroundTask, TaskStatusBadge, useBackgroundTasks } from "@/lib/background-tasks";
import { getTaskPageUrl } from "@/lib/background-tasks/utils";
import { cn } from "@/lib/utils";

type TaskRowProps = {
  task: BackgroundTask;
};

const TaskRow = ({ task }: TaskRowProps) => {
  const tType = useTranslations("backgroundTasks.taskType");
  const tActiveTasks = useTranslations("backgroundTasks.activeTasks");

  const pageUrl = getTaskPageUrl(task);
  const displayName =
    task.metadata.owner && task.metadata.repo
      ? `${task.metadata.owner}/${task.metadata.repo}`
      : tType(task.type);

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{displayName}</span>
        <span className="text-xs text-muted-foreground">{tType(task.type)}</span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <TaskStatusBadge size="sm" startedAt={task.startedAt} status={task.status} />
        {pageUrl && (
          <Button asChild size="sm" variant="ghost">
            <Link href={pageUrl}>
              {tActiveTasks("viewTask")}
              <ExternalLink className="ml-1 size-3" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export const ActiveTasksSection = () => {
  const t = useTranslations("backgroundTasks.activeTasks");
  const tasks = useBackgroundTasks();
  const searchParams = useSearchParams();

  const activeTasks = tasks.filter(
    (task) => task.status === "queued" || task.status === "processing"
  );

  const shouldAutoExpand = searchParams.get("section") === "tasks";
  const [isOpen, setIsOpen] = useState(shouldAutoExpand);

  useEffect(() => {
    if (shouldAutoExpand) {
      setIsOpen(true);
    }
  }, [shouldAutoExpand]);

  if (activeTasks.length === 0) {
    return null;
  }

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <Card className="overflow-hidden py-0" depth="raised">
        <CollapsibleTrigger asChild>
          <button
            className="flex w-full cursor-pointer items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
            type="button"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-violet-500 ring-1 ring-violet-500/10">
                <ListTodo aria-hidden="true" className="size-5" />
              </div>
              <span className="text-base font-semibold">{t("title")}</span>
              <Badge variant="secondary">{activeTasks.length}</Badge>
            </div>
            <ChevronDown
              className={cn(
                "size-5 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-2 pb-4">
            {activeTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
