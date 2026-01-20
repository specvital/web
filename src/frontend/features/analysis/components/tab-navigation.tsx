"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { PrimaryTab } from "../types/primary-tab";

type TabNavigationProps = {
  activeTab: PrimaryTab;
  onTabChange: (tab: PrimaryTab) => void;
};

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  const t = useTranslations("analyze.tabs");

  const tabs: { id: string; label: string; panelId: string; value: PrimaryTab }[] = [
    { id: "tab-tests", label: t("tests"), panelId: "tabpanel-tests", value: "tests" },
    { id: "tab-spec", label: t("spec"), panelId: "tabpanel-spec", value: "spec" },
  ];

  return (
    <div className="border-b" role="tablist">
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            aria-controls={tab.panelId}
            aria-selected={activeTab === tab.value}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              activeTab === tab.value ? "text-foreground" : "text-muted-foreground"
            )}
            data-state={activeTab === tab.value ? "active" : "inactive"}
            id={tab.id}
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            role="tab"
            type="button"
          >
            {tab.label}
            {activeTab === tab.value && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
