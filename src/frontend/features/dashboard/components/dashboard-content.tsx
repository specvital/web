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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyzeDialog } from "@/features/home";

import {
  useAddBookmark,
  useBookmarkedRepositories,
  useMyAnalyses,
  useOwnershipFilter,
  useReanalyze,
  useRecentRepositories,
  useRemoveBookmark,
  useRepositorySearch,
  useTabState,
} from "../hooks";
import type { TabValue } from "../hooks";
import type { SortOption } from "../types";
import { DiscoveryErrorFallback } from "./discovery-error-fallback";
import { DiscoverySection } from "./discovery-section";
import { EmptyStateVariant } from "./empty-state-variant";
import { OwnershipFilter } from "./ownership-filter";
import { RepositoryList } from "./repository-list";

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
    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label={t("searchPlaceholder")}
          className="pl-9"
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          type="search"
          value={searchQuery}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full sm:w-auto" variant="outline">
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
  );
};

export const DashboardContent = () => {
  const t = useTranslations("dashboard");
  const queryClient = useQueryClient();

  const { setTab, tab } = useTabState();
  const { ownership, setOwnership } = useOwnershipFilter();

  const { data: bookmarked = [], isLoading: isLoadingBookmarked } = useBookmarkedRepositories();
  const { data: recent = [], isLoading: isLoadingRecent } = useRecentRepositories();
  const { data: myAnalyses = [], isLoading: isLoadingMyAnalyses } = useMyAnalyses({ ownership });

  const { addBookmark } = useAddBookmark();
  const { removeBookmark } = useRemoveBookmark();
  const { reanalyze } = useReanalyze();

  const {
    filteredRepositories: filteredBookmarked,
    searchQuery: bookmarkedSearchQuery,
    setSearchQuery: setBookmarkedSearchQuery,
    setSortBy: setBookmarkedSortBy,
    sortBy: bookmarkedSortBy,
  } = useRepositorySearch(bookmarked);

  const {
    filteredRepositories: filteredMyAnalyses,
    searchQuery: myAnalysesSearchQuery,
    setSearchQuery: setMyAnalysesSearchQuery,
    setSortBy: setMyAnalysesSortBy,
    sortBy: myAnalysesSortBy,
  } = useRepositorySearch(myAnalyses);

  const {
    filteredRepositories: filteredAll,
    searchQuery: allSearchQuery,
    setSearchQuery: setAllSearchQuery,
    setSortBy: setAllSortBy,
    sortBy: allSortBy,
  } = useRepositorySearch(recent);

  const handleTabChange = (value: string) => {
    setTab(value as TabValue);
  };

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

  const hasNoRepositories = !isLoadingRecent && recent.length === 0;
  const hasNoMyAnalyses = !isLoadingMyAnalyses && myAnalyses.length === 0;

  return (
    <div className="space-y-8">
      <Tabs onValueChange={handleTabChange} value={tab}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="bookmarked">{t("tabs.bookmarked")}</TabsTrigger>
            <TabsTrigger value="my-analyses">{t("tabs.myAnalyses")}</TabsTrigger>
            <TabsTrigger value="all">{t("tabs.all")}</TabsTrigger>
          </TabsList>

          {tab === "my-analyses" && <OwnershipFilter onChange={setOwnership} value={ownership} />}
        </div>

        <TabsContent className="mt-6" value="bookmarked">
          <SearchSortControls
            onSearchChange={setBookmarkedSearchQuery}
            onSortChange={setBookmarkedSortBy}
            searchQuery={bookmarkedSearchQuery}
            sortBy={bookmarkedSortBy}
          />
          {isLoadingBookmarked ? (
            <RepositoryList
              isLoading
              onBookmarkToggle={handleBookmarkToggle}
              onReanalyze={handleReanalyze}
              repositories={[]}
            />
          ) : bookmarked.length === 0 ? (
            <EmptyStateVariant variant="no-bookmarks" />
          ) : filteredBookmarked.length === 0 ? (
            <EmptyStateVariant searchQuery={bookmarkedSearchQuery} variant="no-search-results" />
          ) : (
            <RepositoryList
              onBookmarkToggle={handleBookmarkToggle}
              onReanalyze={handleReanalyze}
              repositories={filteredBookmarked}
            />
          )}
        </TabsContent>

        <TabsContent className="mt-6" value="my-analyses">
          <SearchSortControls
            onSearchChange={setMyAnalysesSearchQuery}
            onSortChange={setMyAnalysesSortBy}
            searchQuery={myAnalysesSearchQuery}
            sortBy={myAnalysesSortBy}
          />
          {isLoadingMyAnalyses ? (
            <RepositoryList
              isLoading
              onBookmarkToggle={handleBookmarkToggle}
              onReanalyze={handleReanalyze}
              repositories={[]}
            />
          ) : hasNoMyAnalyses ? (
            <EmptyStateVariant
              action={<AnalyzeDialog variant="empty-state" />}
              variant="no-repos"
            />
          ) : filteredMyAnalyses.length === 0 ? (
            <EmptyStateVariant searchQuery={myAnalysesSearchQuery} variant="no-search-results" />
          ) : (
            <RepositoryList
              onBookmarkToggle={handleBookmarkToggle}
              onReanalyze={handleReanalyze}
              repositories={filteredMyAnalyses}
            />
          )}

          <AuthErrorBoundary
            fallback={<DiscoveryErrorFallback resetErrorBoundary={handleDiscoveryReset} />}
            onReset={handleDiscoveryReset}
          >
            <DiscoverySection analyzedRepositories={recent} />
          </AuthErrorBoundary>
        </TabsContent>

        <TabsContent className="mt-6" value="all">
          <SearchSortControls
            onSearchChange={setAllSearchQuery}
            onSortChange={setAllSortBy}
            searchQuery={allSearchQuery}
            sortBy={allSortBy}
          />
          {isLoadingRecent ? (
            <RepositoryList
              isLoading
              onBookmarkToggle={handleBookmarkToggle}
              onReanalyze={handleReanalyze}
              repositories={[]}
            />
          ) : hasNoRepositories ? (
            <EmptyStateVariant
              action={<AnalyzeDialog variant="empty-state" />}
              variant="no-repos"
            />
          ) : filteredAll.length === 0 ? (
            <EmptyStateVariant searchQuery={allSearchQuery} variant="no-search-results" />
          ) : (
            <RepositoryList
              onBookmarkToggle={handleBookmarkToggle}
              onReanalyze={handleReanalyze}
              repositories={filteredAll}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
