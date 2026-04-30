import { sections } from "@/data/sections";
import { sec01Questions } from "@/data/questions/sec01";
import { sec02Questions } from "@/data/questions/sec02";
import { sec03Questions } from "@/data/questions/sec03";
import { sec04Questions } from "@/data/questions/sec04";
import { sec05Questions } from "@/data/questions/sec05";
import { sec06Questions } from "@/data/questions/sec06";
import { defaultLocale } from "@/lib/i18n/config";
import type { Locale, Question, Section, SectionId } from "@/types";

export const questions = [
  ...sec01Questions,
  ...sec02Questions,
  ...sec03Questions,
  ...sec04Questions,
  ...sec05Questions,
  ...sec06Questions,
] satisfies Question[];

const sectionCatalogs: Record<Locale, Section[]> = {
  ja: sections,
  en: sections,
};

const questionCatalogs: Record<Locale, Question[]> = {
  ja: questions,
  en: questions,
};

export function getSectionsForLocale(locale: Locale): Section[] {
  return [...(sectionCatalogs[locale] ?? sectionCatalogs[defaultLocale])].sort(
    (a, b) => a.order - b.order,
  );
}

export function getQuestionsForLocale(locale: Locale): Question[] {
  return [...(questionCatalogs[locale] ?? questionCatalogs[defaultLocale])];
}

export function getSections(locale: Locale = defaultLocale) {
  return getSectionsForLocale(locale);
}

export function getSectionById(sectionId: string, locale: Locale = defaultLocale) {
  return getSectionsForLocale(locale).find((section) => section.id === sectionId) ?? null;
}

export function getQuestionsBySectionId(sectionId: SectionId, locale: Locale = defaultLocale) {
  return getQuestionsForLocale(locale).filter((question) => question.sectionId === sectionId);
}

export function getQuestionById(questionId: string, locale: Locale = defaultLocale) {
  return getQuestionsForLocale(locale).find((question) => question.id === questionId) ?? null;
}
