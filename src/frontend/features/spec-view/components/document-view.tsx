"use client";

import { useTranslations } from "next-intl";

import { DocumentFilter } from "./document-filter";
import { DocumentSearch } from "./document-search";
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

  const {
    availableFrameworks,
    clearFilters,
    filteredDocument,
    frameworks,
    hasFilter,
    matchCount,
    query,
    setFrameworks,
    setQuery,
    setStatuses,
    statuses,
    totalCount,
  } = useDocumentFilter(document);

  const showEmptyState = hasFilter && matchCount === 0;

  return (
    <div className="flex gap-6">
      <TocSidebar document={document} filteredDocument={filteredDocument} hasFilter={hasFilter} />

      <div className="flex-1 space-y-6 min-w-0">
        <ExecutiveSummary document={document} />

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DocumentSearch
            filteredDocument={filteredDocument}
            onQueryChange={setQuery}
            query={query}
          />
          <div className="flex-1">
            <DocumentFilter
              availableFrameworks={availableFrameworks}
              frameworks={frameworks}
              hasFilter={hasFilter}
              matchCount={matchCount}
              onClearFilters={clearFilters}
              onFrameworksChange={setFrameworks}
              onStatusesChange={setStatuses}
              statuses={statuses}
              totalCount={totalCount}
            />
          </div>
        </div>

        {/* Content */}
        {showEmptyState ? (
          <FilterEmptyState
            description={t("noResultsDescription")}
            onClearFilters={clearFilters}
            title={t("noResults")}
          />
        ) : (
          <div className="space-y-4">
            {filteredDocument?.domains.map((domain) => (
              <DomainSection domain={domain} hasFilter={hasFilter} key={domain.id} query={query} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
