"use client";

import { FileText, GitBranch, List } from "lucide-react";
import { useTranslations } from "next-intl";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { ViewMode } from "../types";
import { VIEW_MODES } from "../types";

type ViewModeToggleProps = {
  isDocumentAvailable?: boolean;
  onChange: (value: ViewMode) => void;
  value: ViewMode;
};

export const ViewModeToggle = ({
  isDocumentAvailable = true,
  onChange,
  value,
}: ViewModeToggleProps) => {
  const t = useTranslations("analyze.viewMode");

  const handleValueChange = (newValue: string) => {
    if (!VIEW_MODES.includes(newValue as ViewMode)) return;
    onChange(newValue as ViewMode);
  };

  return (
    <ToggleGroup
      onValueChange={handleValueChange}
      size="default"
      type="single"
      value={value}
      variant="outline"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem aria-label={t("list")} value="list">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>{t("list")}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem aria-label={t("tree")} value="tree">
            <GitBranch className="h-4 w-4" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>{t("tree")}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            aria-label={t("document")}
            disabled={!isDocumentAvailable}
            value="document"
          >
            <FileText className="h-4 w-4" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>
          {isDocumentAvailable ? t("document") : t("documentUnavailable")}
        </TooltipContent>
      </Tooltip>
    </ToggleGroup>
  );
};
