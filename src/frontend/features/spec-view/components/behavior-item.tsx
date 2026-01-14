"use client";

import { Check, Circle, CircleDashed, Crosshair, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { FrameworkBadge } from "@/components/ui/framework-badge";
import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TestStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

import { HighlightedText } from "./highlighted-text";
import type { FilteredBehavior } from "../hooks/use-document-filter";

type BehaviorItemProps = {
  behavior: FilteredBehavior;
};

const STATUS_CONFIG: Record<
  TestStatus,
  {
    bgColor: string;
    color: string;
    icon: typeof Check;
    label: string;
    ringColor: string;
  }
> = {
  active: {
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    color: "text-emerald-600 dark:text-emerald-400",
    icon: Check,
    label: "Active test",
    ringColor: "ring-emerald-200 dark:ring-emerald-800",
  },
  focused: {
    bgColor: "bg-violet-50 dark:bg-violet-950/40",
    color: "text-violet-600 dark:text-violet-400",
    icon: Crosshair,
    label: "Focused test",
    ringColor: "ring-violet-200 dark:ring-violet-800",
  },
  skipped: {
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    color: "text-amber-600 dark:text-amber-400",
    icon: CircleDashed,
    label: "Skipped test",
    ringColor: "ring-amber-200 dark:ring-amber-800",
  },
  todo: {
    bgColor: "bg-sky-50 dark:bg-sky-950/40",
    color: "text-sky-600 dark:text-sky-400",
    icon: Circle,
    label: "Todo test",
    ringColor: "ring-sky-200 dark:ring-sky-800",
  },
  xfail: {
    bgColor: "bg-red-50 dark:bg-red-950/40",
    color: "text-red-500 dark:text-red-400",
    icon: XCircle,
    label: "Expected failure",
    ringColor: "ring-red-200 dark:ring-red-800",
  },
} as const;

export const BehaviorItem = ({ behavior }: BehaviorItemProps) => {
  const t = useTranslations("specView.behavior");
  const sourceInfo = behavior.sourceInfo;
  const config = sourceInfo ? STATUS_CONFIG[sourceInfo.status] : null;
  const Icon = config?.icon ?? Check;

  const hasDifferentOriginal = behavior.originalName !== behavior.convertedDescription;

  const content = (
    <div
      className={cn(
        "group flex items-start gap-3 px-3 py-2.5 mx-1 rounded-lg",
        "hover:bg-muted/50 active:bg-muted/70",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      )}
      id={`behavior-${behavior.id}`}
      role="listitem"
      tabIndex={0}
    >
      {/* Status icon with background */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full mt-0.5 flex-shrink-0",
              "ring-1 transition-all duration-150",
              config?.bgColor ?? "bg-muted",
              config?.ringColor ?? "ring-border",
              "group-hover:ring-2"
            )}
          >
            <Icon
              aria-label={config?.label ?? "Test"}
              className={cn("h-3.5 w-3.5", config?.color ?? "text-muted-foreground")}
            />
          </span>
        </TooltipTrigger>
        <TooltipContent side="left">{config?.label ?? "Test"}</TooltipContent>
      </Tooltip>

      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Behavior description */}
        <p className="text-sm leading-relaxed text-foreground/90">
          <HighlightedText ranges={behavior.highlightRanges} text={behavior.convertedDescription} />
        </p>

        {/* Source info as inline chips */}
        {sourceInfo && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md",
                "bg-muted/60 text-xs font-mono text-muted-foreground",
                "max-w-[200px] md:max-w-[280px] truncate"
              )}
            >
              {sourceInfo.filePath}
            </span>
            <span
              className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded-md",
                "bg-muted/60 text-xs font-mono text-muted-foreground tabular-nums"
              )}
            >
              L{sourceInfo.lineNumber}
            </span>
            <FrameworkBadge framework={sourceInfo.framework} />
          </div>
        )}
      </div>
    </div>
  );

  if (!hasDifferentOriginal) {
    return content;
  }

  return (
    <ResponsiveTooltip
      content={
        <div className="flex flex-col gap-1.5 max-w-xs">
          <span className="text-xs font-medium opacity-70">{t("original")}</span>
          <span className="font-mono text-xs leading-relaxed">{behavior.originalName}</span>
        </div>
      }
      side="bottom"
    >
      {content}
    </ResponsiveTooltip>
  );
};
