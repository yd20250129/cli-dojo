import { beforeEach, describe, expect, it, vi } from "vitest";

const currentUserMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: currentUserMock,
}));

describe("getCurrentUserSafely", () => {
  beforeEach(() => {
    currentUserMock.mockReset();
  });

  it("returns the current user when Clerk resolves successfully", async () => {
    const user = { id: "user_123" };
    currentUserMock.mockResolvedValue(user);

    const { getCurrentUserSafely } = await import(
      "../../../lib/server/clerk"
    );

    await expect(getCurrentUserSafely()).resolves.toBe(user);
  });

  it("returns null when Clerk reports a deleted user session", async () => {
    currentUserMock.mockRejectedValue({
      clerkError: true,
      status: 404,
    });

    const { getCurrentUserSafely } = await import(
      "../../../lib/server/clerk"
    );

    await expect(getCurrentUserSafely()).resolves.toBeNull();
  });

  it("rethrows non-404 Clerk errors", async () => {
    const error = {
      clerkError: true,
      status: 500,
    };
    currentUserMock.mockRejectedValue(error);

    const { getCurrentUserSafely } = await import(
      "../../../lib/server/clerk"
    );

    await expect(getCurrentUserSafely()).rejects.toBe(error);
  });
});
