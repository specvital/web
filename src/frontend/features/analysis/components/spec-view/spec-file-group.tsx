"use client";

import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { SpecSuiteGroup } from "./spec-suite-group";
import type { ConvertedTestFile } from "../../types";
import { FrameworkBadge } from "../framework-badge";
import { StatusMiniBar } from "../status-mini-bar";

type SpecFileGroupProps = {
  file: ConvertedTestFile;
  index: number;
  totalFiles: number;
};

export const SpecFileGroup = ({ file, index, totalFiles }: SpecFileGroupProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const { statusCounts, testCount } = useMemo(() => {
    const allTests = file.suites.flatMap((suite) => suite.tests);
    const counts = {
      active: 0,
      focused: 0,
      skipped: 0,
      todo: 0,
      xfail: 0,
    };
    for (const test of allTests) {
      counts[test.status]++;
    }
    return { statusCounts: counts, testCount: allTests.length };
  }, [file.suites]);

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

  const contentId = `file-content-${file.filePath.replace(/[^a-zA-Z0-9]/g, "-")}`;

  return (
    <div
      aria-expanded={isExpanded}
      aria-level={1}
      aria-posinset={index + 1}
      aria-setsize={totalFiles}
      className={cn(
        "rounded-lg border bg-card transition-shadow duration-200",
        isExpanded ? "shadow-md" : "shadow-sm"
      )}
      role="treeitem"
    >
      <button
        aria-controls={contentId}
        aria-expanded={isExpanded}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 rounded-t-lg",
          "transition-all duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isExpanded ? "bg-accent/40 hover:bg-accent/60" : "hover:bg-muted/70"
        )}
        onClick={() => setIsExpanded((prev) => !prev)}
        onKeyDown={handleKeyDown}
        type="button"
      >
        {isExpanded ? (
          <ChevronDown aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight
            aria-hidden="true"
            className="h-4 w-4 flex-shrink-0 text-muted-foreground"
          />
        )}
        <FileText aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left text-sm font-medium truncate">{file.filePath}</span>
        <FrameworkBadge framework={file.framework} />
        <StatusMiniBar counts={statusCounts} />
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {testCount} {testCount === 1 ? "test" : "tests"}
        </span>
      </button>

      {isExpanded && (
        <div
          className="border-t border-accent/20 bg-accent/10 px-4 py-3"
          id={contentId}
          role="group"
        >
          <div className="space-y-3 pl-6">
            {file.suites.map((suite, suiteIndex) => (
              <SpecSuiteGroup
                index={suiteIndex}
                key={suite.suiteHierarchy}
                suite={suite}
                totalSuites={file.suites.length}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
