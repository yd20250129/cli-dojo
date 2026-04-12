import { sections } from "@/data/sections";
import { sec01Questions } from "@/data/questions/sec01";
import { sec02Questions } from "@/data/questions/sec02";
import { sec03Questions } from "@/data/questions/sec03";
import { sec04Questions } from "@/data/questions/sec04";
import { sec05Questions } from "@/data/questions/sec05";
import { sec06Questions } from "@/data/questions/sec06";
import type { Question, SectionId } from "@/types";

export const questions = [
  ...sec01Questions,
  ...sec02Questions,
  ...sec03Questions,
  ...sec04Questions,
  ...sec05Questions,
  ...sec06Questions,
] satisfies Question[];

export function getSections() {
  return [...sections].sort((a, b) => a.order - b.order);
}

export function getSectionById(sectionId: string) {
  return sections.find((section) => section.id === sectionId) ?? null;
}

export function getQuestionsBySectionId(sectionId: SectionId) {
  return questions.filter((question) => question.sectionId === sectionId);
}

export function getQuestionById(questionId: string) {
  return questions.find((question) => question.id === questionId) ?? null;
}
