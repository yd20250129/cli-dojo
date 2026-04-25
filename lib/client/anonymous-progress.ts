"use client";

import {
  getQuestionById,
  getQuestionsBySectionId,
  getSections,
} from "@/lib/shared/questions";
import type {
  ChoiceId,
  IncorrectAnswer,
  ProgressSummary,
  SectionId,
  SectionProgress,
  SectionResult,
} from "@/types";

type AnonymousSectionState = {
  answers: Record<string, ChoiceId>;
  latestAnsweredAt: string | null;
};

type AnonymousProgressState = Partial<Record<SectionId, AnonymousSectionState>>;

const UPDATE_EVENT = "cli-dojo:anonymous-progress-updated";
const STORAGE_KEY = "cli-dojo:anonymous-progress";

function getEmptySectionState(): AnonymousSectionState {
  return {
    answers: {},
    latestAnsweredAt: null,
  };
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
  return Object.keys(state[sectionId]?.answers ?? {});
}

export function recordAnonymousAnswer(params: {
  sectionId: SectionId;
  questionId: string;
  selectedChoiceId: ChoiceId;
}) {
  const state = readState();
  const current = state[params.sectionId] ?? getEmptySectionState();

  state[params.sectionId] = {
    answers: {
      ...current.answers,
      [params.questionId]: params.selectedChoiceId,
    },
    latestAnsweredAt: new Date().toISOString(),
  };

  writeState(state);
}

export function clearAnonymousSectionProgress(sectionId: SectionId) {
  const state = readState();
  delete state[sectionId];
  writeState(state);
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
  const sectionState = state[sectionId];

  if (!sectionState) {
    return null;
  }

  const questions = getQuestionsBySectionId(sectionId);
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
    totalQuestions: questions.length,
    correctRate: answeredCount === 0 ? 0 : score / answeredCount,
    incorrectAnswers,
  };
}

export function getAnonymousProgressSummary(): ProgressSummary {
  const state = readState();
  const sections = getSections();

  const sectionProgress: SectionProgress[] = sections.map((section) => {
    const sectionState = state[section.id] ?? getEmptySectionState();
    const answers = Object.entries(sectionState.answers);
    const totalQuestions = getQuestionsBySectionId(section.id).length;
    const answeredCount = answers.length;
    const correctCount = answers.reduce((count, [questionId, selectedChoiceId]) => {
      const question = getQuestionById(questionId);
      return count + (question && question.answer === selectedChoiceId ? 1 : 0);
    }, 0);

    return {
      sectionId: section.id,
      answeredCount,
      correctCount,
      totalQuestions,
      correctRate: answeredCount === 0 ? 0 : correctCount / answeredCount,
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
      totalAnsweredCount === 0 ? 0 : totalCorrectCount / totalAnsweredCount,
    sections: sectionProgress,
  };
}

export function getAnonymousProgressSnapshot() {
  return getAnonymousProgressSummary();
}
