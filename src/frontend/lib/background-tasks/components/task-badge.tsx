"use client";

import { useTranslations } from "next-intl";

import { PulseRing } from "@/components/feedback";
import { cn } from "@/lib/utils";

import { useActiveTasks } from "../hooks";

type TaskBadgeProps = {
  className?: string;
};

export const TaskBadge = ({ className }: TaskBadgeProps) => {
  const t = useTranslations("backgroundTasks.badge");
  const activeTasks = useActiveTasks();
  const activeCount = activeTasks.length;

  if (activeCount === 0) {
    return null;
  }

  const shouldUseAIPrimaryColor = activeTasks.every((task) => task.type === "spec-generation");

  return (
    <span
      aria-label={t("ariaLabel", { count: activeCount })}
      className={cn(
        "relative flex items-center gap-1.5 rounded-full px-2.5 py-1",
        shouldUseAIPrimaryColor
          ? "bg-[hsl(var(--ai-primary))]/10 text-[hsl(var(--ai-primary))]"
          : "bg-primary/10 text-primary",
        className
      )}
      role="status"
    >
      <PulseRing aria-hidden="true" size="xs" />
      <span className="font-medium tabular-nums">{activeCount}</span>
      <span className="hidden sm:inline">{activeCount === 1 ? "task" : "tasks"}</span>
    </span>
  );
};
