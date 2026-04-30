import { describe, expect, it } from "vitest";

import { formatDate, formatPrice } from "../../lib/i18n/format";
import { t } from "../../lib/i18n";
import { getLegalUrl } from "../../lib/i18n/legal";

describe("i18n helpers", () => {
  it("resolves UI messages with interpolation", () => {
    expect(t("ja", "home.summary.answered", { answered: 3, total: 10 })).toBe(
      "3 / 10 問 回答済み",
    );
  });

  it("falls back to ja when the en dictionary is incomplete", () => {
    expect(t("en", "auth.signIn.title")).toBe("アカウントで学習を続ける");
  });

  it("formats dates with locale and timezone", () => {
    expect(formatDate("2026-04-29T00:00:00.000Z", "ja", "Asia/Tokyo")).toMatch(
      /^\d{2}\/\d{2} \d{2}:\d{2}$/,
    );
  });

  it("formats prices with locale and currency", () => {
    expect(formatPrice(1200, "JPY", "ja")).toContain("1,200");
    expect(formatPrice(12.5, "USD", "en")).toContain("$12.50");
  });

  it("returns legal URLs via a resolver", () => {
    expect(getLegalUrl("terms", "ja", "JP")).toBe("/legal/terms");
    expect(getLegalUrl("privacy", "en", "US")).toBe("/legal/privacy?region=US");
  });
});
