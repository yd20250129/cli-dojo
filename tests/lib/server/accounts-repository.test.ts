import { describe, expect, it } from "vitest";

import { resolveVerifiedEmailLinkCandidate } from "@/lib/server/accounts-repository";

describe("resolveVerifiedEmailLinkCandidate", () => {
  it("returns the user id when exactly one verified email match exists", () => {
    expect(resolveVerifiedEmailLinkCandidate([{ user_id: "user-1" }])).toBe("user-1");
  });

  it("returns null when no verified email match exists", () => {
    expect(resolveVerifiedEmailLinkCandidate([])).toBeNull();
  });

  it("returns null when multiple verified email matches exist", () => {
    expect(
      resolveVerifiedEmailLinkCandidate([{ user_id: "user-1" }, { user_id: "user-2" }]),
    ).toBeNull();
  });
});
