"use client";

import { Building2, ChevronRight, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { GitHubOrganization } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type OrganizationPickerProps = {
  isLoading?: boolean;
  isOpen: boolean;
  isRefreshing?: boolean;
  onOpenChange: (open: boolean) => void;
  onRefreshOrg: (org: string) => void;
  onSelectOrg: (org: GitHubOrganization) => void;
  organizations: GitHubOrganization[];
  unanalyzedCounts: Record<string, number>;
};

export const OrganizationPicker = ({
  isLoading,
  isOpen,
  isRefreshing,
  onOpenChange,
  onRefreshOrg,
  onSelectOrg,
  organizations,
  unanalyzedCounts,
}: OrganizationPickerProps) => {
  const t = useTranslations("dashboard.discovery");

  return (
    <Sheet onOpenChange={onOpenChange} open={isOpen}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto" side="right">
        <SheetHeader className="mb-4">
          <SheetTitle>{t("selectOrganization")}</SheetTitle>
          <SheetDescription>
            {t("selectOrganizationDescription", { count: organizations.length })}
          </SheetDescription>
        </SheetHeader>

        <ul className="space-y-2">
          {isLoading ? (
            <li className="text-center py-8 text-sm text-muted-foreground">{t("loading")}</li>
          ) : organizations.length === 0 ? (
            <li className="text-center py-8 text-sm text-muted-foreground">
              {t("noOrganizations")}
            </li>
          ) : (
            organizations.map((org) => {
              const count = unanalyzedCounts[org.login] ?? 0;
              const isDisabled = count === 0;

              const handleKeyDown = (e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectOrg(org);
                }
              };

              return (
                <li key={org.id}>
                  <Card
                    aria-label={org.login}
                    className={cn(
                      "relative p-4 transition-all duration-200",
                      !isDisabled && "cursor-pointer hover:shadow-md hover:border-primary/20",
                      !isDisabled &&
                        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                      isDisabled && "opacity-60"
                    )}
                    onClick={isDisabled ? undefined : () => onSelectOrg(org)}
                    onKeyDown={isDisabled ? undefined : handleKeyDown}
                    role={isDisabled ? undefined : "button"}
                    tabIndex={isDisabled ? undefined : 0}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {org.avatarUrl ? (
                          <img
                            alt={org.login}
                            className="size-10 rounded-lg shrink-0 object-cover"
                            src={org.avatarUrl}
                          />
                        ) : (
                          <div className="flex items-center justify-center size-10 rounded-lg shrink-0 bg-purple-100 text-purple-600">
                            <Building2 className="size-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm">{org.login}</h3>
                          <p className="text-xs text-muted-foreground">
                            {count > 0 ? t("reposFound", { count }) : t("noRepos")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              aria-label={t("refresh")}
                              className="size-8"
                              disabled={isRefreshing}
                              onClick={(e) => {
                                e.stopPropagation();
                                onRefreshOrg(org.login);
                              }}
                              size="icon"
                              variant="ghost"
                            >
                              <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("refresh")}</TooltipContent>
                        </Tooltip>

                        {!isDisabled && <ChevronRight className="size-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })
          )}
        </ul>
      </SheetContent>
    </Sheet>
  );
};
