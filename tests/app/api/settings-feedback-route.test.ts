import { afterEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/server/api-errors";

const { getAuthenticatedUserMock, createFeedbackSubmissionMock } = vi.hoisted(() => ({
  getAuthenticatedUserMock: vi.fn(),
  createFeedbackSubmissionMock: vi.fn(),
}));

vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}));

vi.mock("@/lib/server/feedback-repository", () => ({
  createFeedbackSubmission: createFeedbackSubmissionMock,
}));

import { POST } from "../../../app/api/settings/feedback/route";

describe("POST /api/settings/feedback", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the user is not authenticated", async () => {
    getAuthenticatedUserMock.mockRejectedValueOnce(new AppError("UNAUTHORIZED", 401));

    const formData = new FormData();
    formData.set("category", "bug");
    formData.set("message", "Something broke");

    const response = await POST(
      new Request("http://localhost/api/settings/feedback", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "再ログインしてください",
      },
    });
  });

  it("returns 400 for invalid screenshot type", async () => {
    getAuthenticatedUserMock.mockResolvedValueOnce({
      userId: "user_123",
      canonicalEmail: "test@example.com",
      displayName: "Yudai",
    });

    const formData = new FormData();
    formData.set("category", "bug");
    formData.set("message", "Something broke");
    formData.set("screenshot", new File(["gif"], "capture.gif", { type: "image/gif" }));

    const response = await POST(
      new Request("http://localhost/api/settings/feedback", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_FEEDBACK",
        message: "スクリーンショットは PNG / JPEG / WebP のいずれかを選択してください",
      },
    });
    expect(createFeedbackSubmissionMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the category is missing", async () => {
    getAuthenticatedUserMock.mockResolvedValueOnce({
      userId: "user_123",
      canonicalEmail: "test@example.com",
      displayName: "Yudai",
    });

    const formData = new FormData();
    formData.set("message", "Something broke");

    const response = await POST(
      new Request("http://localhost/api/settings/feedback", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_FEEDBACK",
        message: "カテゴリを選択してください",
      },
    });
    expect(createFeedbackSubmissionMock).not.toHaveBeenCalled();
  });

  it("stores a feedback submission with base64 screenshot payload", async () => {
    getAuthenticatedUserMock.mockResolvedValueOnce({
      userId: "user_123",
      canonicalEmail: "test@example.com",
      displayName: "Yudai",
    });
    createFeedbackSubmissionMock.mockResolvedValueOnce({
      id: "feedback_123",
      createdAt: "2026-05-09T10:00:00.000Z",
    });

    const formData = new FormData();
    formData.set("category", "feature_request");
    formData.set("message", "  Please add a copy button.  ");
    formData.set("screenshot", new File(["hello"], "capture.png", { type: "image/png" }));

    const response = await POST(
      new Request("http://localhost/api/settings/feedback", {
        method: "POST",
        body: formData,
      }),
    );

    expect(createFeedbackSubmissionMock).toHaveBeenCalledWith({
      userId: "user_123",
      userEmail: "test@example.com",
      userDisplayName: "Yudai",
      category: "feature_request",
      message: "Please add a copy button.",
      screenshot: {
        filename: "capture.png",
        contentType: "image/png",
        sizeBytes: 5,
        base64: "aGVsbG8=",
      },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: "feedback_123",
        createdAt: "2026-05-09T10:00:00.000Z",
      },
    });
  });

  it("stores feedback without screenshot when an empty file input is submitted", async () => {
    getAuthenticatedUserMock.mockResolvedValueOnce({
      userId: "user_123",
      canonicalEmail: "test@example.com",
      displayName: "Yudai",
    });
    createFeedbackSubmissionMock.mockResolvedValueOnce({
      id: "feedback_456",
      createdAt: "2026-05-09T11:00:00.000Z",
    });

    const formData = new FormData();
    formData.set("category", "other");
    formData.set("message", "No screenshot attached");
    formData.set("screenshot", new File([], "", { type: "image/png" }));

    const response = await POST(
      new Request("http://localhost/api/settings/feedback", {
        method: "POST",
        body: formData,
      }),
    );

    expect(createFeedbackSubmissionMock).toHaveBeenCalledWith({
      userId: "user_123",
      userEmail: "test@example.com",
      userDisplayName: "Yudai",
      category: "other",
      message: "No screenshot attached",
      screenshot: null,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: "feedback_456",
        createdAt: "2026-05-09T11:00:00.000Z",
      },
    });
  });
});
