"use client";

import { getOrCreateLearnerId } from "@/lib/client/learner-id";
import type {
  ApiErrorResponse,
  ApiSuccess,
  ChoiceId,
  CurrentSectionAttempt,
  ProgressSummary,
  SectionAttempt,
  SectionId,
  SectionResult,
} from "@/types";

async function requestJson<T>(path: string, init: RequestInit = {}) {
  const learnerId = getOrCreateLearnerId();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Learner-Id": learnerId,
      ...init.headers,
    },
  });
  const payload = (await response.json()) as ApiSuccess<T> | ApiErrorResponse;

  if (!response.ok || "error" in payload) {
    throw new Error("error" in payload ? payload.error.message : "通信に失敗しました");
  }

  return payload.data;
}

const startAttemptRequests = new Map<string, Promise<CurrentSectionAttempt>>();

export function fetchProgress() {
  return requestJson<ProgressSummary>("/api/progress");
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
