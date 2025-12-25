"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { ErrorFallback } from "@/components/feedback/error-fallback";
import { Button } from "@/components/ui/button";

type DiscoveryErrorFallbackProps = {
  resetErrorBoundary: () => void;
};

export const DiscoveryErrorFallback = ({ resetErrorBoundary }: DiscoveryErrorFallbackProps) => {
  const t = useTranslations("dashboard.discovery");

  return (
    <ErrorFallback
      action={
        <Button onClick={resetErrorBoundary} variant="default">
          <RefreshCw className="mr-2 size-4" />
          {t("retry")}
        </Button>
      }
      className="py-8"
      description={t("errorDescription")}
      fullScreen={false}
      title={t("errorTitle")}
    />
  );
};
