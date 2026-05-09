import { describe, expect, it } from "vitest";

import { resolveLoginMethod } from "../../../lib/shared/auth-methods";

describe("resolveLoginMethod", () => {
  it("returns email when password login is enabled", () => {
    expect(
      resolveLoginMethod({
        passwordEnabled: true,
        externalAccounts: [{ provider: "google" }],
      }),
    ).toBe("email");
  });

  it("returns google or github for oauth-only users", () => {
    expect(
      resolveLoginMethod({
        passwordEnabled: false,
        externalAccounts: [{ provider: "google" }],
      }),
    ).toBe("google");

    expect(
      resolveLoginMethod({
        passwordEnabled: false,
        externalAccounts: [{ provider: "github" }],
      }),
    ).toBe("github");
  });

  it("falls back to unknown when no supported provider is available", () => {
    expect(resolveLoginMethod(null)).toBe("unknown");
    expect(
      resolveLoginMethod({
        passwordEnabled: false,
        externalAccounts: [{ provider: "discord" }],
      }),
    ).toBe("unknown");
  });
});
