"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { paginatedRepositoriesKeys } from "@/features/dashboard";
import type { AnalysisResponse } from "@/lib/api/types";
import { getTask, removeTask, useBackgroundTasks } from "@/lib/background-tasks";
import type { BackgroundTask } from "@/lib/background-tasks";

import { fetchAnalysisStatus } from "../api";
import { analysisKeys } from "../hooks/use-analysis";
import { updateStatusKeys } from "../hooks/use-update-status";

const POLL_INTERVAL_MS = 1000;

const isTerminalStatus = (status: AnalysisResponse["status"]): boolean =>
  status === "completed" || status === "failed";

type AnalysisTaskPollerProps = {
  owner: string;
  repo: string;
  taskId: string;
};

/**
 * Polls analysis status for a single background task.
 *
 * Uses dedicated `analysisMonitorPolling` queryKey with `fetchAnalysisStatus` (read-only)
 * to check job progress without triggering new analysis. This prevents false completion
 * detection that occurred when using `fetchAnalysis` which could return cached completed
 * results from previous commits.
 *
 * Deduplication: getTask() check before removeTask() ensures only one
 * handler (this or local component) processes the completion.
 */
const AnalysisTaskPoller = ({ owner, repo, taskId }: AnalysisTaskPollerProps) => {
  const t = useTranslations("backgroundTasks.toast");
  const queryClient = useQueryClient();
  const completedRef = useRef(false);

  const pollingQuery = useQuery({
    queryFn: () => fetchAnalysisStatus(owner, repo),
    queryKey: ["analysisMonitorPolling", owner, repo],
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return POLL_INTERVAL_MS;
      return isTerminalStatus(data.status) ? false : POLL_INTERVAL_MS;
    },
    // Prevent returning cached "completed" status from previous polling sessions
    gcTime: 0,
    staleTime: 0,
  });

  useEffect(() => {
    if (!pollingQuery.data || completedRef.current) return;

    const { status } = pollingQuery.data;
    if (!isTerminalStatus(status)) return;

    completedRef.current = true;

    // Invalidate analysis data to refresh with new results
    queryClient.invalidateQueries({ queryKey: analysisKeys.detail(owner, repo) });
    queryClient.invalidateQueries({ queryKey: paginatedRepositoriesKeys.all });
    queryClient.invalidateQueries({ queryKey: updateStatusKeys.detail(owner, repo) });

    const task = getTask(taskId);
    if (task) {
      if (status === "completed") {
        toast.success(t("analysisComplete", { repo: `${owner}/${repo}` }));
      } else {
        toast.error(t("analysisFailed", { repo: `${owner}/${repo}` }));
      }

      setTimeout(() => {
        removeTask(taskId);
      }, 100);
    }
  }, [pollingQuery.data, taskId, owner, repo, queryClient, t]);

  return null;
};

/**
 * Global monitor for analysis background tasks.
 * Renders at layout level to continue polling even when analysis page is unmounted.
 */
export const AnalysisMonitor = () => {
  const tasks = useBackgroundTasks();

  const activeAnalysisTasks = tasks.filter(
    (task): task is BackgroundTask & { metadata: { owner: string; repo: string } } =>
      task.type === "analysis" &&
      (task.status === "queued" || task.status === "processing") &&
      Boolean(task.metadata.owner) &&
      Boolean(task.metadata.repo)
  );

  return (
    <>
      {activeAnalysisTasks.map((task) => (
        <AnalysisTaskPoller
          key={task.id}
          owner={task.metadata.owner}
          repo={task.metadata.repo}
          taskId={task.id}
        />
      ))}
    </>
  );
};
