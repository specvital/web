"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { PulseRing } from "./pulse-ring";
import { ShimmerBar } from "./shimmer-bar";

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
          "absolute inset-0 z-10 flex flex-col items-center justify-center gap-4",
          "bg-background/60 pointer-events-none",
          "transition-opacity duration-200",
          isRefreshing ? "opacity-100 delay-150" : "opacity-0 delay-0"
        )}
        role="status"
      >
        <PulseRing
          aria-hidden="true"
          className={cn(
            "transition-opacity duration-200",
            isRefreshing ? "opacity-100" : "opacity-0"
          )}
          size="md"
        />
        <div className="w-32">
          <ShimmerBar
            aria-hidden="true"
            className={cn(
              "transition-opacity duration-200",
              isRefreshing ? "opacity-100" : "opacity-0"
            )}
            color="var(--primary)"
            duration={2}
            height="sm"
          />
        </div>
      </div>
    </div>
  );
};
