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
    <motion.header className="space-y-2" variants={fadeInUp}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl truncate min-w-0">
          {owner}/{repo}
        </h1>
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
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <GitCommit className="h-4 w-4" />
          {commitSha.slice(0, SHORT_SHA_LENGTH)}
        </span>
        <span>{t("analyzedAt", { date: formatAnalysisDate(analyzedAt) })}</span>
      </div>
    </motion.header>
  );
};
