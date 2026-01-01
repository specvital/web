"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import {
  EmptyStateVariant,
  fetchPaginatedRepositories,
  LoadMoreButton,
  paginatedRepositoriesKeys,
  RepositoryList,
  useAddBookmark,
  useReanalyze,
  useRemoveBookmark,
  type SortOption,
} from "@/features/dashboard";

import { useExploreRepositories } from "../hooks";
import { SearchSortControls } from "./search-sort-controls";

const DEFAULT_PAGE_LIMIT = 10;

export const ExploreContent = () => {
  const queryClient = useQueryClient();

  const { addBookmark } = useAddBookmark();
  const { removeBookmark } = useRemoveBookmark();
  const { reanalyze } = useReanalyze();

  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: repositories,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useExploreRepositories({
    sortBy,
    sortOrder: "desc",
  });

  const filteredRepositories = useMemo(() => {
    if (!searchQuery.trim()) {
      return repositories;
    }

    const query = searchQuery.toLowerCase();
    return repositories.filter(
      (repo) =>
        repo.owner.toLowerCase().includes(query) ||
        repo.name.toLowerCase().includes(query) ||
        `${repo.owner}/${repo.name}`.toLowerCase().includes(query)
    );
  }, [repositories, searchQuery]);

  const handleBookmarkToggle = useCallback(
    (owner: string, repo: string, isBookmarked: boolean) => {
      if (isBookmarked) {
        removeBookmark(owner, repo);
      } else {
        addBookmark(owner, repo);
      }
    },
    [addBookmark, removeBookmark]
  );

  const handleReanalyze = useCallback(
    (owner: string, repo: string) => {
      reanalyze(owner, repo);
    },
    [reanalyze]
  );

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const handlePrefetchNextPage = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const queryKey = paginatedRepositoriesKeys.list({
      limit: DEFAULT_PAGE_LIMIT,
      sortBy,
      sortOrder: "desc",
      view: "community",
    });

    const lastPage = queryClient.getQueryData<{
      pageParams: (string | undefined)[];
      pages: { hasNext: boolean; nextCursor?: string | null }[];
    }>(queryKey);

    const nextCursor = lastPage?.pages.at(-1)?.nextCursor;
    if (!nextCursor) return;

    queryClient.prefetchInfiniteQuery({
      initialPageParam: undefined as string | undefined,
      queryFn: () =>
        fetchPaginatedRepositories({
          cursor: nextCursor,
          limit: DEFAULT_PAGE_LIMIT,
          sortBy,
          sortOrder: "desc",
          view: "community",
        }),
      queryKey,
      staleTime: 30 * 1000,
    });
  }, [hasNextPage, isFetchingNextPage, queryClient, sortBy]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const hasNoRepositories = !isLoading && repositories.length === 0 && !isError;
  const hasNoSearchResults =
    searchQuery.trim() !== "" && filteredRepositories.length === 0 && repositories.length > 0;

  return (
    <div className="space-y-8">
      <SearchSortControls
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        onSearchChange={setSearchQuery}
        onSortChange={setSortBy}
        searchQuery={searchQuery}
        sortBy={sortBy}
        totalLoaded={repositories.length}
      />

      {isLoading ? (
        <RepositoryList
          isLoading
          onBookmarkToggle={handleBookmarkToggle}
          onReanalyze={handleReanalyze}
          repositories={[]}
        />
      ) : hasNoRepositories ? (
        <EmptyStateVariant variant="no-repos" />
      ) : hasNoSearchResults ? (
        <EmptyStateVariant searchQuery={searchQuery} variant="no-search-results" />
      ) : (
        <>
          <RepositoryList
            onBookmarkToggle={handleBookmarkToggle}
            onReanalyze={handleReanalyze}
            repositories={filteredRepositories}
          />

          <LoadMoreButton
            hasError={isError}
            hasNextPage={hasNextPage && !searchQuery.trim()}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={handleLoadMore}
            onPrefetch={handlePrefetchNextPage}
            onRetry={handleRetry}
          />
        </>
      )}
    </div>
  );
};
