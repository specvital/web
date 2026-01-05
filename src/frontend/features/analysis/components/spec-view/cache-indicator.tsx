"use client";

import { RefreshCw } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type CacheIndicatorProps = {
  convertedAt: string;
  isRegenerating: boolean;
  onRegenerate: () => void;
};

export const CacheIndicator = ({
  convertedAt,
  isRegenerating,
  onRegenerate,
}: CacheIndicatorProps) => {
  const t = useTranslations("analyze.specView");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });

  const convertedDate = new Date(convertedAt);
  const relativeTime = format.relativeTime(convertedDate, now);
  const absoluteTime = format.dateTime(convertedDate, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default">{t("generatedAt", { time: relativeTime })}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{absoluteTime}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={t("regenerate")}
              className="h-7 w-7"
              disabled={isRegenerating}
              onClick={onRegenerate}
              size="icon"
              variant="ghost"
            >
              <RefreshCw
                aria-hidden="true"
                className={`size-3.5 ${isRegenerating ? "animate-spin" : ""}`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("regenerate")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
