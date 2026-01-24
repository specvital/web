"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchRepoSpecDocument, ForbiddenError, UnauthorizedError } from "../api";
import type {
  BehaviorCacheStats,
  RepoSpecDocument,
  RepoSpecDocumentResponse,
  SpecLanguage,
} from "../types";
import { isRepoDocumentCompleted } from "../types";

export const repoSpecViewKeys = {
  all: ["repo-spec-view"] as const,
  document: (owner: string, repo: string, language?: SpecLanguage, version?: number) =>
    version !== undefined
      ? ([...repoSpecViewKeys.all, "document", owner, repo, language, version] as const)
      : language
        ? ([...repoSpecViewKeys.all, "document", owner, repo, language] as const)
        : ([...repoSpecViewKeys.all, "document", owner, repo] as const),
  versions: (owner: string, repo: string, language: SpecLanguage) =>
    [...repoSpecViewKeys.all, "versions", owner, repo, language] as const,
};

type UseRepoSpecViewOptions = {
  enabled?: boolean;
  language?: SpecLanguage;
  version?: number;
};

export type RepoAccessErrorType = "unauthorized" | "forbidden" | null;

type UseRepoSpecViewReturn = {
  accessError: RepoAccessErrorType;
  behaviorCacheStats: BehaviorCacheStats | undefined;
  commitSha: string | undefined;
  currentLanguage: SpecLanguage | undefined;
  data: RepoSpecDocument | null;
  error: Error | null;
  isEmpty: boolean;
  isFetching: boolean;
  isLoading: boolean;
};

export const useRepoSpecView = (
  owner: string,
  repo: string,
  options: UseRepoSpecViewOptions = {}
): UseRepoSpecViewReturn => {
  const { enabled = true, language, version } = options;

  const query = useQuery({
    enabled: enabled && Boolean(owner) && Boolean(repo),
    queryFn: () => fetchRepoSpecDocument(owner, repo, { language, version }),
    queryKey: repoSpecViewKeys.document(owner, repo, language, version),
    retry: false,
  });

  const response: RepoSpecDocumentResponse | undefined = query.data;
  const data = response && isRepoDocumentCompleted(response) ? response.data : null;
  const isEmpty = response?.status === "empty";

  const currentLanguage = data?.language;
  const behaviorCacheStats = data?.behaviorCacheStats;
  const commitSha = data?.commitSha;

  const accessError: RepoAccessErrorType = (() => {
    if (query.error instanceof UnauthorizedError) return "unauthorized";
    if (query.error instanceof ForbiddenError) return "forbidden";
    return null;
  })();

  return {
    accessError,
    behaviorCacheStats,
    commitSha,
    currentLanguage,
    data,
    error: query.error,
    isEmpty,
    isFetching: query.isFetching,
    isLoading: query.isPending,
  };
};
