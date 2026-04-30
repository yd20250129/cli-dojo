import { defaultLocale } from "@/lib/i18n/config";
import { getDictionaryValue, getUiDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/types";

export type TranslationValues = Record<string, string | number>;

function interpolate(message: string, values?: TranslationValues) {
  if (!values) {
    return message;
  }

  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    message,
  );
}

export function t(locale: Locale, key: string, values?: TranslationValues) {
  const message =
    getDictionaryValue(getUiDictionary(locale), key) ??
    getDictionaryValue(getUiDictionary(defaultLocale), key) ??
    key;

  return interpolate(message, values);
}

export function getTranslator(locale: Locale) {
  return (key: string, values?: TranslationValues) => t(locale, key, values);
}
