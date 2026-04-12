import { describe, expect, it } from "vitest";

import { getResumeQuestionIndex } from "../../../lib/shared/resume";
import type { Question } from "../../../types";

const questions = [
  { id: "Q1" },
  { id: "Q2" },
  { id: "Q3" },
] as Question[];

describe("getResumeQuestionIndex", () => {
  it("starts from the first question when there are no saved answers", () => {
    expect(getResumeQuestionIndex(questions, [])).toBe(0);
  });

  it("resumes from the next unanswered question", () => {
    expect(getResumeQuestionIndex(questions, ["Q1", "Q2"])).toBe(2);
  });

  it("uses question IDs instead of answered count", () => {
    expect(getResumeQuestionIndex(questions, ["Q2"])).toBe(0);
  });

  it("returns -1 when all questions are answered", () => {
    expect(getResumeQuestionIndex(questions, ["Q1", "Q2", "Q3"])).toBe(-1);
  });
});
