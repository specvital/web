"use client";

import { useTranslations } from "next-intl";

import { CacheIndicator } from "./cache-indicator";
import { LanguageSelector } from "./language-selector";
import type { ConversionLanguage, ConversionSummary } from "../../types";

type SpecViewHeaderProps = {
  isRegenerating: boolean;
  language: ConversionLanguage;
  onLanguageChange: (language: ConversionLanguage) => void;
  onRegenerate: () => void;
  summary: ConversionSummary | null;
};

export const SpecViewHeader = ({
  isRegenerating,
  language,
  onLanguageChange,
  onRegenerate,
  summary,
}: SpecViewHeaderProps) => {
  const t = useTranslations("analyze.specView");

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        {summary && (
          <>
            <p className="text-sm text-muted-foreground">
              {t("summary", {
                cached: summary.cachedCount,
                converted: summary.convertedCount,
                total: summary.totalTests,
              })}
            </p>
            <CacheIndicator
              convertedAt={summary.convertedAt}
              isRegenerating={isRegenerating}
              onRegenerate={onRegenerate}
            />
          </>
        )}
      </div>
      <LanguageSelector onChange={onLanguageChange} value={language} />
    </div>
  );
};
