import type { Currency, Locale, Region, UserPreferences } from "@/types";

export const locales = ["ja", "en"] as const satisfies readonly Locale[];
export const regions = ["JP", "US"] as const satisfies readonly Region[];
export const currencies = ["JPY", "USD"] as const satisfies readonly Currency[];

export const defaultLocale: Locale = "ja";
export const defaultRegion: Region = "JP";
export const defaultCurrency: Currency = "JPY";
export const defaultTimezone = "Asia/Tokyo";

export const defaultUserPreferences: UserPreferences = {
  locale: defaultLocale,
  region: defaultRegion,
  timezone: defaultTimezone,
  currency: defaultCurrency,
};

export const localeCookieName = "cli_dojo_locale";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function isRegion(value: string): value is Region {
  return regions.includes(value as Region);
}

export function isCurrency(value: string): value is Currency {
  return currencies.includes(value as Currency);
}
