"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { useActiveTaskCount } from "../hooks";

type TaskBadgeProps = {
  className?: string;
};

export const TaskBadge = ({ className }: TaskBadgeProps) => {
  const t = useTranslations("backgroundTasks.badge");
  const activeCount = useActiveTaskCount();

  if (activeCount === 0) {
    return null;
  }

  return (
    <span
      aria-label={t("ariaLabel", { count: activeCount })}
      className={cn(
        "absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-medium text-primary-foreground",
        className
      )}
    >
      <Loader2 className="size-2 animate-spin" />
    </span>
  );
};
