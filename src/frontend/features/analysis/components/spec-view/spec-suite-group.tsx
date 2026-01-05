"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { SpecItem } from "./spec-item";
import type { ConvertedTestSuite } from "../../types";
import { calculateStatusCounts } from "../../utils/calculate-status-counts";
import { StatusMiniBar } from "../status-mini-bar";

type SpecSuiteGroupProps = {
  index: number;
  suite: ConvertedTestSuite;
  totalSuites: number;
};

export const SpecSuiteGroup = ({ index, suite, totalSuites }: SpecSuiteGroupProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const testCount = suite.tests.length;
  const statusCounts = useMemo(() => calculateStatusCounts(suite.tests), [suite.tests]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setIsExpanded((prev) => !prev);
      } else if (event.key === "ArrowRight" && !isExpanded) {
        event.preventDefault();
        setIsExpanded(true);
      } else if (event.key === "ArrowLeft" && isExpanded) {
        event.preventDefault();
        setIsExpanded(false);
      }
    },
    [isExpanded]
  );

  const contentId = `suite-content-${suite.suiteHierarchy.replace(/[^a-zA-Z0-9]/g, "-")}`;

  return (
    <div
      aria-expanded={isExpanded}
      aria-level={2}
      aria-posinset={index + 1}
      aria-setsize={totalSuites}
      className="border-l-2 border-muted pl-3"
      role="treeitem"
    >
      <button
        aria-controls={contentId}
        aria-expanded={isExpanded}
        className={cn(
          "flex w-full items-center gap-2 py-2 text-left",
          "hover:bg-muted/30 rounded-md px-2 -ml-2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        onClick={() => setIsExpanded((prev) => !prev)}
        onKeyDown={handleKeyDown}
        type="button"
      >
        {isExpanded ? (
          <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="flex-1 text-sm font-medium truncate">{suite.suiteName}</span>
        <StatusMiniBar counts={statusCounts} />
        <span className="text-xs text-muted-foreground">
          {testCount} {testCount === 1 ? "test" : "tests"}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-1 space-y-0.5" id={contentId} role="group">
          {suite.tests.map((item, itemIndex) => (
            <SpecItem
              index={itemIndex}
              item={item}
              key={`${item.line}-${item.originalName}`}
              totalItems={suite.tests.length}
            />
          ))}
        </div>
      )}
    </div>
  );
};
