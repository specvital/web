"use client";

import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useUsage } from "@/features/account";
import { useAuth, useSpecLoginDialog } from "@/features/auth";
import {
  DocumentView,
  EmptyDocument,
  GenerationProgressModal,
  GenerationStatus,
  QuotaConfirmDialog,
  useDocumentFilter,
  useGenerationProgress,
  useQuotaConfirmDialog,
  useSpecView,
} from "@/features/spec-view";
import type { AnalysisResult } from "@/lib/api";
import { createStaggerContainer, fadeInUp, useReducedMotion } from "@/lib/motion";

import { AnalysisHeader } from "./analysis-header";
import { FilterBar, FilterSummary } from "./filter-bar";
import { FilterEmptyState } from "./filter-empty-state";
import { StatsCard } from "./stats-card";
import { TestList } from "./test-list";
import { TreeView } from "./tree-view";
import { useFilterState } from "../hooks/use-filter-state";
import { useViewMode } from "../hooks/use-view-mode";
import type { ViewMode } from "../types";
import { filterSuites } from "../utils/filter-suites";

type AnalysisContentProps = {
  result: AnalysisResult;
};

const pageStaggerContainer = createStaggerContainer(0.1, 0);

export const AnalysisContent = ({ result }: AnalysisContentProps) => {
  const t = useTranslations("analyze");
  const locale = useLocale();
  const { frameworks, query, setFrameworks, setQuery, setStatuses, statuses } = useFilterState();
  const { setViewMode, viewMode } = useViewMode();
  const shouldReduceMotion = useReducedMotion();
  const previousDocumentRef = useRef<boolean>(false);

  const { isAuthenticated } = useAuth();
  const { open: openSpecLoginDialog } = useSpecLoginDialog();
  const { data: usageData } = useUsage(isAuthenticated);
  const { open: openQuotaConfirmDialog } = useQuotaConfirmDialog();
  const {
    bringToForeground: bringProgressToForeground,
    close: closeProgressModal,
    isInBackground: isProgressInBackground,
    open: openProgressModal,
    updateStatus: updateProgressStatus,
  } = useGenerationProgress();
  const tToast = useTranslations("specView.toast");

  const {
    data: specDocument,
    generationStatus,
    isGenerating,
    isLoading: isSpecLoading,
    requestGenerate,
  } = useSpecView(result.id);

  // Sync generation status with progress modal
  useEffect(() => {
    if (generationStatus) {
      updateProgressStatus(generationStatus);

      // Show toast when completed/failed in background
      if (isProgressInBackground) {
        if (generationStatus === "completed") {
          closeProgressModal();
          toast.success(tToast("generationComplete.title"), {
            action: {
              label: tToast("generationComplete.viewDocument"),
              onClick: () => setViewMode("document"),
            },
            description: tToast("generationComplete.description"),
          });
        } else if (generationStatus === "failed") {
          closeProgressModal();
          toast.error(tToast("generateFailed.title"));
        }
      } else {
        // Close modal when completed (not in background)
        if (generationStatus === "completed" || generationStatus === "failed") {
          closeProgressModal();
        }
      }
    }
  }, [
    generationStatus,
    updateProgressStatus,
    closeProgressModal,
    isProgressInBackground,
    tToast,
    setViewMode,
  ]);

  // Handle completion when document becomes available (generationStatus becomes null)
  const prevSpecDocumentRef = useRef(specDocument);
  useEffect(() => {
    // Document just became available (was null, now exists)
    if (specDocument && !prevSpecDocumentRef.current) {
      updateProgressStatus("completed");
      if (isProgressInBackground) {
        closeProgressModal();
        toast.success(tToast("generationComplete.title"), {
          action: {
            label: tToast("generationComplete.viewDocument"),
            onClick: () => setViewMode("document"),
          },
          description: tToast("generationComplete.description"),
        });
      } else {
        closeProgressModal();
      }
    }
    prevSpecDocumentRef.current = specDocument;
  }, [
    specDocument,
    updateProgressStatus,
    closeProgressModal,
    isProgressInBackground,
    tToast,
    setViewMode,
  ]);

  // Show toast when switching to background
  const prevIsInBackgroundRef = useRef(false);
  useEffect(() => {
    if (isProgressInBackground && !prevIsInBackgroundRef.current) {
      // Just switched to background
      toast.info(tToast("generationInProgress.title"), {
        action: {
          label: tToast("generationInProgress.viewProgress"),
          onClick: () => bringProgressToForeground(),
        },
        description: tToast("generationInProgress.description"),
      });
    }
    prevIsInBackgroundRef.current = isProgressInBackground;
  }, [isProgressInBackground, tToast, bringProgressToForeground]);

  const isDocumentAvailable = Boolean(specDocument);

  // Get document match count for search feedback in document view
  const { matchCount: documentMatchCount, query: documentQuery } = useDocumentFilter(
    specDocument ?? null
  );

  // Auto-switch to document view when document becomes available
  useEffect(() => {
    if (specDocument && !previousDocumentRef.current) {
      setViewMode("document");
    }
    previousDocumentRef.current = Boolean(specDocument);
  }, [specDocument, setViewMode]);

  const containerVariants = shouldReduceMotion ? {} : pageStaggerContainer;
  const itemVariants = shouldReduceMotion ? {} : fadeInUp;

  const availableFrameworks = result.summary.frameworks.map((f) => f.framework);

  const filteredSuites = filterSuites(result.suites, { frameworks, query, statuses });

  const filteredTestCount = filteredSuites.reduce((acc, suite) => acc + suite.tests.length, 0);

  const hasFilter = query.trim().length > 0 || frameworks.length > 0 || statuses.length > 0;
  const hasResults = filteredSuites.length > 0;

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleGenerateSpec = () => {
    if (isDocumentAvailable) {
      setViewMode("document");
      return;
    }

    if (!isAuthenticated) {
      openSpecLoginDialog();
      return;
    }

    openQuotaConfirmDialog({
      analysisId: result.id,
      estimatedCost: result.summary.total,
      locale,
      onConfirm: (language) => {
        requestGenerate(language);
        // Open progress modal after generation starts
        openProgressModal({
          analysisId: result.id,
          onViewDocument: () => setViewMode("document"),
          status: "pending",
        });
      },
      usage: usageData ?? null,
    });
  };

  const renderContent = () => {
    if (viewMode === "document") {
      if (specDocument) {
        return <DocumentView document={specDocument} />;
      }

      if (isGenerating && generationStatus) {
        return <GenerationStatus onRetry={() => requestGenerate()} status={generationStatus} />;
      }

      const specviewQuota = usageData?.specview
        ? {
            limit: usageData.specview.limit ?? null,
            percentage: usageData.specview.percentage ?? null,
            used: usageData.specview.used,
          }
        : null;

      return (
        <EmptyDocument
          isLoading={isSpecLoading}
          onGenerate={handleGenerateSpec}
          quota={specviewQuota}
        />
      );
    }

    if (hasFilter && !hasResults) {
      return <FilterEmptyState />;
    }

    if (viewMode === "tree") {
      return <TreeView suites={filteredSuites} />;
    }

    return <TestList suites={filteredSuites} />;
  };

  return (
    <>
      <QuotaConfirmDialog />
      <GenerationProgressModal />
      <motion.main
        animate="visible"
        className="container mx-auto px-4 py-8"
        initial={shouldReduceMotion ? false : "hidden"}
        variants={containerVariants}
      >
        <div className="space-y-6">
          <AnalysisHeader
            analyzedAt={result.analyzedAt}
            branchName={result.branchName}
            commitSha={result.commitSha}
            committedAt={result.committedAt}
            data={result}
            owner={result.owner}
            parserVersion={result.parserVersion}
            repo={result.repo}
          />

          <motion.div variants={itemVariants}>
            <StatsCard summary={result.summary} />
          </motion.div>

          <motion.section className="space-y-4" variants={itemVariants}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{t("testSuites")}</h2>
                <FilterSummary
                  filteredCount={filteredTestCount}
                  hasFilter={hasFilter}
                  totalCount={result.summary.total}
                />
              </div>
            </div>
            <FilterBar
              availableFrameworks={availableFrameworks}
              frameworks={frameworks}
              isDocumentAvailable={isDocumentAvailable}
              isGenerating={isGenerating}
              isViewingDocument={viewMode === "document"}
              matchCount={
                viewMode === "document" && specDocument && documentQuery
                  ? documentMatchCount
                  : undefined
              }
              onFrameworksChange={setFrameworks}
              onGenerateSpec={handleGenerateSpec}
              onQueryChange={setQuery}
              onStatusesChange={setStatuses}
              onViewModeChange={handleViewModeChange}
              query={query}
              statuses={statuses}
              viewMode={viewMode}
            />
            {renderContent()}
          </motion.section>
        </div>
      </motion.main>
    </>
  );
};
