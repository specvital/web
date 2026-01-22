"use client";

import { Sparkles, TestTube2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { PrimaryTab } from "../types/primary-tab";

type TabConfig = {
  icon: React.ReactNode;
  id: string;
  isAI?: boolean;
  label: string;
  panelId: string;
  value: PrimaryTab;
};

type TabNavigationProps = {
  activeTab: PrimaryTab;
  onTabChange: (tab: PrimaryTab) => void;
};

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  const t = useTranslations("analyze.tabs");

  const tabs: TabConfig[] = [
    {
      icon: <TestTube2 className="size-4" />,
      id: "tab-tests",
      label: t("tests"),
      panelId: "tabpanel-tests",
      value: "tests",
    },
    {
      icon: <Sparkles className="size-4" />,
      id: "tab-spec",
      isAI: true,
      label: t("spec"),
      panelId: "tabpanel-spec",
      value: "spec",
    },
  ];

  return (
    <div className="flex gap-1.5" role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <button
            aria-controls={tab.panelId}
            aria-selected={isActive}
            className={cn(
              "group relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
              "transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              // 기본 탭 스타일
              !tab.isAI && [
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              ],
              // AI 탭 스타일
              tab.isAI && [
                isActive
                  ? [
                      "text-foreground",
                      "bg-[linear-gradient(to_right,var(--ai-gradient-from),var(--ai-gradient-to))]",
                      "border border-[var(--ai-border)]",
                      "shadow-[0_0_12px_var(--ai-glow)]",
                    ]
                  : [
                      "text-muted-foreground",
                      "border border-transparent",
                      "hover:text-foreground",
                      "hover:bg-[linear-gradient(to_right,var(--ai-gradient-from),var(--ai-gradient-to))]",
                      "hover:border-[var(--ai-border)]/50",
                    ],
              ]
            )}
            data-state={isActive ? "active" : "inactive"}
            id={tab.id}
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            role="tab"
            type="button"
          >
            {/* 아이콘 */}
            <span
              className={cn(
                "transition-all duration-200",
                "group-hover:scale-110 group-hover:rotate-6",
                tab.isAI && [
                  "text-[var(--ai-primary)]",
                  isActive && "drop-shadow-[0_0_4px_var(--ai-glow)]",
                ]
              )}
            >
              {tab.icon}
            </span>

            {/* 라벨 */}
            <span>{tab.label}</span>

            {/* AI 배지 */}
            {tab.isAI && (
              <span
                aria-hidden="true"
                className={cn(
                  "ml-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  "bg-[linear-gradient(to_right,var(--ai-primary),var(--ai-secondary))]",
                  "text-white",
                  "shadow-sm shadow-[var(--ai-glow)]",
                  "transition-shadow duration-200",
                  isActive && "shadow-md"
                )}
              >
                AI
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
