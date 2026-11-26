import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import data from "@/lib/content/cultural-calendar.json";
import { calendarEntryFor, mergeRepeatedObservances, type CalendarEntry } from "@/lib/content/cultural-calendar";

const ENTRIES = data.entries as CalendarEntry[];

describe("repeated observances show once (owner decision 2026-11-26)", () => {
  const merged = mergeRepeatedObservances(ENTRIES);
  it("lists each observance once on its dates", () => {
    const keys = merged.map(entry => `${entry.name}|${entry.kind}|${JSON.stringify(entry.dates.map(date => [date.year, date.date, date.endDate]))}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(merged.filter(entry => entry.name === "Easter")).toHaveLength(1);
  });
  it("keeps every community's own entry and note", () => {
    const kept = merged.flatMap(entry => entry.members ?? [entry]);
    expect(kept).toHaveLength(ENTRIES.length);
    expect(new Set(kept.map(entry => entry.id))).toEqual(new Set(ENTRIES.map(entry => entry.id)));
    const easter = merged.find(entry => entry.name === "Easter")!;
    expect(easter.members!.map(member => member.capsule)).toEqual(ENTRIES.filter(entry => entry.name === "Easter").map(entry => entry.capsule));
    expect(easter.communities).toHaveLength(20);
  });
  it("still opens an observance from any community's old link", () => {
    expect(calendarEntryFor(merged, "karen--easter")?.name).toBe("Easter");
  });
});
