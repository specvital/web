"use client";

import { Check, Circle, CircleDashed, Crosshair, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TestStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

import { HighlightedText } from "./highlighted-text";
import type { FilteredBehavior } from "../hooks/use-document-filter";

type BehaviorItemProps = {
  behavior: FilteredBehavior;
};

const STATUS_CONFIG: Record<TestStatus, { color: string; icon: typeof Check; label: string }> = {
  active: {
    color: "text-green-600",
    icon: Check,
    label: "Active test",
  },
  focused: {
    color: "text-purple-500",
    icon: Crosshair,
    label: "Focused test",
  },
  skipped: {
    color: "text-amber-500",
    icon: CircleDashed,
    label: "Skipped test",
  },
  todo: {
    color: "text-blue-500",
    icon: Circle,
    label: "Todo test",
  },
  xfail: {
    color: "text-red-400",
    icon: XCircle,
    label: "Expected failure",
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
        "flex items-start gap-3 px-3 py-2.5 rounded-md",
        "hover:bg-muted/50 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      id={`behavior-${behavior.id}`}
      role="listitem"
      tabIndex={-1}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="mt-0.5">
            <Icon
              aria-label={config?.label ?? "Test"}
              className={cn("h-4 w-4 flex-shrink-0", config?.color ?? "text-muted-foreground")}
            />
          </span>
        </TooltipTrigger>
        <TooltipContent>{config?.label ?? "Test"}</TooltipContent>
      </Tooltip>

      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm leading-relaxed">
          <HighlightedText ranges={behavior.highlightRanges} text={behavior.convertedDescription} />
        </p>

        {sourceInfo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono truncate max-w-[200px]">{sourceInfo.filePath}</span>
            <span className="font-mono">L:{sourceInfo.lineNumber}</span>
            <Badge className="text-[10px] px-1.5" variant="outline">
              {sourceInfo.framework}
            </Badge>
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
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">{t("original")}</span>
          <span className="font-mono text-xs">{behavior.originalName}</span>
        </div>
      }
      side="bottom"
    >
      {content}
    </ResponsiveTooltip>
  );
};
