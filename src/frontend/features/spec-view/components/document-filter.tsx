"use client";

import {
  Check,
  ChevronDown,
  Circle,
  CircleDashed,
  Crosshair,
  Filter,
  X,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TestStatus } from "@/lib/api";
import { getFrameworkSolidColor } from "@/lib/styles";
import { cn } from "@/lib/utils";

type DocumentFilterProps = {
  availableFrameworks: string[];
  frameworks: string[];
  hasFilter: boolean;
  matchCount: number;
  onClearFilters: () => void;
  onFrameworksChange: (value: string[] | null) => void;
  onStatusesChange: (value: TestStatus[] | null) => void;
  statuses: TestStatus[];
  totalCount: number;
};

const STATUS_OPTIONS = [
  { color: "text-green-600", icon: Check, key: "active" },
  { color: "text-purple-500", icon: Crosshair, key: "focused" },
  { color: "text-amber-500", icon: CircleDashed, key: "skipped" },
  { color: "text-blue-500", icon: Circle, key: "todo" },
  { color: "text-red-400", icon: XCircle, key: "xfail" },
] as const;

type StatusKey = (typeof STATUS_OPTIONS)[number]["key"];

const TRANSLATION_KEYS: Record<StatusKey, string> = {
  active: "statusActive",
  focused: "statusFocused",
  skipped: "statusSkipped",
  todo: "statusTodo",
  xfail: "statusXfail",
};

const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

export const DocumentFilter = ({
  availableFrameworks,
  frameworks,
  hasFilter,
  matchCount,
  onClearFilters,
  onFrameworksChange,
  onStatusesChange,
  statuses,
  totalCount,
}: DocumentFilterProps) => {
  const t = useTranslations("specView.filter");
  const tAnalyze = useTranslations("analyze.filter");

  const handleStatusToggle = useCallback(
    (statusKey: TestStatus) => {
      const isSelected = statuses.includes(statusKey);
      if (isSelected) {
        onStatusesChange(statuses.filter((v) => v !== statusKey));
      } else {
        onStatusesChange([...statuses, statusKey]);
      }
    },
    [onStatusesChange, statuses]
  );

  const handleFrameworkToggle = useCallback(
    (framework: string) => {
      const isSelected = frameworks.includes(framework);
      if (isSelected) {
        onFrameworksChange(frameworks.filter((f) => f !== framework));
      } else {
        onFrameworksChange([...frameworks, framework]);
      }
    },
    [onFrameworksChange, frameworks]
  );

  const statusCount = statuses.length;
  const frameworkCount = frameworks.length;
  const totalFilterCount = statusCount + frameworkCount;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className={cn("gap-2", statusCount > 0 && "border-primary/50")}
            size="sm"
            variant="outline"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>
              {tAnalyze("statusFilter")}
              {statusCount > 0 && ` (${statusCount})`}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48 p-2">
          <div className="flex flex-col gap-1">
            {STATUS_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isChecked = statuses.includes(option.key);

              return (
                <label
                  className={cn(
                    "flex items-center gap-3 px-2 py-1.5 rounded-md cursor-pointer",
                    "hover:bg-muted/50 transition-colors"
                  )}
                  key={option.key}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => handleStatusToggle(option.key)}
                  />
                  <Icon className={cn("h-4 w-4", option.color)} />
                  <span className="text-sm">{tAnalyze(TRANSLATION_KEYS[option.key])}</span>
                </label>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Framework Filter */}
      {availableFrameworks.length > 1 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className={cn(frameworkCount > 0 && "border-primary/50 bg-primary/5")}
              size="sm"
              variant="outline"
            >
              <Filter className="h-3.5 w-3.5" />
              {tAnalyze("frameworkFilter")}
              {frameworkCount > 0 && ` (${frameworkCount})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-2">
            <div className="flex flex-col gap-1">
              {availableFrameworks.map((framework) => {
                const isChecked = frameworks.includes(framework);

                return (
                  <label
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent transition-colors"
                    key={framework}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleFrameworkToggle(framework)}
                    />
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getFrameworkSolidColor(framework) }}
                    />
                    <span className="text-sm">{capitalize(framework)}</span>
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Clear Filters */}
      {totalFilterCount > 0 && (
        <Button
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={onClearFilters}
          size="sm"
          variant="ghost"
        >
          <X className="h-3.5 w-3.5" />
          {t("clearFilters")}
        </Button>
      )}

      {/* Filter Summary */}
      {hasFilter && (
        <Badge className="ml-auto" variant="secondary">
          {t("resultSummary", { filtered: matchCount, total: totalCount })}
        </Badge>
      )}
    </div>
  );
};
