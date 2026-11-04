/**
 * The content engine for guided practice: structured practice items from the
 * curriculum content and deterministic scoring. This module is the only source
 * of truth for which option is correct. The generation provider never sees
 * this decision and never makes it; it only scaffolds around the result.
 *
 * Pure and dependency-free, so the server route and the browser panel share it.
 * Each lesson in lib/content/clas-curriculum.json carries one practice question
 * whose correct option is flagged `correct: true` in the content. Item ids are
 * two digits; the lesson's practice question is item "01".
 *
 * The leadership-styles pathway adds lessons "ls01" (capstone) and "ls02" (style
 * scenarios), defined in ./leadership-items.ts and scored the same way.
 */
import curriculum from "@/lib/content/clas-curriculum.json";
import { LEADERSHIP_LESSON_ID, leadershipLessonIds, leadershipLessonTitle, leadershipTutorItems } from "./leadership-items";

export type TutorOption = { text: string; feedback: string };

export type TutorItem = {
  lessonId: string;
  itemId: string;
  lessonTitle: string;
  question: string;
  options: TutorOption[];
  /** Index into `options`; decided by the content, never by a model or the browser. */
  correctIndex: number;
  reflection: string;
};

export type ScoredChoice = { correct: boolean; feedback: string };

export const LESSON_ID = /^(?:0[1-9]|ls0[1-9])$/;
export const ITEM_ID = /^[0-9]{2}$/;

type RawOption = { text?: unknown; feedback?: unknown; correct?: unknown };

function cleanOption(raw: RawOption): TutorOption | null {
  const text = typeof raw.text === "string" ? raw.text.trim() : "";
  const feedback = typeof raw.feedback === "string" ? raw.feedback.trim() : "";
  return text && feedback ? { text, feedback } : null;
}

/** Every guided-practice item of a lesson, in order. Empty when the lesson is unknown or its content is incomplete. */
export function tutorItems(lessonId: string): TutorItem[] {
  if (!LESSON_ID.test(lessonId)) return [];
  if (LEADERSHIP_LESSON_ID.test(lessonId)) return leadershipTutorItems(lessonId);
  const lesson = curriculum.modules.find(m => m.id === lessonId);
  if (!lesson) return [];
  const practice = lesson.practice;
  const rawOptions = (practice.options ?? []) as RawOption[];
  const options = rawOptions.map(cleanOption);
  if (options.some(o => o === null) || options.length < 2) return [];
  const flagged = rawOptions.map((o, n) => (o.correct === true ? n : -1)).filter(n => n >= 0);
  if (flagged.length !== 1) return [];
  return [{
    lessonId,
    itemId: "01",
    lessonTitle: lesson.title,
    question: practice.question.trim(),
    options: options as TutorOption[],
    correctIndex: flagged[0],
    reflection: typeof practice.reflection === "string" ? practice.reflection : "",
  }];
}

/** One item by lesson and item id, or null. */
export function tutorItem(lessonId: string, itemId: string): TutorItem | null {
  if (!ITEM_ID.test(itemId)) return null;
  return tutorItems(lessonId).find(item => item.itemId === itemId) ?? null;
}

/** Deterministic scoring: the chosen option's own feedback, and whether it is the flagged option. */
export function scoreChoice(item: TutorItem, chosenIndex: number): ScoredChoice {
  if (!Number.isInteger(chosenIndex) || chosenIndex < 0 || chosenIndex >= item.options.length) {
    throw new RangeError("The chosen option is not part of this question.");
  }
  return { correct: chosenIndex === item.correctIndex, feedback: item.options[chosenIndex].feedback };
}

/** Lesson ids that have at least one guided-practice item. */
export function tutorLessonIds(): string[] {
  return [...curriculum.modules.map(m => m.id), ...leadershipLessonIds()].filter(id => tutorItems(id).length > 0);
}

export function lessonTitle(lessonId: string): string {
  return curriculum.modules.find(m => m.id === lessonId)?.title ?? leadershipLessonTitle(lessonId) ?? `Part ${Number(lessonId)}`;
}
