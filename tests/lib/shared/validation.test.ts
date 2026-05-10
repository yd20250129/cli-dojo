import { describe, expect, it } from "vitest";

import {
  DISPLAY_NAME_MAX_LENGTH,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  FEEDBACK_SCREENSHOT_MAX_BYTES,
  formatBytes,
  isChoiceId,
  parseFeedbackCategory,
  isSectionId,
  parseAnonymousProgressState,
  validateDisplayName,
  validateFeedbackMessage,
  validateFeedbackScreenshot,
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

  it("sanitizes anonymous progress payloads", () => {
    expect(
      parseAnonymousProgressState({
        "SEC-01": {
          answers: {
            "SEC01-001": "A",
            "SEC01-002": "Z",
          },
          latestAnsweredAt: "2026-05-01T00:00:00.000Z",
        },
        "SEC-99": {
          answers: {
            "SEC99-001": "A",
          },
        },
      }),
    ).toEqual({
      "SEC-01": {
        answers: {
          "SEC01-001": "A",
        },
        cumulativeAnswers: {
          "SEC01-001": "A",
        },
        correctQuestionIds: [],
        currentQuestionIds: null,
        latestAnsweredAt: "2026-05-01T00:00:00.000Z",
      },
    });
  });

  it("validates correct question data", () => {
    const questions: Question[] = [
      {
        id: "SEC01-001",
        sectionId: "SEC-01",
        categoryKey: "CAT-023",
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
        categoryKey: "CAT-023",
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
        categoryKey: "CAT-020",
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

  it("normalizes a valid display name", () => {
    expect(validateDisplayName("  Yudai   Tanaka  ")).toEqual({
      ok: true,
      value: "Yudai Tanaka",
      errors: [],
    });
  });

  it("rejects invalid display names", () => {
    expect(validateDisplayName("   ")).toEqual({
      ok: false,
      value: null,
      errors: ["Display name is required"],
    });

    expect(validateDisplayName("a".repeat(DISPLAY_NAME_MAX_LENGTH + 1))).toEqual({
      ok: false,
      value: null,
      errors: [`Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer`],
    });

    expect(validateDisplayName("Yudai\u0000Tanaka")).toEqual({
      ok: false,
      value: null,
      errors: ["Display name contains unsupported control characters"],
    });
  });

  it("parses feedback categories", () => {
    expect(parseFeedbackCategory("bug")).toBe("bug");
    expect(parseFeedbackCategory("feature_request")).toBe("feature_request");
    expect(parseFeedbackCategory("other")).toBe("other");
    expect(parseFeedbackCategory("unknown")).toBeNull();
  });

  it("validates feedback messages", () => {
    expect(validateFeedbackMessage("  something happened  ")).toEqual({
      ok: true,
      value: "something happened",
      errors: [],
    });

    expect(validateFeedbackMessage("   ")).toEqual({
      ok: false,
      value: null,
      errors: ["本文を入力してください"],
    });

    expect(validateFeedbackMessage("a".repeat(FEEDBACK_MESSAGE_MAX_LENGTH + 1))).toEqual({
      ok: false,
      value: null,
      errors: [`本文は ${FEEDBACK_MESSAGE_MAX_LENGTH} 文字以内で入力してください`],
    });
  });

  it("validates feedback screenshots", () => {
    const file = new File(["hello"], "capture.png", { type: "image/png" });
    const result = validateFeedbackScreenshot(file);

    expect(result.ok).toBe(true);
    expect(result.value).toEqual({
      filename: "capture.png",
      contentType: "image/png",
      sizeBytes: 5,
      base64: "",
    });

    const invalidType = new File(["hello"], "capture.gif", { type: "image/gif" });
    expect(validateFeedbackScreenshot(invalidType)).toEqual({
      ok: false,
      value: null,
      errors: ["スクリーンショットは PNG / JPEG / WebP のいずれかを選択してください"],
    });

    const largeFile = new File(["a".repeat(FEEDBACK_SCREENSHOT_MAX_BYTES + 1)], "large.png", {
      type: "image/png",
    });
    expect(validateFeedbackScreenshot(largeFile)).toEqual({
      ok: false,
      value: null,
      errors: [
        `スクリーンショットは ${formatBytes(FEEDBACK_SCREENSHOT_MAX_BYTES)} 以内にしてください`,
      ],
    });

    expect(validateFeedbackScreenshot({})).toEqual({
      ok: false,
      value: null,
      errors: ["画像ファイルを選択してください"],
    });

    expect(
      validateFeedbackScreenshot(new File([], "empty.png", { type: "image/png" })),
    ).toEqual({
      ok: true,
      value: null,
      errors: [],
    });
  });
});
