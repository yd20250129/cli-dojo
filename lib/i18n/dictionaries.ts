import type { CategoryKey, Locale } from "@/types";

import enCategories from "@/locales/en/categories.json";
import enUi from "@/locales/en/ui.json";
import jaCategories from "@/locales/ja/categories.json";
import jaUi from "@/locales/ja/ui.json";

type DictionaryValue = string | number | boolean | null | DictionaryTree | DictionaryValue[];
type DictionaryTree = {
  [key: string]: DictionaryValue;
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends DictionaryTree ? DeepPartial<T[K]> : T[K];
};

export type UiDictionary = typeof jaUi;
type CategoryDictionary = Record<string, string>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T extends DictionaryTree>(base: T, override: DeepPartial<T>): T {
  const merged: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) {
      continue;
    }

    const baseValue = merged[key];

    if (isRecord(baseValue) && isRecord(value)) {
      merged[key] = deepMerge(baseValue as DictionaryTree, value as DeepPartial<DictionaryTree>);
      continue;
    }

    merged[key] = value;
  }

  return merged as T;
}

const mergedUiDictionaries: Record<Locale, UiDictionary> = {
  ja: jaUi,
  en: deepMerge(jaUi, enUi as DeepPartial<UiDictionary>),
};

const mergedCategoryDictionaries: Record<Locale, CategoryDictionary> = {
  ja: jaCategories as CategoryDictionary,
  en: deepMerge(
    jaCategories as CategoryDictionary,
    enCategories as DeepPartial<CategoryDictionary>,
  ),
};

export function getUiDictionary(locale: Locale): UiDictionary {
  return mergedUiDictionaries[locale] ?? mergedUiDictionaries.ja;
}

export function getCategoryDictionary(locale: Locale): CategoryDictionary {
  return mergedCategoryDictionaries[locale] ?? mergedCategoryDictionaries.ja;
}

export function getCategoryLabel(locale: Locale, categoryKey: CategoryKey) {
  return getCategoryDictionary(locale)[categoryKey] ?? getCategoryDictionary("ja")[categoryKey] ?? categoryKey;
}

export function getDictionaryValue(
  dictionary: DictionaryTree,
  key: string,
): string | undefined {
  const value = key.split(".").reduce<DictionaryValue | undefined>((current, part) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[part] as DictionaryValue | undefined;
  }, dictionary);

  return typeof value === "string" ? value : undefined;
}
