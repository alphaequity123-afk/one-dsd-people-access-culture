import { expect, it } from "vitest";
import { weeklyCourseNumber } from "@/components/weekly-course";
import { CORE_FIFTEEN } from "@/components/core-fifteen";

const rotation = CORE_FIFTEEN.flatMap(group => [...group.numbers]);

it("keeps the same course from Monday through Sunday and changes on Monday", () => {
  const monday = weeklyCourseNumber("2026-11-16");
  expect(weeklyCourseNumber("2026-11-22")).toBe(monday);
  expect(weeklyCourseNumber("2026-11-23")).not.toBe(monday);
});

it("visits every Core 15 course once in fifteen weeks", () => {
  const seen = new Set<string>();
  for (let week = 0; week < 15; week++) {
    const date = new Date(Date.UTC(2026, 10, 16 + week * 7)).toISOString().slice(0, 10);
    seen.add(weeklyCourseNumber(date));
  }
  expect([...seen].sort()).toEqual([...rotation].sort());
});
