"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { LiveAnnouncement } from "./live-announcement";
import { SpecViewContent } from "./spec-view-content";
import { SpecViewError } from "./spec-view-error";
import { SpecViewHeader } from "./spec-view-header";
import { SpecViewSkeleton } from "./spec-view-skeleton";
import { useSpecConversion } from "../../hooks";
import type { ConversionLanguage } from "../../types";

type SpecViewProps = {
  commitSha: string;
  initialLanguage: ConversionLanguage;
  owner: string;
  repo: string;
};

export const SpecView = ({ commitSha, initialLanguage, owner, repo }: SpecViewProps) => {
  const t = useTranslations("analyze.specView");
  const [language, setLanguage] = useState<ConversionLanguage>(initialLanguage);

  const { data, error, isLoading, isRegenerating, regenerate } = useSpecConversion({
    commitSha,
    language,
    owner,
    repo,
  });

  const handleLanguageChange = (newLanguage: ConversionLanguage) => {
    setLanguage(newLanguage);
  };

  if (isLoading) {
    return <SpecViewSkeleton />;
  }

  if (error) {
    return <SpecViewError error={error} onRetry={regenerate} />;
  }

  if (!data) {
    return <SpecViewSkeleton />;
  }

  const totalTests = data.data.reduce(
    (acc, file) => acc + file.suites.reduce((sum, suite) => sum + suite.tests.length, 0),
    0
  );

  return (
    <div>
      {isRegenerating && <LiveAnnouncement assertive message={t("regenerating")} />}
      {!isRegenerating && data && (
        <LiveAnnouncement
          message={t("loaded", { fileCount: data.data.length, testCount: totalTests })}
        />
      )}
      <SpecViewHeader
        isRegenerating={isRegenerating}
        language={language}
        onLanguageChange={handleLanguageChange}
        onRegenerate={regenerate}
        summary={data.summary}
      />
      <SpecViewContent files={data.data} />
    </div>
  );
};
