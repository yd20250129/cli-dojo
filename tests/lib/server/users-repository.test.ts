import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSqlMock, sqlMock } = vi.hoisted(() => ({
  getSqlMock: vi.fn(),
  sqlMock: vi.fn(),
}));

vi.mock("@/lib/server/db", () => ({
  getSql: getSqlMock,
}));

import {
  resolveVerifiedEmailLinkCandidate,
  updateUserDisplayName,
} from "../../../lib/server/users-repository";

describe("users repository identity linking", () => {
  beforeEach(() => {
    getSqlMock.mockReset();
    sqlMock.mockReset();
  });

  it("returns a linked user when the verified email candidate is unique", () => {
    expect(
      resolveVerifiedEmailLinkCandidate([
        { user_id: "11111111-1111-1111-1111-111111111111" },
      ]),
    ).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("does not auto-link when multiple verified email candidates exist", () => {
    expect(
      resolveVerifiedEmailLinkCandidate([
        { user_id: "11111111-1111-1111-1111-111111111111" },
        { user_id: "22222222-2222-2222-2222-222222222222" },
      ]),
    ).toBeNull();
  });

  it("does not auto-link when there is no verified email candidate", () => {
    expect(resolveVerifiedEmailLinkCandidate([])).toBeNull();
  });

  it("normalizes the display name before persisting it", async () => {
    getSqlMock.mockReturnValue(sqlMock);
    sqlMock.mockResolvedValueOnce([
      {
        id: "user_123",
        clerk_user_id: "clerk_123",
        display_name: "Yudai Tanaka",
        canonical_email: "test@example.com",
        canonical_email_verified: true,
        locale: "ja",
        region: "JP",
        timezone: "Asia/Tokyo",
        currency: "JPY",
        created_at: "2026-05-09T00:00:00.000Z",
        updated_at: "2026-05-09T00:05:00.000Z",
      },
    ]);

    const result = await updateUserDisplayName({
      userId: "user_123",
      clerkUserId: "clerk_123",
      displayName: "  Yudai   Tanaka  ",
    });

    expect(getSqlMock).toHaveBeenCalledTimes(1);
    expect(sqlMock).toHaveBeenCalledTimes(1);
    const [, ...values] = sqlMock.mock.calls[0] as [TemplateStringsArray, ...unknown[]];
    expect(values).toEqual(
      expect.arrayContaining(["Yudai Tanaka", "user_123", "clerk_123"]),
    );
    expect(result.displayName).toBe("Yudai Tanaka");
  });

  it("rejects an empty display name before querying the database", async () => {
    await expect(
      updateUserDisplayName({
        userId: "user_123",
        clerkUserId: "clerk_123",
        displayName: "   ",
      }),
    ).rejects.toThrow("displayName is required");

    expect(getSqlMock).not.toHaveBeenCalled();
    expect(sqlMock).not.toHaveBeenCalled();
  });
});
