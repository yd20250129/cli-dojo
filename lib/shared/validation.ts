import type {
  AnonymousProgressState,
  AnonymousSectionProgress,
  ChoiceId,
  FeedbackCategory,
  Question,
  SectionId,
} from "@/types";

const sectionIds = ["SEC-01", "SEC-02", "SEC-03", "SEC-04", "SEC-05", "SEC-06"] as const;
const choiceIds = ["A", "B", "C", "D"] as const;

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

export const DISPLAY_NAME_MAX_LENGTH = 40;
export const FEEDBACK_MESSAGE_MAX_LENGTH = 1000;
export const FEEDBACK_SCREENSHOT_MAX_BYTES = 1024 * 1024;
const feedbackCategories = ["bug", "feature_request", "other"] as const;
const feedbackScreenshotTypes = ["image/png", "image/jpeg", "image/webp"] as const;

export function isSectionId(value: string): value is SectionId {
  return sectionIds.includes(value as SectionId);
}

export function isChoiceId(value: string): value is ChoiceId {
  return choiceIds.includes(value as ChoiceId);
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

export function validateDisplayName(value: unknown): ValidationResult & { value: string | null } {
  if (typeof value !== "string") {
    return {
      ok: false,
      value: null,
      errors: ["Display name must be a string"],
    };
  }

  const normalizedValue = value.trim().replace(/\s+/g, " ");
  const errors: string[] = [];

  if (!normalizedValue) {
    errors.push("Display name is required");
  }

  if (normalizedValue.length > DISPLAY_NAME_MAX_LENGTH) {
    errors.push(`Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer`);
  }

  if (/[\u0000-\u001f\u007f]/.test(normalizedValue)) {
    errors.push("Display name contains unsupported control characters");
  }

  return {
    ok: errors.length === 0,
    value: errors.length === 0 ? normalizedValue : null,
    errors,
  };
}

export function parseFeedbackCategory(value: unknown): FeedbackCategory | null {
  if (typeof value !== "string") {
    return null;
  }

  return feedbackCategories.includes(value as FeedbackCategory)
    ? (value as FeedbackCategory)
    : null;
}

export function validateFeedbackMessage(
  value: unknown,
): ValidationResult & { value: string | null } {
  if (typeof value !== "string") {
    return {
      ok: false,
      value: null,
      errors: ["本文を入力してください"],
    };
  }

  const normalizedValue = value.trim();
  const errors: string[] = [];

  if (!normalizedValue) {
    errors.push("本文を入力してください");
  }

  if (normalizedValue.length > FEEDBACK_MESSAGE_MAX_LENGTH) {
    errors.push(`本文は ${FEEDBACK_MESSAGE_MAX_LENGTH} 文字以内で入力してください`);
  }

  return {
    ok: errors.length === 0,
    value: errors.length === 0 ? normalizedValue : null,
    errors,
  };
}

function isFileLike(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

export function validateFeedbackScreenshot(
  value: unknown,
): ValidationResult & {
  value:
    | {
        filename: string;
        contentType: string;
        sizeBytes: number;
        base64: string;
      }
    | null;
} {
  if (value == null) {
    return {
      ok: true,
      value: null,
      errors: [],
    };
  }

  if (!isFileLike(value)) {
    return {
      ok: false,
      value: null,
      errors: ["画像ファイルを選択してください"],
    };
  }

  if (!value.size) {
    return {
      ok: true,
      value: null,
      errors: [],
    };
  }

  const errors: string[] = [];

  if (!feedbackScreenshotTypes.includes(value.type as (typeof feedbackScreenshotTypes)[number])) {
    errors.push("スクリーンショットは PNG / JPEG / WebP のいずれかを選択してください");
  }

  if (value.size > FEEDBACK_SCREENSHOT_MAX_BYTES) {
    errors.push(
      `スクリーンショットは ${formatBytes(FEEDBACK_SCREENSHOT_MAX_BYTES)} 以内にしてください`,
    );
  }

  if (errors.length > 0) {
    return {
      ok: false,
      value: null,
      errors,
    };
  }

  return {
    ok: true,
    value: {
      filename: value.name || "screenshot",
      contentType: value.type,
      sizeBytes: value.size,
      base64: "",
    },
    errors: [],
  };
}

export function formatBytes(value: number) {
  if (value >= 1024 * 1024) {
    return `${Math.round((value / (1024 * 1024)) * 10) / 10}MB`;
  }

  return `${Math.round((value / 1024) * 10) / 10}KB`;
}
