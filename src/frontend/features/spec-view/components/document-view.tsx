"use client";

import { useTranslations } from "next-intl";

import { DomainSection } from "./domain-section";
import { ExecutiveSummary } from "./executive-summary";
import { FilterEmptyState } from "./filter-empty-state";
import { TocSidebar } from "./toc-sidebar";
import { useDocumentFilter } from "../hooks/use-document-filter";
import { useScrollSync } from "../hooks/use-scroll-sync";
import type { SpecDocument } from "../types";

type DocumentViewProps = {
  document: SpecDocument;
};

export const DocumentView = ({ document }: DocumentViewProps) => {
  const t = useTranslations("analyze.filter");
  useScrollSync();

  const { clearFilters, filteredDocument, hasFilter, matchCount } = useDocumentFilter(document);

  const showEmptyState = hasFilter && matchCount === 0;

  return (
    <div className="flex flex-col lg:flex-row lg:gap-6">
      <TocSidebar document={document} filteredDocument={filteredDocument} hasFilter={hasFilter} />

      <div className="flex-1 space-y-6 min-w-0">
        <ExecutiveSummary document={document} />

        {showEmptyState ? (
          <FilterEmptyState
            description={t("noResultsDescription")}
            onClearFilters={clearFilters}
            title={t("noResults")}
          />
        ) : (
          <div className="space-y-6">
            {filteredDocument?.domains.map((domain) => (
              <DomainSection domain={domain} hasFilter={hasFilter} key={domain.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
