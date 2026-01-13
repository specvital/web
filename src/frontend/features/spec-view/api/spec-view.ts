import { apiFetch } from "@/lib/api/client";

import type {
  RequestSpecGenerationRequest,
  RequestSpecGenerationResponse,
  SpecDocumentResponse,
  SpecGenerationStatusResponse,
} from "../types";

export async function fetchSpecDocument(analysisId: string): Promise<SpecDocumentResponse> {
  const response = await apiFetch(`/api/spec-view/${analysisId}`);

  if (!response.ok && response.status !== 404) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || response.statusText);
  }

  if (response.status === 404) {
    return {
      generationStatus: { status: "not_found" },
      status: "generating",
    };
  }

  return response.json();
}

export async function requestSpecGeneration(
  request: RequestSpecGenerationRequest
): Promise<RequestSpecGenerationResponse> {
  const response = await apiFetch("/api/spec-view/generate", {
    body: JSON.stringify(request),
    method: "POST",
  });

  if (!response.ok && response.status !== 202 && response.status !== 409) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || response.statusText);
  }

  return response.json();
}

export async function fetchGenerationStatus(
  analysisId: string
): Promise<SpecGenerationStatusResponse> {
  const response = await apiFetch(`/api/spec-view/status/${analysisId}`);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || response.statusText);
  }

  return response.json();
}
