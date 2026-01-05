import { Check, Circle, CircleDashed, Crosshair, XCircle } from "lucide-react";

import type { TestStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

import type { ConvertedTestItem } from "../../types";

type SpecItemProps = {
  index: number;
  item: ConvertedTestItem;
  totalItems: number;
};

const STATUS_CONFIG: Record<
  TestStatus,
  {
    color: string;
    icon: typeof Check;
    label: string;
  }
> = {
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
};

export const SpecItem = ({ index, item, totalItems }: SpecItemProps) => {
  const config = STATUS_CONFIG[item.status];
  const Icon = config.icon;

  return (
    <div
      aria-level={3}
      aria-posinset={index + 1}
      aria-setsize={totalItems}
      className={cn(
        "group flex items-start gap-3 px-3 py-2 rounded-md",
        "hover:bg-muted/50 transition-colors"
      )}
      role="treeitem"
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 h-4 w-4 flex-shrink-0", config.color)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          {item.convertedName}
          <span className="sr-only">, {config.label}</span>
        </p>
        <p
          aria-hidden="true"
          className="text-xs text-muted-foreground truncate opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {item.originalName}
        </p>
      </div>
      <span
        aria-label={`Line ${item.line}`}
        className="text-xs text-muted-foreground font-mono flex-shrink-0"
      >
        L:{item.line}
      </span>
    </div>
  );
};
