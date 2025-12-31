"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { AuthErrorBoundary } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { AnalyzeDialog } from "@/features/home";

import {
  useAddBookmark,
  useReanalyze,
  useRecentRepositories,
  useRemoveBookmark,
  useRepositorySearch,
  useViewFilter,
} from "../hooks";
import type { SortOption } from "../types";
import { DiscoveryErrorFallback } from "./discovery-error-fallback";
import { DiscoverySection } from "./discovery-section";
import { EmptyStateVariant } from "./empty-state-variant";
import { RepositoryList } from "./repository-list";
import { ViewFilterDropdown } from "./view-filter-dropdown";

const SORT_OPTIONS: SortOption[] = ["name", "recent", "tests"];

const isSortOption = (value: string): value is SortOption =>
  SORT_OPTIONS.includes(value as SortOption);

type SearchSortControlsProps = {
  onSearchChange: (query: string) => void;
  onSortChange: (sort: SortOption) => void;
  searchQuery: string;
  sortBy: SortOption;
};

const SearchSortControls = ({
  onSearchChange,
  onSortChange,
  searchQuery,
  sortBy,
}: SearchSortControlsProps) => {
  const t = useTranslations("dashboard");

  const sortLabels: Record<SortOption, string> = {
    name: t("sort.name"),
    recent: t("sort.recent"),
    tests: t("sort.tests"),
  };

  const handleSortChange = (value: string) => {
    if (isSortOption(value)) {
      onSortChange(value);
    }
  };

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-sm">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label={t("searchPlaceholder")}
          className="h-11 pl-10 sm:h-9 sm:pl-9"
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          type="search"
          value={searchQuery}
        />
      </div>

      <div className="flex w-full gap-2 sm:w-auto">
        <ViewFilterDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-11 flex-1 sm:h-9 sm:flex-none" variant="outline">
              <ArrowUpDown aria-hidden="true" />
              <span>
                {t("sort.label")}: {sortLabels[sortBy]}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuRadioGroup onValueChange={handleSortChange} value={sortBy}>
              <DropdownMenuRadioItem value="recent">{sortLabels.recent}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name">{sortLabels.name}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="tests">{sortLabels.tests}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export const DashboardContent = () => {
  const queryClient = useQueryClient();

  const { data: repositories = [], isLoading } = useRecentRepositories();

  const { addBookmark } = useAddBookmark();
  const { removeBookmark } = useRemoveBookmark();
  const { reanalyze } = useReanalyze();
  const { viewFilter } = useViewFilter();

  const { filteredRepositories, searchQuery, setSearchQuery, setSortBy, sortBy } =
    useRepositorySearch(repositories);

  const displayedRepositories = (() => {
    switch (viewFilter) {
      case "starred":
        return filteredRepositories.filter((repo) => repo.isBookmarked);
      case "mine":
        return filteredRepositories.filter((repo) => repo.isAnalyzedByMe);
      case "community":
        return filteredRepositories.filter((repo) => !repo.isAnalyzedByMe);
      case "all":
      default:
        return filteredRepositories;
    }
  })();

  const handleBookmarkToggle = (owner: string, repo: string, isBookmarked: boolean) => {
    if (isBookmarked) {
      removeBookmark(owner, repo);
    } else {
      addBookmark(owner, repo);
    }
  };

  const handleReanalyze = (owner: string, repo: string) => {
    reanalyze(owner, repo);
  };

  const handleDiscoveryReset = () => {
    queryClient.resetQueries({ exact: false, queryKey: ["dashboard"] });
  };

  const hasNoRepositories = !isLoading && repositories.length === 0;
  const hasNoFilterResults =
    viewFilter === "starred" &&
    displayedRepositories.length === 0 &&
    filteredRepositories.length > 0;

  return (
    <div className="space-y-8">
      <SearchSortControls
        onSearchChange={setSearchQuery}
        onSortChange={setSortBy}
        searchQuery={searchQuery}
        sortBy={sortBy}
      />

      {isLoading ? (
        <RepositoryList
          isLoading
          onBookmarkToggle={handleBookmarkToggle}
          onReanalyze={handleReanalyze}
          repositories={[]}
        />
      ) : hasNoRepositories ? (
        <EmptyStateVariant action={<AnalyzeDialog variant="empty-state" />} variant="no-repos" />
      ) : hasNoFilterResults ? (
        <EmptyStateVariant variant="no-bookmarks" />
      ) : displayedRepositories.length === 0 ? (
        <EmptyStateVariant searchQuery={searchQuery} variant="no-search-results" />
      ) : (
        <RepositoryList
          onBookmarkToggle={handleBookmarkToggle}
          onReanalyze={handleReanalyze}
          repositories={displayedRepositories}
        />
      )}

      <AuthErrorBoundary
        fallback={<DiscoveryErrorFallback resetErrorBoundary={handleDiscoveryReset} />}
        onReset={handleDiscoveryReset}
      >
        <DiscoverySection analyzedRepositories={repositories} />
      </AuthErrorBoundary>
    </div>
  );
};
