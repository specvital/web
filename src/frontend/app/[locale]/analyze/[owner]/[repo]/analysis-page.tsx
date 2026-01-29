"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { ErrorFallback } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import {
  AnalysisContent,
  AnalysisSkeleton,
  useAnalysis,
  useAutoTrackHistory,
} from "@/features/analysis";
import type { AnalysisStatus } from "@/features/analysis";

type AnalysisPageProps = {
  owner: string;
  repo: string;
};

const mapToSkeletonStatus = (status: string): AnalysisStatus => {
  if (status === "queued") return "queued";
  if (status === "analyzing") return "analyzing";
  return "loading";
};

const getDisplayErrorMessage = (
  error: Error | null,
  status: string,
  t: ReturnType<typeof useTranslations<"analyze">>
): string => {
  if (error) {
    return error.message;
  }
  if (status === "failed") {
    return t("status.failed");
  }
  return t("status.error");
};

export const AnalysisPage = ({ owner, repo }: AnalysisPageProps) => {
  const t = useTranslations("analyze");
  const { data, error, isLoading, refetch, startedAt, status } = useAnalysis(owner, repo);

  useAutoTrackHistory(owner, repo, status === "completed");

  if (isLoading) {
    return (
      <AnalysisSkeleton
        owner={owner}
        repo={repo}
        startedAt={startedAt}
        status={mapToSkeletonStatus(status)}
      />
    );
  }

  if (status === "error" || status === "failed") {
    return (
      <ErrorFallback
        action={
          <Button className="gap-2" onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4" />
            {t("retry")}
          </Button>
        }
        description={getDisplayErrorMessage(error, status, t)}
        title={t("status.error")}
      />
    );
  }

  if (data) {
    return <AnalysisContent result={data} />;
  }

  return null;
};
