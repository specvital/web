"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type OldVersionBannerProps = {
  currentVersion: number;
  latestVersion: number;
  onViewLatest: () => void;
};

export const OldVersionBanner = ({
  currentVersion,
  latestVersion,
  onViewLatest,
}: OldVersionBannerProps) => {
  const t = useTranslations("specView.versionBanner");

  return (
    <Alert className="border-amber-500/50 bg-amber-500/10">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="text-amber-700 dark:text-amber-400">
          {t("viewingOldVersion", { current: currentVersion, latest: latestVersion })}
        </span>
        <Button className="shrink-0 gap-1" onClick={onViewLatest} size="sm" variant="outline">
          {t("viewLatest")}
          <ArrowRight className="h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};
