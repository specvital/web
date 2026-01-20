import { apiFetch } from "@/lib/api/client";

import type {
  RequestSpecGenerationRequest,
  RequestSpecGenerationResponse,
  SpecDocumentResponse,
  SpecGenerationStatusResponse,
  SpecLanguage,
} from "../types";

export class QuotaExceededError extends Error {
  limit: number;
  used: number;

  constructor(message: string, used: number, limit: number) {
    super(message);
    this.name = "QuotaExceededError";
    this.used = used;
    this.limit = limit;
  }
}

export class NoSubscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoSubscriptionError";
  }
}

export const fetchSpecDocument = async (
  analysisId: string,
  language?: SpecLanguage
): Promise<SpecDocumentResponse> => {
  const url = language
    ? `/api/spec-view/${analysisId}?language=${encodeURIComponent(language)}`
    : `/api/spec-view/${analysisId}`;
  const response = await apiFetch(url);

  if (!response.ok && response.status !== 404) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || response.statusText);
  }

  if (response.status === 404) {
    const statusUrl = language
      ? `/api/spec-view/status/${analysisId}?language=${encodeURIComponent(language)}`
      : `/api/spec-view/status/${analysisId}`;
    const statusResponse = await apiFetch(statusUrl);

    if (statusResponse.ok) {
      const statusData: SpecGenerationStatusResponse = await statusResponse.json();
      return {
        generationStatus: { status: statusData.status },
        status: "generating",
      };
    }

    return {
      generationStatus: { status: "not_found" },
      status: "generating",
    };
  }

  return response.json();
};

export const requestSpecGeneration = async (
  request: RequestSpecGenerationRequest
): Promise<RequestSpecGenerationResponse> => {
  const response = await apiFetch("/api/spec-view/generate", {
    body: JSON.stringify(request),
    method: "POST",
  });

  if (response.status === 403) {
    const errorBody = await response.json().catch(() => ({}));
    throw new NoSubscriptionError(errorBody.detail || "Active subscription required");
  }

  if (response.status === 429) {
    const errorBody = await response.json().catch(() => ({}));
    throw new QuotaExceededError(
      errorBody.detail || "Quota exceeded",
      errorBody.used ?? 0,
      errorBody.limit ?? 0
    );
  }

  if (!response.ok && response.status !== 202 && response.status !== 409) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || response.statusText);
  }

  return response.json();
};

export const fetchGenerationStatus = async (
  analysisId: string,
  language?: SpecLanguage
): Promise<SpecGenerationStatusResponse> => {
  const url = language
    ? `/api/spec-view/status/${analysisId}?language=${encodeURIComponent(language)}`
    : `/api/spec-view/status/${analysisId}`;
  const response = await apiFetch(url);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || response.statusText);
  }

  return response.json();
};
