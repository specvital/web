import { apiFetch, parseJsonResponse } from "@/lib/api/client";
import type { LoginResponse, LogoutResponse, UserInfo } from "@/lib/api/types";

export async function fetchLogin(): Promise<LoginResponse> {
  const response = await apiFetch("/api/auth/login");
  return parseJsonResponse(response);
}

export async function fetchLogout(): Promise<LogoutResponse> {
  const response = await apiFetch("/api/auth/logout", { method: "POST" });
  // Treat 401 as success - user is already logged out
  if (response.status === 401) return { success: true };
  return parseJsonResponse(response);
}

export async function fetchCurrentUser(): Promise<UserInfo | null> {
  const response = await apiFetch("/api/auth/me");
  // Return null for unauthenticated users (expected state)
  if (response.status === 401) return null;
  // parseJsonResponse will throw for other non-ok status codes
  return parseJsonResponse(response);
}
