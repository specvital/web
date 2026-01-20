"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GitCommit, Loader2, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { invalidationEvents, useInvalidationTrigger } from "@/lib/query";

import { triggerReanalyze } from "../api";
import { analysisKeys } from "../hooks/use-analysis";
import { updateStatusKeys, useUpdateStatus } from "../hooks/use-update-status";

type UpdateBannerProps = {
  owner: string;
  repo: string;
};

export const UpdateBanner = ({ owner, repo }: UpdateBannerProps) => {
  const t = useTranslations("analyze.updateBanner");
  const queryClient = useQueryClient();
  const triggerInvalidation = useInvalidationTrigger();
  const [isDismissed, setIsDismissed] = useState(false);

  const {
    isLoading: isCheckingStatus,
    parserOutdated,
    status,
  } = useUpdateStatus(
    owner,
    repo,
    !isDismissed // Disable polling when dismissed
  );

  const reanalyzeMutation = useMutation({
    mutationFn: () => triggerReanalyze(owner, repo),
    onError: (error) => {
      toast.error(t("reanalyzeFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    },
    onSuccess: () => {
      toast.success(t("reanalyzeQueued"));
      // Invalidate analysis query to trigger polling
      queryClient.invalidateQueries({ queryKey: analysisKeys.detail(owner, repo) });
      // Invalidate update status
      queryClient.invalidateQueries({ queryKey: updateStatusKeys.detail(owner, repo) });
      // Trigger global invalidation for dashboard
      triggerInvalidation(invalidationEvents.ANALYSIS_COMPLETED);
      // Dismiss banner after triggering reanalysis
      setIsDismissed(true);
    },
  });

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleReanalyze = () => {
    reanalyzeMutation.mutate();
  };

  const hasNewCommits = status === "new-commits";
  const shouldShowBanner = !isDismissed && !isCheckingStatus && (hasNewCommits || parserOutdated);

  // Don't show banner if dismissed, loading, or no updates available
  if (!shouldShowBanner) {
    return null;
  }

  const isReanalyzing = reanalyzeMutation.isPending;
  const messageKey = hasNewCommits ? "newCommitsDetected" : "parserUpdated";

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
      <GitCommit className="size-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="text-amber-800 dark:text-amber-200">{t(messageKey)}</span>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            className="h-7 gap-1.5 px-2.5 text-xs"
            disabled={isReanalyzing}
            onClick={handleReanalyze}
            size="sm"
            variant="default"
          >
            {isReanalyzing ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <RefreshCw className="size-3" />
            )}
            {t("updateNow")}
          </Button>
          <Button
            aria-label={t("dismissLabel")}
            className="size-7 p-0"
            onClick={handleDismiss}
            size="sm"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
