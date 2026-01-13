"use client";

import { DomainSection } from "./domain-section";
import { ExecutiveSummary } from "./executive-summary";
import { TocSidebar } from "./toc-sidebar";
import { useScrollSync } from "../hooks/use-scroll-sync";
import type { SpecDocument } from "../types";

type DocumentViewProps = {
  document: SpecDocument;
};

export const DocumentView = ({ document }: DocumentViewProps) => {
  useScrollSync();

  return (
    <div className="flex gap-6">
      <TocSidebar document={document} />

      <div className="flex-1 space-y-6 min-w-0">
        <ExecutiveSummary document={document} />

        <div className="space-y-4">
          {document.domains.map((domain) => (
            <DomainSection domain={domain} key={domain.id} />
          ))}
        </div>
      </div>
    </div>
  );
};
