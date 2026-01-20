"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import type { AnalysisResult } from "@/lib/api";
import { createStaggerContainer, fadeInUp, useReducedMotion } from "@/lib/motion";

import { AnalysisHeader } from "./analysis-header";
import { SpecPanel } from "./spec-panel";
import { StatsCard } from "./stats-card";
import { TabNavigation } from "./tab-navigation";
import { TestsPanel } from "./tests-panel";
import { usePrimaryTab } from "../hooks/use-primary-tab";

type AnalysisContentProps = {
  result: AnalysisResult;
};

const pageStaggerContainer = createStaggerContainer(0.1, 0);

export const AnalysisContent = ({ result }: AnalysisContentProps) => {
  const t = useTranslations("analyze");
  const { setTab, tab } = usePrimaryTab();
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = shouldReduceMotion ? {} : pageStaggerContainer;
  const itemVariants = shouldReduceMotion ? {} : fadeInUp;

  const availableFrameworks = result.summary.frameworks.map((f) => f.framework);

  return (
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
          <h2 className="text-xl font-semibold">{t("testSuites")}</h2>

          <TabNavigation activeTab={tab} onTabChange={setTab} />

          {tab === "tests" ? (
            <TestsPanel
              availableFrameworks={availableFrameworks}
              suites={result.suites}
              totalCount={result.summary.total}
            />
          ) : (
            <SpecPanel
              analysisId={result.id}
              availableFrameworks={availableFrameworks}
              totalTests={result.summary.total}
            />
          )}
        </motion.section>
      </div>
    </motion.main>
  );
};
