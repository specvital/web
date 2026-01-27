"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type RefreshOverlayProps = {
  children: React.ReactNode;
  isRefreshing: boolean;
};

export const RefreshOverlay = ({ children, isRefreshing }: RefreshOverlayProps) => {
  const t = useTranslations("common");

  return (
    <div className="relative">
      {children}
      <div
        aria-label={t("refreshing")}
        className={cn(
          "absolute inset-0 z-10 flex items-center justify-center",
          "bg-background/60 pointer-events-none",
          "transition-opacity duration-200",
          isRefreshing ? "opacity-100 delay-150" : "opacity-0 delay-0"
        )}
        role="status"
      >
        <Loader2
          aria-hidden="true"
          className={cn(
            "size-6 text-muted-foreground animate-spin",
            "transition-opacity duration-200",
            isRefreshing ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>
  );
};
