import type {
  AnonymousProgressState,
  AnonymousSectionProgress,
  ChoiceId,
  Question,
  SectionId,
} from "@/types";

const sectionIds = ["SEC-01", "SEC-02", "SEC-03", "SEC-04", "SEC-05", "SEC-06"] as const;
const choiceIds = ["A", "B", "C", "D"] as const;

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

export function isSectionId(value: string): value is SectionId {
  return sectionIds.includes(value as SectionId);
}

export function isChoiceId(value: string): value is ChoiceId {
  return choiceIds.includes(value as ChoiceId);
}

export function isLearnerId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isAnonymousSectionProgress(
  value: unknown,
): value is { answers?: unknown; latestAnsweredAt?: unknown } {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function parseAnonymousProgressState(value: unknown): AnonymousProgressState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const parsed: AnonymousProgressState = {};

  for (const [sectionKey, rawSection] of Object.entries(value)) {
    if (!isSectionId(sectionKey) || !isAnonymousSectionProgress(rawSection)) {
      continue;
    }

    const rawAnswers = rawSection.answers;

    if (!rawAnswers || typeof rawAnswers !== "object" || Array.isArray(rawAnswers)) {
      continue;
    }

    const answers: Record<string, ChoiceId> = {};

    for (const [questionId, choiceId] of Object.entries(rawAnswers)) {
      if (typeof questionId === "string" && typeof choiceId === "string" && isChoiceId(choiceId)) {
        answers[questionId] = choiceId;
      }
    }

    const sectionState: AnonymousSectionProgress = {
      answers,
      latestAnsweredAt:
        typeof rawSection.latestAnsweredAt === "string" ? rawSection.latestAnsweredAt : null,
    };

    parsed[sectionKey] = sectionState;
  }

  return parsed;
}

export function validateQuestionData(questions: Question[]): ValidationResult {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const question of questions) {
    if (ids.has(question.id)) {
      errors.push(`Duplicate question id: ${question.id}`);
    }

    ids.add(question.id);

    if (!isSectionId(question.sectionId)) {
      errors.push(`Invalid sectionId in ${question.id}: ${question.sectionId}`);
    }

    const choiceIdSet = new Set(question.choices.map((choice) => choice.id));

    for (const choiceId of choiceIds) {
      if (!choiceIdSet.has(choiceId)) {
        errors.push(`Missing choice ${choiceId} in ${question.id}`);
      }
    }

    if (question.choices.length !== 4) {
      errors.push(`Question ${question.id} must have exactly 4 choices`);
    }

    if (!choiceIdSet.has(question.answer)) {
      errors.push(`Answer is not in choices for ${question.id}`);
    }

    if (!question.explanation.trim()) {
      errors.push(`Explanation is empty for ${question.id}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
