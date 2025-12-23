const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const DEFAULT_TIMEOUT_MS = 30000;

export const getApiUrl = (path: string): string => {
  if (typeof window === "undefined") {
    return `${API_URL}${path}`;
  }
  return path;
};

type FetchOptions = {
  method?: "DELETE" | "GET" | "POST";
  timeoutMs?: number;
};

export async function apiFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const { method = "GET", timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(getApiUrl(path), {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
      method,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : "Unknown"}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || response.statusText);
  }
  return response.json();
}
