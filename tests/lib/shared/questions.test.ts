import { describe, expect, it } from "vitest";

import { sec01Questions } from "../../../data/questions/sec01";
import { sec02Questions } from "../../../data/questions/sec02";
import { sec03Questions } from "../../../data/questions/sec03";
import { sec04Questions } from "../../../data/questions/sec04";
import { sec05Questions } from "../../../data/questions/sec05";
import { sec06Questions } from "../../../data/questions/sec06";
import { sections } from "../../../data/sections";
import {
  getQuestionById,
  getQuestionsBySectionId,
  getQuestionsForLocale,
  getSectionById,
  getSections,
  getSectionsForLocale,
  questions,
} from "../../../lib/shared/questions";
import { validateQuestionData } from "../../../lib/shared/validation";

describe("question catalogue", () => {
  it("keeps sections sorted by order", () => {
    expect(getSections().map((section) => section.id)).toEqual([
      "SEC-01",
      "SEC-02",
      "SEC-03",
      "SEC-04",
      "SEC-05",
      "SEC-06",
    ]);
  });

  it("exposes the configured question counts per section", () => {
    for (const section of sections) {
      expect(getQuestionsBySectionId(section.id).length).toBe(section.questionCount);
    }
  });

  it("can resolve sections and questions by ID", () => {
    expect(getSectionById("SEC-03")?.name).toBe("開発サーバー");
    expect(getSectionById("SEC-99")).toBeNull();
    expect(getQuestionById("SEC04-008")?.command).toBe("git commit");
    expect(getQuestionById("missing")).toBeNull();
  });

  it("exports the full question catalog without validation errors", () => {
    expect(questions).toHaveLength(118);
    expect(validateQuestionData(questions).ok).toBe(true);
  });

  it("keeps the per-section question lists aligned with the exported catalog", () => {
    expect(sec01Questions).toEqual(getQuestionsBySectionId("SEC-01"));
    expect(sec02Questions).toEqual(getQuestionsBySectionId("SEC-02"));
    expect(sec03Questions).toEqual(getQuestionsBySectionId("SEC-03"));
    expect(sec04Questions).toEqual(getQuestionsBySectionId("SEC-04"));
    expect(sec05Questions).toEqual(getQuestionsBySectionId("SEC-05"));
    expect(sec06Questions).toEqual(getQuestionsBySectionId("SEC-06"));
  });

  it("falls back to the Japanese catalog for en until translations are added", () => {
    expect(getSectionsForLocale("en")).toEqual(getSectionsForLocale("ja"));
    expect(getQuestionsForLocale("en")).toEqual(getQuestionsForLocale("ja"));
  });
});
