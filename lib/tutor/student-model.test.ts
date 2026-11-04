import { describe, expect, it } from "vitest";
import { chooseStrategy, EMPTY_RECORD, firstAttemptRate, normalizeRecord, recordAttempt, recordRound, storageKey, type LessonRecord } from "./student-model";

const item = { itemId: "01" };
const now = new Date("2026-11-03T12:00:00Z");

/** A record where `correct` of `total` items were right on the first try, none solved yet. */
function withRate(correct: number, total: number): LessonRecord {
  const firstAttemptCorrect: Record<string, boolean> = {};
  for (let n = 0; n < total; n++) firstAttemptCorrect[String(n + 10)] = n < correct;
  return { ...EMPTY_RECORD, firstAttemptCorrect };
}

describe("strategy table", () => {
  it("first wrong attempt: socratic-hint", () => {
    expect(chooseStrategy(EMPTY_RECORD, item, 1)).toBe("socratic-hint");
  });
  it("second and later wrong attempts: worked-example", () => {
    expect(chooseStrategy(EMPTY_RECORD, item, 2)).toBe("worked-example");
    expect(chooseStrategy(EMPTY_RECORD, item, 5)).toBe("worked-example");
    expect(chooseStrategy(withRate(3, 3), item, 2)).toBe("worked-example");
  });
  it("after a correct answer: stop, whatever the attempt number", () => {
    const solved = { ...EMPTY_RECORD, solved: { "01": true } };
    expect(chooseStrategy(solved, item, 1)).toBe("stop");
    expect(chooseStrategy(solved, item, 3)).toBe("stop");
  });
  it("first wrong attempt with a high first-try rate (at least 0.75 over at least 3 items): nudge", () => {
    expect(chooseStrategy(withRate(3, 3), item, 1)).toBe("nudge");
    expect(chooseStrategy(withRate(3, 4), item, 1)).toBe("nudge");
    expect(chooseStrategy(withRate(2, 3), item, 1)).toBe("socratic-hint");
    expect(chooseStrategy(withRate(2, 2), item, 1)).toBe("socratic-hint");
  });
});

describe("on-device lesson record", () => {
  it("counts attempts, keeps only the first attempt's correctness, marks solved items", () => {
    const first = recordAttempt(EMPTY_RECORD, "01", false, now);
    expect(first.attemptNumber).toBe(1);
    expect(first.record.attempts).toEqual({ "01": 1 });
    expect(first.record.firstAttemptCorrect).toEqual({ "01": false });
    expect(first.record.solved).toEqual({});
    expect(first.record.updatedAt).toBe(now.toISOString());
    const second = recordAttempt(first.record, "01", true, now);
    expect(second.attemptNumber).toBe(2);
    expect(second.record.firstAttemptCorrect).toEqual({ "01": false });
    expect(second.record.solved).toEqual({ "01": true });
    expect(chooseStrategy(second.record, item, second.attemptNumber)).toBe("stop");
  });
  it("counts rounds per item and hints for every strategy except stop", () => {
    let record = recordRound(EMPTY_RECORD, "01", "socratic-hint", now);
    record = recordRound(record, "01", "stop", now);
    record = recordRound(record, "02", "worked-example", now);
    expect(record.roundsPerItem).toEqual({ "01": 2, "02": 1 });
    expect(record.hintsUsed).toBe(2);
  });
  it("computes the first-attempt rate", () => {
    expect(firstAttemptRate(EMPTY_RECORD)).toEqual({ rate: 0, items: 0 });
    expect(firstAttemptRate(withRate(1, 4))).toEqual({ rate: 0.25, items: 4 });
  });
  it("normalizes malformed stored data and never carries anything but counts and flags", () => {
    expect(normalizeRecord(null)).toBe(EMPTY_RECORD);
    expect(normalizeRecord("x")).toBe(EMPTY_RECORD);
    expect(normalizeRecord({ attempts: { "01": 2, "02": -1, "03": "3" }, firstAttemptCorrect: { "01": true, "02": "yes" }, hintsUsed: 1.5, roundsPerItem: null, updatedAt: 5, name: "Pat" }))
      .toEqual({ attempts: { "01": 2 }, firstAttemptCorrect: { "01": true }, solved: {}, hintsUsed: 0, roundsPerItem: {}, updatedAt: "" });
    expect(Object.keys(normalizeRecord({ name: "Pat" }))).not.toContain("name");
    expect(storageKey("03")).toBe("tutor:03");
  });
});
