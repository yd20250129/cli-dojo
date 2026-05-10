"use client";

import {
  getQuestionById,
  getQuestionsBySectionId,
  getSections,
} from "@/lib/shared/questions";
import type {
  AnonymousProgressState,
  ChoiceId,
  IncorrectAnswer,
  ProgressSummary,
  SectionId,
  SectionProgress,
  SectionResult,
} from "@/types";

type AnonymousSectionState = {
  answers: Record<string, ChoiceId>;
  cumulativeAnswers: Record<string, ChoiceId>;
  correctQuestionIds: string[];
  currentQuestionIds: string[] | null;
  latestAnsweredAt: string | null;
};

const UPDATE_EVENT = "cli-dojo:anonymous-progress-updated";
const STORAGE_KEY = "cli-dojo:anonymous-progress";
let cachedSerializedState: string | null | undefined;
let cachedSnapshot: ProgressSummary | null = null;

function getEmptySectionState(): AnonymousSectionState {
  return {
    answers: {},
    cumulativeAnswers: {},
    correctQuestionIds: [],
    currentQuestionIds: null,
    latestAnsweredAt: null,
  };
}

function getNormalizedSectionState(sectionId: SectionId, state: AnonymousProgressState) {
  const current = state[sectionId] ?? getEmptySectionState();
  const currentAnswers = current.answers ?? {};
  const currentCumulativeAnswers = current.cumulativeAnswers ?? {};
  const currentCorrectQuestionIds = Array.isArray(current.correctQuestionIds)
    ? current.correctQuestionIds
    : [];
  const cumulativeAnswers =
    Object.keys(currentCumulativeAnswers).length > 0 ? currentCumulativeAnswers : currentAnswers;
  const correctQuestionIds =
    currentCorrectQuestionIds.length > 0
      ? currentCorrectQuestionIds
      : Object.entries(cumulativeAnswers).reduce<string[]>((items, [questionId, selectedChoiceId]) => {
          const question = getQuestionById(questionId);

          if (question && question.answer === selectedChoiceId) {
            items.push(questionId);
          }

          return items;
        }, []);

  return {
    answers: currentAnswers,
    cumulativeAnswers,
    correctQuestionIds,
    currentQuestionIds: current.currentQuestionIds ?? null,
    latestAnsweredAt: current.latestAnsweredAt ?? null,
  } satisfies AnonymousSectionState;
}

function readState(): AnonymousProgressState {
  if (typeof window === "undefined") {
    return {};
  }

  const value = window.sessionStorage.getItem(STORAGE_KEY);

  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value) as AnonymousProgressState;
  } catch {
    return {};
  }
}

export function getAnonymousProgressState() {
  return readState();
}

function readSerializedState() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(STORAGE_KEY);
}

function writeState(state: AnonymousProgressState) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function subscribeAnonymousProgress(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => callback();

  window.addEventListener(UPDATE_EVENT, handler);
  window.addEventListener("pageshow", handler);
  window.addEventListener("focus", handler);

  return () => {
    window.removeEventListener(UPDATE_EVENT, handler);
    window.removeEventListener("pageshow", handler);
    window.removeEventListener("focus", handler);
  };
}

export function getAnonymousAnsweredQuestionIds(sectionId: SectionId) {
  const state = readState();
  return Object.keys(getNormalizedSectionState(sectionId, state).answers);
}

export function getAnonymousAttemptQuestionIds(sectionId: SectionId) {
  const state = readState();
  return getNormalizedSectionState(sectionId, state).currentQuestionIds;
}

export function getAnonymousIncorrectQuestionIds(sectionId: SectionId) {
  const state = readState();
  const sectionState = getNormalizedSectionState(sectionId, state);

  return buildIncorrectAnswers(sectionId, sectionState.answers).map((answer) => answer.questionId);
}

export function recordAnonymousAnswer(params: {
  sectionId: SectionId;
  questionId: string;
  selectedChoiceId: ChoiceId;
}) {
  const state = readState();
  const current = getNormalizedSectionState(params.sectionId, state);
  const question = getQuestionById(params.questionId);
  const nextCorrectQuestionIds = new Set(current.correctQuestionIds);

  if (question && question.answer === params.selectedChoiceId) {
    nextCorrectQuestionIds.add(params.questionId);
  }

  state[params.sectionId] = {
    answers: {
      ...current.answers,
      [params.questionId]: params.selectedChoiceId,
    },
    cumulativeAnswers: {
      ...current.cumulativeAnswers,
      [params.questionId]: params.selectedChoiceId,
    },
    correctQuestionIds: Array.from(nextCorrectQuestionIds),
    currentQuestionIds: current.currentQuestionIds,
    latestAnsweredAt: new Date().toISOString(),
  };

  writeState(state);
}

export function resetAnonymousSectionAttempt(
  sectionId: SectionId,
  questionIds: string[] | null = null,
) {
  const state = readState();
  const current = getNormalizedSectionState(sectionId, state);

  state[sectionId] = {
    ...current,
    answers: {},
    currentQuestionIds: questionIds,
  };

  writeState(state);
}

export function clearAnonymousSectionProgress(sectionId: SectionId) {
  const state = readState();
  delete state[sectionId];
  writeState(state);
}

export function clearAnonymousProgress() {
  writeState({});
}

function buildIncorrectAnswers(sectionId: SectionId, answers: Record<string, ChoiceId>) {
  const questions = getQuestionsBySectionId(sectionId);

  return questions.reduce<IncorrectAnswer[]>((items, question) => {
    const selectedChoiceId = answers[question.id];

    if (!selectedChoiceId || selectedChoiceId === question.answer) {
      return items;
    }

    items.push({
      questionId: question.id,
      question: question.question,
      selectedChoiceId,
      correctChoiceId: question.answer,
      explanation: question.explanation,
    });

    return items;
  }, []);
}

export function getAnonymousSectionResult(sectionId: SectionId): SectionResult | null {
  const state = readState();
  const rawSectionState = state[sectionId];

  if (!rawSectionState) {
    return null;
  }

  const sectionState = getNormalizedSectionState(sectionId, state);

  const questions = getQuestionsBySectionId(sectionId);
  const attemptQuestions =
    sectionState.currentQuestionIds && sectionState.currentQuestionIds.length > 0
      ? questions.filter((question) => sectionState.currentQuestionIds?.includes(question.id))
      : questions;
  const answeredCount = Object.keys(sectionState.answers).length;

  if (answeredCount === 0) {
    return null;
  }

  const incorrectAnswers = buildIncorrectAnswers(sectionId, sectionState.answers);
  const score = answeredCount - incorrectAnswers.length;

  return {
    sectionId,
    attemptNo: 1,
    score,
    totalQuestions: attemptQuestions.length,
    correctRate: attemptQuestions.length === 0 ? 0 : score / attemptQuestions.length,
    incorrectAnswers,
  };
}

export function getAnonymousProgressSummary(
  state: AnonymousProgressState = readState(),
): ProgressSummary {
  const sections = getSections();

  const sectionProgress: SectionProgress[] = sections.map((section) => {
    const sectionState = getNormalizedSectionState(section.id, state);
    const answers = Object.entries(sectionState.cumulativeAnswers);
    const totalQuestions = getQuestionsBySectionId(section.id).length;
    const answeredCount = answers.length;
    const correctCount = new Set(sectionState.correctQuestionIds).size;

    return {
      sectionId: section.id,
      answeredCount,
      correctCount,
      totalQuestions,
      correctRate: totalQuestions === 0 ? 0 : correctCount / totalQuestions,
      latestAttemptNo: answeredCount > 0 ? 1 : null,
      latestAnsweredAt: sectionState.latestAnsweredAt,
      isCompleted: answeredCount >= totalQuestions && totalQuestions > 0,
      isPerfect: totalQuestions > 0 && answeredCount >= totalQuestions && correctCount === totalQuestions,
    };
  });

  const totalAnsweredCount = sectionProgress.reduce(
    (sum, section) => sum + section.answeredCount,
    0,
  );
  const totalCorrectCount = sectionProgress.reduce(
    (sum, section) => sum + section.correctCount,
    0,
  );
  const totalQuestionCount = sectionProgress.reduce(
    (sum, section) => sum + section.totalQuestions,
    0,
  );

  return {
    totalAnsweredCount,
    totalCorrectCount,
    totalQuestionCount,
    overallProgressRate:
      totalQuestionCount === 0 ? 0 : totalAnsweredCount / totalQuestionCount,
    overallCorrectRate:
      totalQuestionCount === 0 ? 0 : totalCorrectCount / totalQuestionCount,
    sections: sectionProgress,
  };
}

export function getAnonymousProgressSnapshot() {
  const serializedState = readSerializedState();

  if (serializedState === cachedSerializedState && cachedSnapshot) {
    return cachedSnapshot;
  }

  cachedSerializedState = serializedState;
  cachedSnapshot = getAnonymousProgressSummary(readState());
  return cachedSnapshot;
}
