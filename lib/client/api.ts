"use client";

import { getOrCreateLearnerId } from "@/lib/client/learner-id";
import type {
  ApiErrorResponse,
  ApiSuccess,
  ChoiceId,
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

export function fetchProgress() {
  return requestJson<ProgressSummary>("/api/progress");
}

export function startAttempt(sectionId: SectionId, retry = false) {
  return requestJson<SectionAttempt>("/api/attempts", {
    method: "POST",
    body: JSON.stringify({ sectionId, retry }),
  });
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
