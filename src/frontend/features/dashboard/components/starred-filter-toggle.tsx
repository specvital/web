"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { Toggle } from "@/components/ui/toggle";

import { useStarredFilter } from "../hooks";

export const StarredFilterToggle = () => {
  const t = useTranslations("dashboard.filter");
  const { isStarredOnly, toggleStarredFilter } = useStarredFilter();

  return (
    <Toggle
      aria-label={t("starredOnly")}
      onPressedChange={toggleStarredFilter}
      pressed={isStarredOnly}
      variant="outline"
    >
      <Star aria-hidden="true" className={isStarredOnly ? "fill-current" : undefined} />
      <span className="hidden sm:inline">{t("starredOnly")}</span>
    </Toggle>
  );
};
