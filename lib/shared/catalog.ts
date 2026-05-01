import type {
  Choice,
  ChoiceId,
  LocalizedQuestion,
  Question,
  QuestionDef,
  QuestionLocaleMap,
  Section,
  SectionDef,
  SectionLocaleMap,
} from "@/types";

const requiredChoiceIds = ["A", "B", "C", "D"] as const;

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function assertChoiceTextMap(
  value: unknown,
  label: string,
): asserts value is Record<ChoiceId, string> {
  if (typeof value !== "object" || value === null) {
    throw new Error(`${label} must be an object`);
  }

  for (const choiceId of requiredChoiceIds) {
    const choiceText = (value as Record<string, unknown>)[choiceId];
    assertNonEmptyString(choiceText, `${label}.${choiceId}`);
  }
}

function assertLocalizedQuestion(
  value: unknown,
  questionId: string,
): asserts value is LocalizedQuestion {
  if (typeof value !== "object" || value === null) {
    throw new Error(`Localized question data for ${questionId} must be an object`);
  }

  const data = value as Record<string, unknown>;
  assertNonEmptyString(data.category, `${questionId}.category`);
  assertNonEmptyString(data.question, `${questionId}.question`);
  assertChoiceTextMap(data.choices, `${questionId}.choices`);
  assertNonEmptyString(data.explanation, `${questionId}.explanation`);
}

function assertLocalizedSection(
  value: unknown,
  sectionId: string,
): asserts value is SectionLocaleMap[keyof SectionLocaleMap] {
  if (typeof value !== "object" || value === null) {
    throw new Error(`Localized section data for ${sectionId} must be an object`);
  }

  const data = value as Record<string, unknown>;
  assertNonEmptyString(data.name, `${sectionId}.name`);
  assertNonEmptyString(data.description, `${sectionId}.description`);
}

function buildChoices(
  choiceIds: readonly ChoiceId[],
  localizedChoices: Record<ChoiceId, string>,
): Choice[] {
  return choiceIds.map((choiceId) => ({
    id: choiceId,
    text: localizedChoices[choiceId],
  }));
}

export function buildQuestionCatalog(
  defs: readonly QuestionDef[],
  localeMap: QuestionLocaleMap,
): Question[] {
  return defs.map((def) => {
    const localized = localeMap[def.id];

    if (!localized) {
      throw new Error(`Missing localized question data for ${def.id}`);
    }

    assertLocalizedQuestion(localized, def.id);

    return {
      id: def.id,
      sectionId: def.sectionId,
      category: localized.category,
      command: def.command,
      question: localized.question,
      choices: buildChoices(def.choiceIds, localized.choices),
      answer: def.answer,
      explanation: localized.explanation,
    };
  });
}

export function mergeQuestionLocaleMaps(
  ...localeMaps: readonly QuestionLocaleMap[]
): QuestionLocaleMap {
  return Object.assign({}, ...localeMaps);
}

export function buildSectionCatalog(
  defs: readonly SectionDef[],
  localeMap: SectionLocaleMap,
): Section[] {
  return defs.map((def) => {
    const localized = localeMap[def.id];

    if (!localized) {
      throw new Error(`Missing localized section data for ${def.id}`);
    }

    assertLocalizedSection(localized, def.id);

    return {
      id: def.id,
      name: localized.name,
      description: localized.description,
      order: def.order,
      questionCount: def.questionCount,
    };
  });
}
