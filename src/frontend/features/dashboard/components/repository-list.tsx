"use client";

import type { RepositoryCard as RepositoryCardType } from "@/lib/api/types";

import { RepositoryCard } from "./repository-card";
import { RepositorySkeleton } from "./repository-skeleton";

const GRID_CLASSES = "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

type RepositoryListProps = {
  isLoading?: boolean;
  onBookmarkToggle?: (owner: string, repo: string, isBookmarked: boolean) => void;
  onReanalyze?: (owner: string, repo: string) => void;
  repositories: RepositoryCardType[];
};

export const RepositoryList = ({
  isLoading = false,
  onBookmarkToggle,
  onReanalyze,
  repositories,
}: RepositoryListProps) => {
  if (isLoading) {
    return (
      <ul aria-busy="true" aria-label="Loading repositories" className={GRID_CLASSES}>
        {Array.from({ length: 8 }).map((_, index) => (
          <li key={index}>
            <RepositorySkeleton />
          </li>
        ))}
      </ul>
    );
  }

  if (repositories.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Repository list" className={GRID_CLASSES}>
      {repositories.map((repo) => (
        <li key={repo.id}>
          <RepositoryCard
            onBookmarkToggle={onBookmarkToggle}
            onReanalyze={onReanalyze}
            repo={repo}
          />
        </li>
      ))}
    </ul>
  );
};
