import type { Question } from "@/types";

export function getResumeQuestionIndex(
  questions: Question[],
  answeredQuestionIds: string[],
) {
  const answeredIds = new Set(answeredQuestionIds);

  return questions.findIndex((question) => !answeredIds.has(question.id));
}
