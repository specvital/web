"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import type { TestSuite } from "@/lib/api";
import { TestSuiteAccordion } from "./test-suite-accordion";

type TestListProps = {
  suites: TestSuite[];
};

const VIRTUALIZATION_THRESHOLD = 100;

export const TestList = ({ suites }: TestListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  if (suites.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        No test suites found in this repository.
      </div>
    );
  }

  const shouldVirtualize = suites.length > VIRTUALIZATION_THRESHOLD;

  if (!shouldVirtualize) {
    return (
      <div className="space-y-3">
        {suites.map((suite) => (
          <TestSuiteAccordion key={`${suite.filePath}-${suite.framework}`} suite={suite} />
        ))}
      </div>
    );
  }

  return <VirtualizedTestList parentRef={parentRef} suites={suites} />;
};

type VirtualizedTestListProps = {
  parentRef: React.RefObject<HTMLDivElement | null>;
  suites: TestSuite[];
};

const VirtualizedTestList = ({ parentRef, suites }: VirtualizedTestListProps) => {
  const virtualizer = useVirtualizer({
    count: suites.length,
    estimateSize: () => 60,
    getScrollElement: () => parentRef.current,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="h-[70vh] overflow-auto rounded-lg border bg-card"
      style={{
        contain: "strict",
      }}
    >
      <div
        className="relative w-full p-3"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const suite = suites[virtualItem.index];
          if (!suite) {
            return null;
          }

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full mb-3"
              style={{
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <TestSuiteAccordion suite={suite} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
