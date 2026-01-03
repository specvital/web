"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { addToHistory } from "@/features/analysis/api/history";
import { invalidationEvents, useInvalidationTrigger } from "@/lib/query";
import { validateRepositoryIdentifiers } from "@/lib/validations/github";

type UseAddToDashboardReturn = {
  addToDashboard: (owner: string, repo: string) => void;
  isPendingFor: (owner: string, repo: string) => boolean;
};

export const useAddToDashboard = (): UseAddToDashboardReturn => {
  const t = useTranslations("dashboard.toast");
  const triggerInvalidation = useInvalidationTrigger();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) => {
      validateRepositoryIdentifiers(owner, repo);
      return addToHistory(owner, repo);
    },
    onError: (error) => {
      setPendingKey(null);
      toast.error(t("addFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    },
    onMutate: ({ owner, repo }) => {
      setPendingKey(`${owner}/${repo}`);
    },
    onSuccess: () => {
      setPendingKey(null);
      triggerInvalidation(invalidationEvents.HISTORY_CHANGED);
      toast.success(t("addSuccess"), {
        action: {
          label: t("goToDashboard"),
          onClick: () => {},
        },
        actionButtonStyle: { padding: 0 },
        description: (
          <Link className="text-primary hover:underline" href="/dashboard">
            {t("goToDashboard")}
          </Link>
        ),
      });
    },
  });

  return {
    addToDashboard: (owner: string, repo: string) => {
      if (pendingKey) return;
      mutation.mutate({ owner, repo });
    },
    isPendingFor: (owner: string, repo: string) => pendingKey === `${owner}/${repo}`,
  };
};
