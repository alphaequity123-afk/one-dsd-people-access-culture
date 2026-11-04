"use client";

/**
 * The learner model for guided practice. It lives only on the learner's device
 * (browser storage under `tutor:<lessonId>`) and never leaves it. Rules, not a
 * model, pick the scaffolding strategy before anything is sent to the server.
 *
 * Strategy table (chooseStrategy):
 *
 *   Situation                                                     | Strategy
 *   --------------------------------------------------------------|----------------
 *   The item has been answered correctly (this attempt or before) | stop
 *   First wrong attempt, learner's first-try rate across the      | nudge
 *     lesson is high (at least 0.75 over at least 3 items)         |
 *   First wrong attempt, otherwise                                | socratic-hint
 *   Second or later wrong attempt                                 | worked-example
 *
 * A worked example is always a parallel example; the item's own answer is
 * never given. "stop" means affirm briefly and connect to one next concept.
 */
import { useCallback } from "react";
import { useStored } from "@/lib/client/storage";

export type Strategy = "worked-example" | "socratic-hint" | "nudge" | "stop";
export const STRATEGIES: readonly Strategy[] = ["worked-example", "socratic-hint", "nudge", "stop"];

export type LessonRecord = {
  /** Attempts made on each item, by item id. */
  attempts: Record<string, number>;
  /** Whether the very first attempt on each item was correct, by item id. */
  firstAttemptCorrect: Record<string, boolean>;
  /** Items answered correctly at least once, by item id. */
  solved: Record<string, boolean>;
  /** Guidance rounds that gave a hint, example or nudge, across the lesson. */
  hintsUsed: number;
  /** Guidance rounds requested on each item, by item id. */
  roundsPerItem: Record<string, number>;
  updatedAt: string;
};

export const EMPTY_RECORD: LessonRecord = { attempts: {}, firstAttemptCorrect: {}, solved: {}, hintsUsed: 0, roundsPerItem: {}, updatedAt: "" };

export const HIGH_RATE_THRESHOLD = 0.75;
export const HIGH_RATE_MIN_ITEMS = 3;

export function storageKey(lessonId: string): string {
  return `tutor:${lessonId}`;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const counts = (v: unknown): Record<string, number> => isRecord(v) ? Object.fromEntries(Object.entries(v).filter(([, n]) => Number.isInteger(n) && (n as number) >= 0) as [string, number][]) : {};
const flags = (v: unknown): Record<string, boolean> => isRecord(v) ? Object.fromEntries(Object.entries(v).filter(([, b]) => typeof b === "boolean") as [string, boolean][]) : {};

/** Accepts whatever is on the device; anything malformed falls back to the empty record. */
export function normalizeRecord(raw: unknown): LessonRecord {
  if (!isRecord(raw)) return EMPTY_RECORD;
  return {
    attempts: counts(raw.attempts),
    firstAttemptCorrect: flags(raw.firstAttemptCorrect),
    solved: flags(raw.solved),
    hintsUsed: Number.isInteger(raw.hintsUsed) && (raw.hintsUsed as number) >= 0 ? (raw.hintsUsed as number) : 0,
    roundsPerItem: counts(raw.roundsPerItem),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
  };
}

/** The record after one more attempt on `itemId`. Returns the new record and the attempt number (1-based). */
export function recordAttempt(record: LessonRecord, itemId: string, correct: boolean, now = new Date()): { record: LessonRecord; attemptNumber: number } {
  const attemptNumber = (record.attempts[itemId] ?? 0) + 1;
  return {
    attemptNumber,
    record: {
      ...record,
      attempts: { ...record.attempts, [itemId]: attemptNumber },
      firstAttemptCorrect: attemptNumber === 1 ? { ...record.firstAttemptCorrect, [itemId]: correct } : record.firstAttemptCorrect,
      solved: correct ? { ...record.solved, [itemId]: true } : record.solved,
      updatedAt: now.toISOString(),
    },
  };
}

/** The record after one guidance round on `itemId`. A round with any strategy other than "stop" counts as a hint. */
export function recordRound(record: LessonRecord, itemId: string, strategy: Strategy, now = new Date()): LessonRecord {
  return {
    ...record,
    hintsUsed: record.hintsUsed + (strategy === "stop" ? 0 : 1),
    roundsPerItem: { ...record.roundsPerItem, [itemId]: (record.roundsPerItem[itemId] ?? 0) + 1 },
    updatedAt: now.toISOString(),
  };
}

/** First-try correctness across the items attempted so far in this lesson. */
export function firstAttemptRate(record: LessonRecord): { rate: number; items: number } {
  const values = Object.values(record.firstAttemptCorrect);
  if (!values.length) return { rate: 0, items: 0 };
  return { rate: values.filter(Boolean).length / values.length, items: values.length };
}

/** Rule-based choice of scaffolding; see the table at the top of this file. */
export function chooseStrategy(record: LessonRecord, item: { itemId: string }, attemptNumber: number): Strategy {
  if (record.solved[item.itemId]) return "stop";
  if (attemptNumber >= 2) return "worked-example";
  const { rate, items } = firstAttemptRate(record);
  if (items >= HIGH_RATE_MIN_ITEMS && rate >= HIGH_RATE_THRESHOLD) return "nudge";
  return "socratic-hint";
}

/** The on-device record for one lesson, with an updater that writes the whole record back. */
export function useStudentModel(lessonId: string): [LessonRecord, (next: LessonRecord) => void] {
  const [raw, set] = useStored<unknown>("local", storageKey(lessonId), EMPTY_RECORD);
  const record = normalizeRecord(raw);
  const update = useCallback((next: LessonRecord) => { set(next); }, [set]);
  return [record, update];
}
