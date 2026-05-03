import { defaultLocale, defaultTimezone } from "@/lib/i18n/config";
import type { Currency, Locale } from "@/types";

export function formatDate(
  value: Date | string | null,
  locale: Locale = defaultLocale,
  timezone = defaultTimezone,
) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-US", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

export function formatPrice(
  amount: number,
  currency: Currency,
  locale: Locale = defaultLocale,
) {
  return new Intl.NumberFormat(locale === "ja" ? "ja-JP" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amount);
}
