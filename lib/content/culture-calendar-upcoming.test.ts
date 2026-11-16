import { describe, expect, it } from "vitest";
import { upcomingObservances, type CompactEntry } from "@/lib/content/culture-calendar-grid";

describe("upcoming observances on the home page", () => {
  it("lists the chosen observances in date order, even when one started before today", () => {
    const entries: CompactEntry[] = [
      ["holiday", "Holiday", [["2026-11-16", "c"]]],
      ["week", "Awareness Week", [["2026-11-15", "2026-11-21", "c"]]],
      ["later", "Later Day", [["2026-11-20", "c"]]],
      ["past", "Past Day", [["2026-11-10", "c"]]],
    ];
    expect(upcomingObservances(entries, "2026-11-16").map(item => item.id)).toEqual(["week", "holiday", "later"]);
  });

  it("still lets today's holiday through when long seasons are running", () => {
    const entries: CompactEntry[] = [
      ["a", "Season A", [["2026-11-01", "2026-11-30", "c"]]],
      ["b", "Season B", [["2026-11-02", "2026-11-30", "c"]]],
      ["c", "Season C", [["2026-11-03", "2026-11-30", "c"]]],
      ["today", "Today", [["2026-11-16", "c"]]],
    ];
    expect(upcomingObservances(entries, "2026-11-16").map(item => item.id)).toContain("today");
  });
});
