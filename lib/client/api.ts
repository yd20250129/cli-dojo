"use client";

import type {
  AnonymousProgressState,
  ApiErrorResponse,
  ApiSuccess,
  ChoiceId,
  CurrentSectionAttempt,
  MigrateProgressResult,
  ProgressSummary,
  SectionAttempt,
  SectionId,
  SectionResult,
  UpdateProfileRequest,
  UserProfile,
} from "@/types";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function requestJson<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = (await response.json()) as ApiSuccess<T> | ApiErrorResponse;

  if (!response.ok || "error" in payload) {
    if ("error" in payload) {
      throw new ApiRequestError(payload.error.message, payload.error.code, response.status);
    }

    throw new ApiRequestError("通信に失敗しました", "UNKNOWN", response.status);
  }

  return payload.data;
}

const startAttemptRequests = new Map<string, Promise<CurrentSectionAttempt>>();

export function fetchProgress() {
  return requestJson<ProgressSummary>("/api/progress");
}

export function migrateAnonymousProgress(anonymousProgress: AnonymousProgressState) {
  return requestJson<MigrateProgressResult>("/api/progress/migrate-anonymous", {
    method: "POST",
    body: JSON.stringify({ anonymousProgress }),
  });
}

export function startAttempt(sectionId: SectionId, retry = false) {
  if (!retry) {
    const existingRequest = startAttemptRequests.get(sectionId);

    if (existingRequest) {
      return existingRequest;
    }
  }

  const request = requestJson<CurrentSectionAttempt>("/api/attempts", {
    method: "POST",
    body: JSON.stringify({ sectionId, retry }),
  });

  if (retry) {
    return request;
  }

  startAttemptRequests.set(sectionId, request);
  request.then(
    () => startAttemptRequests.delete(sectionId),
    () => startAttemptRequests.delete(sectionId),
  );

  return request;
}

export function saveAnswer(params: {
  attemptId: string;
  sectionId: SectionId;
  questionId: string;
  selectedChoiceId: ChoiceId;
}) {
  return requestJson("/api/answers", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function completeAttempt(attemptId: string) {
  return requestJson<SectionAttempt>(`/api/attempts/${attemptId}/complete`, {
    method: "POST",
  });
}

export function fetchSectionResult(sectionId: SectionId, attemptId?: string) {
  const query = attemptId ? `?attemptId=${encodeURIComponent(attemptId)}` : "";

  return requestJson<SectionResult | null>(`/api/sections/${sectionId}/result${query}`);
}

export function updateProfile(request: UpdateProfileRequest) {
  return requestJson<UserProfile>("/api/settings/profile", {
    method: "PATCH",
    body: JSON.stringify(request),
  });
}
