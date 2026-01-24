"use client";

import { FilterEmptyState } from "@/components/feedback";

import { ExecutiveSummary } from "./executive-summary";
import { ReadingProgressBar } from "./reading-progress-bar";
import { TocSidebar } from "./toc-sidebar";
import { VirtualizedDocumentView } from "./virtualized-document-view";
import { DocumentNavigationProvider } from "../contexts";
import { useDocumentFilter } from "../hooks/use-document-filter";
import type { BehaviorCacheStats, SpecDocument, SpecLanguage, VersionInfo } from "../types";

type DocumentViewProps = {
  behaviorCacheStats?: BehaviorCacheStats;
  document: SpecDocument;
  isGeneratingOtherLanguage?: boolean;
  isLoadingVersions?: boolean;
  isRegenerating?: boolean;
  latestVersion?: number;
  onGenerateNewLanguage?: (language: SpecLanguage) => void;
  onLanguageSwitch?: (language: SpecLanguage) => void;
  onRegenerate?: () => void;
  onVersionSwitch?: (version: number) => void;
  versions?: VersionInfo[];
};

export const DocumentView = ({
  behaviorCacheStats,
  document,
  isGeneratingOtherLanguage,
  isLoadingVersions,
  isRegenerating,
  latestVersion,
  onGenerateNewLanguage,
  onLanguageSwitch,
  onRegenerate,
  onVersionSwitch,
  versions,
}: DocumentViewProps) => {
  const { clearFilters, filteredDocument, filterInfo, hasFilter, matchCount } =
    useDocumentFilter(document);

  const showEmptyState = hasFilter && matchCount === 0;

  return (
    <DocumentNavigationProvider document={document}>
      <ReadingProgressBar />
      <div className="flex flex-col lg:flex-row lg:gap-6">
        <TocSidebar document={document} filteredDocument={filteredDocument} hasFilter={hasFilter} />

        <div className="flex-1 space-y-6 min-w-0">
          <ExecutiveSummary
            behaviorCacheStats={behaviorCacheStats}
            document={document}
            isGeneratingOtherLanguage={isGeneratingOtherLanguage}
            isLoadingVersions={isLoadingVersions}
            isRegenerating={isRegenerating}
            latestVersion={latestVersion}
            onGenerateNewLanguage={onGenerateNewLanguage}
            onLanguageSwitch={onLanguageSwitch}
            onRegenerate={onRegenerate}
            onVersionSwitch={onVersionSwitch}
            versions={versions}
          />

          {showEmptyState ? (
            <FilterEmptyState filterInfo={filterInfo} onReset={clearFilters} />
          ) : filteredDocument ? (
            <VirtualizedDocumentView document={filteredDocument} hasFilter={hasFilter} />
          ) : null}
        </div>
      </div>
    </DocumentNavigationProvider>
  );
};
