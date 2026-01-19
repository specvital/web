/**
 * Playwright route handlers for API mocking
 * Usage: await setupMockHandlers(page, { repositories: mockRepositoriesPage1 })
 *
 * Note: Next.js proxies /api/* requests to backend via rewrites.
 * We intercept browser requests (relative paths) not backend URLs.
 */

import type { Page, Route } from "@playwright/test";
import type {
  UserAnalyzedRepositoriesResponse,
  RepositoryStatsResponse,
  GitHubRepositoriesResponse,
  GitHubOrganizationsResponse,
  UserSubscriptionResponse,
  UsageStatusResponse,
  BookmarkResponse,
  ReanalyzeResponse,
} from "./api-responses";

export interface MockHandlersOptions {
  repositories?: UserAnalyzedRepositoriesResponse;
  repositoriesPage2?: UserAnalyzedRepositoriesResponse;
  stats?: RepositoryStatsResponse;
  githubRepos?: GitHubRepositoriesResponse;
  githubOrgs?: GitHubOrganizationsResponse;
  orgRepos?: Record<string, GitHubRepositoriesResponse>;
  subscription?: UserSubscriptionResponse;
  usage?: UsageStatusResponse;
  bookmarkResponse?: BookmarkResponse;
  reanalyzeResponse?: ReanalyzeResponse;
  // Dynamic handlers for testing specific scenarios
  onRepositoriesRequest?: (url: URL) => UserAnalyzedRepositoriesResponse | null;
  onBookmark?: (owner: string, repo: string, method: string) => BookmarkResponse;
  onReanalyze?: (owner: string, repo: string) => ReanalyzeResponse;
}

type RouteHandler = (route: Route) => Promise<void>;

/**
 * Setup mock handlers for API routes
 * Routes intercept browser requests (which go through Next.js proxy)
 */
export async function setupMockHandlers(
  page: Page,
  options: MockHandlersOptions = {}
): Promise<void> {
  const handlers: Array<{ pattern: string | RegExp; handler: RouteHandler }> = [];

  // /api/repositories/recent (Dashboard uses this endpoint)
  if (options.repositories || options.onRepositoriesRequest) {
    handlers.push({
      pattern: "**/api/repositories/recent*",
      handler: async (route) => {
        const url = new URL(route.request().url());

        // Check for dynamic handler first
        if (options.onRepositoriesRequest) {
          const response = options.onRepositoriesRequest(url);
          if (response) {
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(response),
            });
          }
        }

        // Check for pagination
        const cursor = url.searchParams.get("cursor");
        if (cursor === "cursor-page-2" && options.repositoriesPage2) {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(options.repositoriesPage2),
          });
        }

        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(options.repositories),
        });
      },
    });
  }

  // /api/repositories/stats
  if (options.stats) {
    handlers.push({
      pattern: "**/api/repositories/stats",
      handler: async (route) => {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(options.stats),
        });
      },
    });
  }

  // /api/user/github/repositories
  if (options.githubRepos) {
    handlers.push({
      pattern: "**/api/user/github/repositories*",
      handler: async (route) => {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(options.githubRepos),
        });
      },
    });
  }

  // /api/user/github/organizations (exact match, not including sub-paths)
  if (options.githubOrgs) {
    handlers.push({
      pattern: /\/api\/user\/github\/organizations(\?.*)?$/,
      handler: async (route) => {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(options.githubOrgs),
        });
      },
    });
  }

  // /api/user/github/organizations/{org}/repositories
  if (options.orgRepos) {
    handlers.push({
      pattern: /\/api\/user\/github\/organizations\/([^/]+)\/repositories/,
      handler: async (route) => {
        const url = new URL(route.request().url());
        const orgMatch = url.pathname.match(
          /\/api\/user\/github\/organizations\/([^/]+)\/repositories/
        );
        const org = orgMatch?.[1];

        if (org && options.orgRepos?.[org]) {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(options.orgRepos[org]),
          });
        }

        return route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: "Organization not found" }),
        });
      },
    });
  }

  // /api/user/subscription
  if (options.subscription) {
    handlers.push({
      pattern: "**/api/user/subscription",
      handler: async (route) => {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(options.subscription),
        });
      },
    });
  }

  // /api/usage/current
  if (options.usage) {
    handlers.push({
      pattern: "**/api/usage/current",
      handler: async (route) => {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(options.usage),
        });
      },
    });
  }

  // /api/repositories/{owner}/{repo}/bookmark (POST/DELETE)
  if (options.bookmarkResponse || options.onBookmark) {
    handlers.push({
      pattern: /\/api\/repositories\/([^/]+)\/([^/]+)\/bookmark/,
      handler: async (route) => {
        const url = new URL(route.request().url());
        const match = url.pathname.match(
          /\/api\/repositories\/([^/]+)\/([^/]+)\/bookmark/
        );
        const owner = match?.[1] ?? "";
        const repo = match?.[2] ?? "";
        const method = route.request().method();

        let response: BookmarkResponse;
        if (options.onBookmark) {
          response = options.onBookmark(owner, repo, method);
        } else {
          response = options.bookmarkResponse ?? {
            success: true,
            isBookmarked: method === "POST",
          };
        }

        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(response),
        });
      },
    });
  }

  // /api/repositories/{owner}/{repo}/reanalyze
  if (options.reanalyzeResponse || options.onReanalyze) {
    handlers.push({
      pattern: /\/api\/repositories\/([^/]+)\/([^/]+)\/reanalyze/,
      handler: async (route) => {
        const url = new URL(route.request().url());
        const match = url.pathname.match(
          /\/api\/repositories\/([^/]+)\/([^/]+)\/reanalyze/
        );
        const owner = match?.[1] ?? "";
        const repo = match?.[2] ?? "";

        let response: ReanalyzeResponse;
        if (options.onReanalyze) {
          response = options.onReanalyze(owner, repo);
        } else {
          response = options.reanalyzeResponse ?? { status: "queued" };
        }

        return route.fulfill({
          status: 202,
          contentType: "application/json",
          body: JSON.stringify(response),
        });
      },
    });
  }

  // Register all handlers
  for (const { pattern, handler } of handlers) {
    await page.route(pattern, handler);
  }
}

/**
 * Clear all mock handlers
 */
export async function clearMockHandlers(page: Page): Promise<void> {
  await page.unrouteAll();
}

/**
 * Create a dynamic repositories handler for filtering/sorting scenarios
 */
export function createRepositoriesHandler(
  baseData: UserAnalyzedRepositoriesResponse,
  filters: {
    sortedByName?: UserAnalyzedRepositoriesResponse;
    sortedByTests?: UserAnalyzedRepositoriesResponse;
    filteredMine?: UserAnalyzedRepositoriesResponse;
    filteredOrg?: UserAnalyzedRepositoriesResponse;
    filteredOthers?: UserAnalyzedRepositoriesResponse;
    searchResults?: Record<string, UserAnalyzedRepositoriesResponse>;
  } = {}
): (url: URL) => UserAnalyzedRepositoriesResponse {
  return (url: URL) => {
    const sortBy = url.searchParams.get("sortBy");
    const ownership = url.searchParams.get("ownership");
    const search = url.searchParams.get("search") || url.searchParams.get("q");

    // Handle sorting
    if (sortBy === "name" && filters.sortedByName) {
      return filters.sortedByName;
    }
    if (sortBy === "tests" && filters.sortedByTests) {
      return filters.sortedByTests;
    }

    // Handle ownership filter
    if (ownership === "mine" && filters.filteredMine) {
      return filters.filteredMine;
    }
    if (ownership === "organization" && filters.filteredOrg) {
      return filters.filteredOrg;
    }
    if (ownership === "others" && filters.filteredOthers) {
      return filters.filteredOthers;
    }

    // Handle search
    if (search && filters.searchResults?.[search]) {
      return filters.searchResults[search];
    }

    return baseData;
  };
}
