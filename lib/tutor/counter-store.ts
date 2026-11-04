import "server-only";

/**
 * Anonymous guided-practice totals (owner rule: totals only, no identities).
 *
 * One DSD keeps its own database (pac_dsd). Its runtime_counters table accepts
 * only consultation reference numbers (scope "cr:YYYYMMDD"), so a guided-practice
 * total would be refused there. The owner's rule is to leave counting off rather
 * than change the database, so nothing is written or read. The key vocabulary is
 * kept so counting can be turned on once pac_dsd accepts the One DHS 0070 pattern.
 *
 * Keys: tutor:<YYYY-MM>:<lessonId>:<itemId>:<signal>, where signal is one of
 * first-attempt-correct, first-attempt-total, rounds, hints.
 */
import { practiceMonth, PRACTICE_COUNTERS_ENABLED } from "@/lib/practice/equity-review-count";
import { lessonTitle, tutorLessonIds } from "./items";
import type { Strategy } from "./student-model";

export type TutorRound = { lessonId: string; itemId: string; attemptNumber: number; correct: boolean; strategy: Strategy };

export const TUTOR_COUNTER_PREFIX = "tutor:";
export const TUTOR_SIGNALS = ["first-attempt-correct", "first-attempt-total", "rounds", "hints"] as const;
export type TutorSignal = (typeof TUTOR_SIGNALS)[number];

/** Counter keys one guidance round would add. */
export function tutorScopes(round: TutorRound, now: Date): string[] {
  const base = `${TUTOR_COUNTER_PREFIX}${practiceMonth(now)}:${round.lessonId}:${round.itemId}:`;
  const scopes = [`${base}rounds`];
  if (round.strategy !== "stop") scopes.push(`${base}hints`);
  if (round.attemptNumber === 1) {
    scopes.push(`${base}first-attempt-total`);
    if (round.correct) scopes.push(`${base}first-attempt-correct`);
  }
  return scopes;
}

/** Returns whether anything was counted. While counting is off, nothing is. */
export async function recordTutorRound(_round: TutorRound, _now = new Date()): Promise<boolean> {
  if (!PRACTICE_COUNTERS_ENABLED) return false;
  return false;
}

export type TutorLessonTotals = {
  lessonId: string;
  title: string;
  firstAttemptCorrect: number;
  firstAttemptTotal: number;
  rounds: number;
  hints: number;
  firstAttemptRate: number | null;
  averageRounds: number | null;
};

export type TutorTotals = { total: number; lessons: TutorLessonTotals[] };

/** Totals per lesson, or null while counting is off. */
export async function readTutorTotals(): Promise<TutorTotals | null> {
  if (!PRACTICE_COUNTERS_ENABLED) return null;
  return { total: 0, lessons: tutorLessonIds().map(lessonId => ({ lessonId, title: lessonTitle(lessonId), firstAttemptCorrect: 0, firstAttemptTotal: 0, rounds: 0, hints: 0, firstAttemptRate: null, averageRounds: null })) };
}
