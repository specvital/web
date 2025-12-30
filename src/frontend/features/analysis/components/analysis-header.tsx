"use client";

import { ExternalLink, GitCommit } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { fadeInUp } from "@/lib/motion";
import { formatAnalysisDate, SHORT_SHA_LENGTH } from "@/lib/utils";

import { ShareButton } from "./share-button";

type AnalysisHeaderProps = {
  analyzedAt: string;
  commitSha: string;
  owner: string;
  repo: string;
};

export const AnalysisHeader = ({ analyzedAt, commitSha, owner, repo }: AnalysisHeaderProps) => {
  const t = useTranslations("analyze");

  return (
    <motion.header variants={fadeInUp}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* 저장소 정보 세트 - 항상 세로로 묶임 */}
        <div className="space-y-1 min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl truncate">
            {owner}/{repo}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <GitCommit className="h-4 w-4" />
              {commitSha.slice(0, SHORT_SHA_LENGTH)}
            </span>
            <span>{t("analyzedAt", { date: formatAnalysisDate(analyzedAt) })}</span>
          </div>
        </div>

        {/* 액션 버튼 세트 */}
        <div className="flex items-center gap-2 shrink-0">
          <ShareButton />
          <Button asChild size="sm" variant="outline">
            <a
              href={`https://github.com/${owner}/${repo}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("viewOnGitHub")}
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </motion.header>
  );
};
