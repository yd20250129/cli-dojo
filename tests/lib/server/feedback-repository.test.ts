import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../lib/server/api-errors";
import { createFeedbackSubmission } from "../../../lib/server/feedback-repository";

const { getSqlMock, sqlMock } = vi.hoisted(() => ({
  getSqlMock: vi.fn(),
  sqlMock: vi.fn(),
}));

vi.mock("@/lib/server/db", () => ({
  getSql: getSqlMock,
}));

describe("createFeedbackSubmission", () => {
  beforeEach(() => {
    getSqlMock.mockReset();
    sqlMock.mockReset();
    getSqlMock.mockReturnValue(sqlMock);
  });

  it("persists feedback with screenshot metadata", async () => {
    sqlMock.mockResolvedValueOnce([
      {
        id: "feedback_123",
        created_at: new Date("2026-05-09T10:00:00.000Z"),
      },
    ]);

    const result = await createFeedbackSubmission({
      userId: "user_123",
      userEmail: "test@example.com",
      userDisplayName: "Yudai",
      category: "bug",
      message: "Something broke",
      screenshot: {
        filename: "capture.png",
        contentType: "image/png",
        sizeBytes: 5,
        base64: "aGVsbG8=",
      },
    });

    expect(sqlMock).toHaveBeenCalledTimes(1);
    const [, ...values] = sqlMock.mock.calls[0] as [TemplateStringsArray, ...unknown[]];
    expect(values).toEqual([
      "user_123",
      "test@example.com",
      "Yudai",
      "bug",
      "Something broke",
      "capture.png",
      "image/png",
      5,
      "aGVsbG8=",
    ]);
    expect(result).toEqual({
      id: "feedback_123",
      createdAt: "2026-05-09T10:00:00.000Z",
    });
  });

  it("stores null screenshot fields when no screenshot is attached", async () => {
    sqlMock.mockResolvedValueOnce([
      {
        id: "feedback_456",
        created_at: "2026-05-09T11:00:00.000Z",
      },
    ]);

    const result = await createFeedbackSubmission({
      userId: "user_123",
      userEmail: null,
      userDisplayName: null,
      category: "other",
      message: "No screenshot attached",
      screenshot: null,
    });

    const [, ...values] = sqlMock.mock.calls[0] as [TemplateStringsArray, ...unknown[]];
    expect(values.slice(5)).toEqual([null, null, null, null]);
    expect(result).toEqual({
      id: "feedback_456",
      createdAt: "2026-05-09T11:00:00.000Z",
    });
  });

  it("maps database failures to AppError", async () => {
    sqlMock.mockRejectedValueOnce(new Error("db failed"));

    await expect(
      createFeedbackSubmission({
        userId: "user_123",
        userEmail: "test@example.com",
        userDisplayName: "Yudai",
        category: "feature_request",
        message: "Please add a copy button",
        screenshot: null,
      }),
    ).rejects.toEqual(new AppError("FEEDBACK_SAVE_FAILED", 500));
  });
});
