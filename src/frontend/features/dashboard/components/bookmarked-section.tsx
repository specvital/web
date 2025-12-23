"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { RepositoryCard as RepositoryCardType } from "@/lib/api/types";
import { cn } from "@/lib/utils";

import { RepositoryCard } from "./repository-card";
import { RepositorySkeleton } from "./repository-skeleton";

type BookmarkedSectionProps = {
  isLoading?: boolean;
  onBookmarkToggle?: (owner: string, repo: string, isBookmarked: boolean) => void;
  onReanalyze?: (owner: string, repo: string) => void;
  repositories: RepositoryCardType[];
};

export const BookmarkedSection = ({
  isLoading = false,
  onBookmarkToggle,
  onReanalyze,
  repositories,
}: BookmarkedSectionProps) => {
  const t = useTranslations("dashboard");

  if (!isLoading && repositories.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="bookmarked-heading" className="space-y-3">
      <div className="flex items-center gap-2">
        <Star aria-hidden="true" className="size-5 text-amber-500 fill-amber-500" />
        <h2 className="text-lg font-semibold" id="bookmarked-heading">
          {t("bookmarked")}
        </h2>
        {!isLoading && (
          <span className="text-sm text-muted-foreground">({repositories.length})</span>
        )}
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <ul aria-busy={isLoading} className={cn("flex gap-4 pb-4", isLoading && "overflow-hidden")}>
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <li className="w-[280px] shrink-0" key={index}>
                  <RepositorySkeleton />
                </li>
              ))
            : repositories.map((repo) => (
                <li className="w-[280px] shrink-0" key={repo.id}>
                  <RepositoryCard
                    onBookmarkToggle={onBookmarkToggle}
                    onReanalyze={onReanalyze}
                    repo={repo}
                  />
                </li>
              ))}
        </ul>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};
