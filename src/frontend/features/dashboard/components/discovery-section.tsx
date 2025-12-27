"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import type {
  GitHubOrganization,
  GitHubRepository,
  OrganizationAccessStatus,
  RepositoryCard as RepositoryCardType,
} from "@/lib/api/types";

import { useAllOrgRepos, useMyRepositories, useOrganizations, useUnanalyzedRepos } from "../hooks";
import { DiscoveryCard } from "./discovery-card";
import { DiscoveryListSheet } from "./discovery-list-sheet";
import { OrganizationPicker } from "./organization-picker";

type SheetState = {
  accessStatus?: OrganizationAccessStatus;
  isOpen: boolean;
  repositories: GitHubRepository[];
  title: string;
};

type OrgPickerState = {
  isOpen: boolean;
};

type DiscoverySectionProps = {
  analyzedRepositories: RepositoryCardType[];
};

export const DiscoverySection = ({ analyzedRepositories }: DiscoverySectionProps) => {
  const t = useTranslations("dashboard.discovery");

  const {
    data: myRepos,
    isLoading: isLoadingMyRepos,
    isRefreshing: isRefreshingMyRepos,
    refresh: refreshMyRepos,
  } = useMyRepositories();

  const {
    data: orgs,
    isLoading: isLoadingOrgs,
    isRefreshing: isRefreshingOrgs,
    refresh: refreshOrgs,
  } = useOrganizations();

  const {
    isLoading: isLoadingOrgRepos,
    orgData,
    refreshOrg,
    totalUnanalyzedCount,
  } = useAllOrgRepos({
    analyzedRepositories,
    organizations: orgs,
  });

  const [sheetState, setSheetState] = useState<SheetState>({
    accessStatus: undefined,
    isOpen: false,
    repositories: [],
    title: "",
  });

  const [orgPickerState, setOrgPickerState] = useState<OrgPickerState>({
    isOpen: false,
  });

  const { count: unanalyzedPersonalCount, data: unanalyzedPersonalRepos } = useUnanalyzedRepos({
    analyzedRepositories,
    githubRepositories: myRepos,
  });

  const unanalyzedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(orgData).forEach(([orgLogin, data]) => {
      counts[orgLogin] = data.unanalyzedCount;
    });
    return counts;
  }, [orgData]);

  const handlePersonalClick = () => {
    setSheetState({
      accessStatus: undefined,
      isOpen: true,
      repositories: unanalyzedPersonalRepos,
      title: t("myRepos"),
    });
  };

  const handleOrgClick = () => {
    if (orgs.length === 0) {
      setSheetState({
        accessStatus: "restricted",
        isOpen: true,
        repositories: [],
        title: t("orgRepos"),
      });
    } else if (orgs.length === 1) {
      const org = orgs[0];
      const data = orgData[org.login];
      setSheetState({
        accessStatus: org.accessStatus,
        isOpen: true,
        repositories: data?.unanalyzedRepos ?? [],
        title: org.login,
      });
    } else {
      setOrgPickerState({ isOpen: true });
    }
  };

  const handleSelectOrg = (org: GitHubOrganization) => {
    const data = orgData[org.login];
    setOrgPickerState({ isOpen: false });
    if (data) {
      setSheetState({
        accessStatus: org.accessStatus,
        isOpen: true,
        repositories: data.unanalyzedRepos,
        title: org.login,
      });
    }
  };

  const handleOrgPickerOpenChange = (open: boolean) => {
    setOrgPickerState({ isOpen: open });
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetState((prev) => ({ ...prev, isOpen: open }));
  };

  const handleRefreshOrgs = () => {
    refreshOrgs();
  };

  const isOrgLoading = isLoadingOrgs || isLoadingOrgRepos;
  const isOrgRefreshing = isRefreshingOrgs;

  return (
    <section aria-labelledby="discovery-heading" className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-5 text-amber-500" />
        <h2 className="text-lg font-semibold" id="discovery-heading">
          {t("title")}
        </h2>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{t("description")}</p>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <DiscoveryCard
          count={unanalyzedPersonalCount}
          isLoading={isLoadingMyRepos}
          isRefreshing={isRefreshingMyRepos}
          onClick={handlePersonalClick}
          onRefresh={refreshMyRepos}
          type="personal"
        />
        <DiscoveryCard
          count={totalUnanalyzedCount}
          isLoading={isOrgLoading}
          isRefreshing={isOrgRefreshing}
          onClick={handleOrgClick}
          onRefresh={handleRefreshOrgs}
          type="organization"
        />
      </div>

      <DiscoveryListSheet
        accessStatus={sheetState.accessStatus}
        isOpen={sheetState.isOpen}
        onOpenChange={handleSheetOpenChange}
        repositories={sheetState.repositories}
        title={sheetState.title}
      />

      <OrganizationPicker
        isLoading={isOrgLoading}
        isOpen={orgPickerState.isOpen}
        isRefreshing={isOrgRefreshing}
        onOpenChange={handleOrgPickerOpenChange}
        onRefreshOrg={refreshOrg}
        onSelectOrg={handleSelectOrg}
        organizations={orgs}
        unanalyzedCounts={unanalyzedCounts}
      />
    </section>
  );
};
