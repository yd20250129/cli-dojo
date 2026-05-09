import { afterEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/server/api-errors";

const {
  getAuthenticatedUserMock,
  updateUserDisplayNameMock,
  updateUserMock,
  clerkClientMock,
} = vi.hoisted(() => ({
  getAuthenticatedUserMock: vi.fn(),
  updateUserDisplayNameMock: vi.fn(),
  updateUserMock: vi.fn(),
  clerkClientMock: vi.fn(),
}));

vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}));

vi.mock("@/lib/server/users-repository", () => ({
  updateUserDisplayName: updateUserDisplayNameMock,
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: clerkClientMock,
}));

import { PATCH } from "../../../app/api/settings/profile/route";

describe("PATCH /api/settings/profile", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the user is not authenticated", async () => {
    getAuthenticatedUserMock.mockRejectedValueOnce(new AppError("UNAUTHORIZED", 401));

    const response = await PATCH(
      new Request("http://localhost/api/settings/profile", {
        method: "PATCH",
        body: JSON.stringify({ displayName: "Yudai" }),
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

  it("returns 400 for an empty display name", async () => {
    getAuthenticatedUserMock.mockResolvedValueOnce({
      userId: "user_123",
      clerkUserId: "clerk_123",
    });

    const response = await PATCH(
      new Request("http://localhost/api/settings/profile", {
        method: "PATCH",
        body: JSON.stringify({ displayName: "   " }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "UNKNOWN",
        message: "Display name is required",
      },
    });
    expect(clerkClientMock).not.toHaveBeenCalled();
    expect(updateUserDisplayNameMock).not.toHaveBeenCalled();
  });

  it("updates Clerk and the users repository", async () => {
    getAuthenticatedUserMock.mockResolvedValueOnce({
      userId: "user_123",
      clerkUserId: "clerk_123",
    });
    clerkClientMock.mockResolvedValueOnce({
      users: {
        updateUser: updateUserMock,
      },
    });
    updateUserDisplayNameMock.mockResolvedValueOnce({
      displayName: "Yudai Tanaka",
    });

    const response = await PATCH(
      new Request("http://localhost/api/settings/profile", {
        method: "PATCH",
        body: JSON.stringify({ displayName: "  Yudai   Tanaka " }),
      }),
    );

    expect(updateUserMock).toHaveBeenCalledWith("clerk_123", {
      firstName: "Yudai",
      lastName: "Tanaka",
    });
    expect(updateUserDisplayNameMock).toHaveBeenCalledWith({
      userId: "user_123",
      clerkUserId: "clerk_123",
      displayName: "Yudai Tanaka",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        displayName: "Yudai Tanaka",
      },
    });
  });
});
