import { describe, expect, it } from "vitest";

import { getAnonymousProgressSummary } from "../../../lib/client/anonymous-progress";
import type { AnonymousProgressState } from "../../../types";

describe("anonymous progress summary", () => {
  it("keeps cumulative progress and correct rate after restarting a section", () => {
    const state: AnonymousProgressState = {
      "SEC-01": {
        answers: {},
        cumulativeAnswers: {
          "SEC01-001": "A",
          "SEC01-002": "B",
        },
        correctQuestionIds: ["SEC01-001"],
        currentQuestionIds: null,
        latestAnsweredAt: "2026-05-10T00:00:00.000Z",
      },
    };

    const summary = getAnonymousProgressSummary(state);
    const section = summary.sections.find((item) => item.sectionId === "SEC-01");

    expect(section).toMatchObject({
      answeredCount: 2,
      correctCount: 1,
      isCompleted: false,
    });
    expect(section?.correctRate).toBe(1 / (section?.totalQuestions ?? 1));
    expect(summary.totalAnsweredCount).toBe(2);
    expect(summary.totalCorrectCount).toBe(1);
    expect(summary.overallCorrectRate).toBe(1 / summary.totalQuestionCount);
  });

  it("treats one-time correct answers as permanently correct", () => {
    const state: AnonymousProgressState = {
      "SEC-01": {
        answers: {
          "SEC01-001": "B",
        },
        cumulativeAnswers: {
          "SEC01-001": "B",
        },
        correctQuestionIds: ["SEC01-001"],
        currentQuestionIds: ["SEC01-001"],
        latestAnsweredAt: "2026-05-10T00:00:00.000Z",
      },
    };

    const summary = getAnonymousProgressSummary(state);
    const section = summary.sections.find((item) => item.sectionId === "SEC-01");

    expect(section).toMatchObject({
      answeredCount: 1,
      correctCount: 1,
    });
    expect(section?.correctRate).toBe(1 / (section?.totalQuestions ?? 1));
  });
});
