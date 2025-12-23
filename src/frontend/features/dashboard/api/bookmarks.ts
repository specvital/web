import { apiFetch, parseJsonResponse } from "@/lib/api/client";
import type { BookmarkedRepositoriesResponse, BookmarkResponse } from "@/lib/api/types";

export const fetchBookmarkedRepositories = async (): Promise<BookmarkedRepositoriesResponse> => {
  const response = await apiFetch("/api/user/bookmarks");
  return parseJsonResponse(response);
};

export const addBookmark = async (owner: string, repo: string): Promise<BookmarkResponse> => {
  const response = await apiFetch(`/api/repositories/${owner}/${repo}/bookmark`, {
    method: "POST",
  });
  return parseJsonResponse(response);
};

export const removeBookmark = async (owner: string, repo: string): Promise<BookmarkResponse> => {
  const response = await apiFetch(`/api/repositories/${owner}/${repo}/bookmark`, {
    method: "DELETE",
  });
  return parseJsonResponse(response);
};
