import { describe, expect, it } from "vitest";

import {
  isChoiceId,
  isLearnerId,
  isSectionId,
  validateQuestionData,
} from "../../../lib/shared/validation";
import type { Question } from "../../../types";

describe("validation helpers", () => {
  it("accepts all configured section IDs and rejects invalid ones", () => {
    expect(isSectionId("SEC-01")).toBe(true);
    expect(isSectionId("SEC-02")).toBe(true);
    expect(isSectionId("SEC-03")).toBe(true);
    expect(isSectionId("SEC-04")).toBe(true);
    expect(isSectionId("SEC-05")).toBe(true);
    expect(isSectionId("SEC-06")).toBe(true);
    expect(isSectionId("SEC-99")).toBe(false);
  });

  it("accepts the four configured choice IDs only", () => {
    expect(isChoiceId("A")).toBe(true);
    expect(isChoiceId("B")).toBe(true);
    expect(isChoiceId("C")).toBe(true);
    expect(isChoiceId("D")).toBe(true);
    expect(isChoiceId("E")).toBe(false);
  });

  it("accepts valid learner IDs and rejects malformed values", () => {
    expect(isLearnerId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isLearnerId("not-a-uuid")).toBe(false);
    expect(isLearnerId("550e8400-e29b-61d4-a716-446655440000")).toBe(false);
  });

  it("validates correct question data", () => {
    const questions: Question[] = [
      {
        id: "SEC01-001",
        sectionId: "SEC-01",
        category: "ファイル操作",
        command: "ls",
        question: "現在のディレクトリにあるファイルやフォルダを一覧表示するコマンドはどれですか？",
        choices: [
          { id: "A", text: "ls" },
          { id: "B", text: "cd" },
          { id: "C", text: "mkdir" },
          { id: "D", text: "rm" },
        ],
        answer: "A",
        explanation: "ls は一覧表示に使います。",
      },
    ];

    expect(validateQuestionData(questions)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("reports malformed question data", () => {
    const questions: Question[] = [
      {
        id: "SEC01-001",
        sectionId: "SEC-99" as unknown as Question["sectionId"],
        category: "ファイル操作",
        command: "ls",
        question: "現在のディレクトリにあるファイルやフォルダを一覧表示するコマンドはどれですか？",
        choices: [
          { id: "A", text: "ls" },
          { id: "B", text: "cd" },
          { id: "C", text: "mkdir" },
        ],
        answer: "D",
        explanation: "   ",
      },
      {
        id: "SEC01-001",
        sectionId: "SEC-01",
        category: "ファイル操作",
        command: "mkdir",
        question: "新しいディレクトリを作成するコマンドはどれですか？",
        choices: [
          { id: "A", text: "rm" },
          { id: "B", text: "cat" },
          { id: "C", text: "mkdir" },
          { id: "D", text: "grep" },
        ],
        answer: "C",
        explanation: "mkdir は新しいディレクトリを作成します。",
      },
    ];

    const result = validateQuestionData(questions);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "Invalid sectionId in SEC01-001: SEC-99",
        "Missing choice D in SEC01-001",
        "Question SEC01-001 must have exactly 4 choices",
        "Answer is not in choices for SEC01-001",
        "Explanation is empty for SEC01-001",
        "Duplicate question id: SEC01-001",
      ]),
    );
  });
});
