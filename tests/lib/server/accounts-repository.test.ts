import { describe, expect, it } from "vitest";

import { resolveVerifiedEmailLinkCandidate } from "../../../lib/server/accounts-repository";

describe("accounts repository identity linking", () => {
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
});
