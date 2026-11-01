// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CalendarEntry } from "@/lib/content/cultural-calendar";
import {
  addMonths, addYears, boundsNote, calendarDayHref, calendarEntryHref, capDay, chicagoToday, clampMonth, compactCalendar, dayEntries, entryAnchor, monthWeeks, navControls, validDay,
  type CompactEntry,
} from "@/lib/content/culture-calendar-grid";
import { CultureCalendar } from "./culture-calendar";

vi.mock("@/lib/content/cultural-intelligence-publication", () => ({ communityPagePublished: async (id: string) => id !== "gated-off" }));

const entry = (overrides: Partial<CalendarEntry> & { id: string }): CalendarEntry => ({
  name: overrides.id, alsoKnownAs: [], communities: ["somali"], kind: "cultural", capsule: "", dateRule: "", dateCertainty: "fixed", dates: [],
  whatItMarks: "", howCelebrated: "", events: [], workplaceNote: null, sources: [], ...overrides,
});

afterEach(cleanup);

describe("month and year movement", () => {
  it("rolls months over at the year boundary in both directions", () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2027, month: 1 }, -1)).toEqual({ year: 2026, month: 12 });
    expect(addYears({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 12 });
  });
  it("stops at January 2026 and December 2028 and says why", () => {
    const start = navControls({ year: 2026, month: 1 });
    expect(start.previousMonth.target).toBeNull();
    expect(start.previousYear.target).toBeNull();
    expect(start.nextMonth).toEqual({ target: { year: 2026, month: 2 }, label: "Next month, February 2026" });
    const end = navControls({ year: 2028, month: 12 });
    expect(end.nextMonth.target).toBeNull();
    expect(end.nextYear.target).toBeNull();
    expect(end.nextMonth.label).toContain("Dates are loaded through 2028");
    expect(end.previousMonth.label).toBe("Previous month, November 2028");
    expect(boundsNote({ year: 2028, month: 12 })).toContain("Dates are loaded through 2028");
    expect(boundsNote({ year: 2026, month: 1 })).toContain("through 2028");
    expect(boundsNote({ year: 2027, month: 6 })).toBeNull();
    expect(navControls({ year: 2028, month: 6 }).nextYear.target).toBeNull();
    expect(navControls({ year: 2027, month: 6 }).nextYear.target).toEqual({ year: 2028, month: 6 });
  });
  it("clamps a clock outside the loaded dates", () => {
    expect(clampMonth({ year: 2030, month: 4 })).toEqual({ year: 2028, month: 12 });
    expect(clampMonth({ year: 2025, month: 4 })).toEqual({ year: 2026, month: 1 });
  });
  it("uses America/Chicago for today", () => {
    expect(chicagoToday(new Date("2026-11-01T03:00:00Z"))).toBe("2026-10-31");
    expect(chicagoToday(new Date("2026-11-01T06:00:00Z"))).toBe("2026-11-01");
  });
  it("lays out Sunday-first weeks", () => {
    const november = monthWeeks({ year: 2026, month: 11 }); // Starts on a Sunday.
    expect(november[0][0]).toBe(1);
    const october = monthWeeks({ year: 2026, month: 10 }); // Starts on a Thursday.
    expect(october[0]).toEqual([null, null, null, null, 1, 2, 3]);
    expect(october.every(week => week.length === 7)).toBe(true);
    expect(monthWeeks({ year: 2028, month: 2 }).flat().filter(Boolean)).toHaveLength(29);
  });
});

describe("day expansion", () => {
  const items: CompactEntry[] = [
    ["single", "Single", [["2026-06-19", "c"]]],
    ["span", "Span", [["2026-06-29", "2026-07-02", "e"]]],
    ["season", "Year-crossing season", [["2026-10-10", "2027-01-03", "c"]]],
  ];
  it("puts a multi-day observance on each day it covers, across month and year ends", () => {
    expect([...dayEntries(items, { year: 2026, month: 6 }).keys()].sort((a, b) => a - b)).toEqual([19, 29, 30]);
    expect([...dayEntries(items, { year: 2026, month: 7 }).keys()].sort((a, b) => a - b)).toEqual([1, 2]);
    expect(dayEntries(items, { year: 2026, month: 11 }).size).toBe(30);
    expect([...dayEntries(items, { year: 2027, month: 1 }).keys()].sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(dayEntries(items, { year: 2027, month: 2 }).size).toBe(0);
  });
  it("lists single-day observances ahead of longer ones", () => {
    const days = dayEntries([["a", "A long one", [["2026-06-01", "2026-06-30", "c"]]], ["z", "Z single", [["2026-06-15", "c"]]]], { year: 2026, month: 6 });
    expect(days.get(15)!.map(item => item.id)).toEqual(["z", "a"]);
  });
  it("shows three and counts the rest", () => {
    expect(capDay([1, 2, 3])).toEqual({ shown: [1, 2, 3], more: 0 });
    expect(capDay([1, 2, 3, 4, 5])).toEqual({ shown: [1, 2, 3], more: 2 });
  });
});

describe("links", () => {
  it("builds the entry link the full calendar reads, from the month the date starts in", () => {
    expect(calendarEntryHref("african-american--juneteenth", "2026-06-19")).toBe("/minnesota-communities/calendar?year=2026&month=6&entry=african-american--juneteenth#entry-african-american-juneteenth");
    expect(calendarEntryHref("season", "2026-10-10")).toBe("/minnesota-communities/calendar?year=2026&month=10&entry=season#entry-season");
    expect(calendarDayHref(2026, 6, 19)).toBe("/minnesota-communities/calendar?year=2026&month=6&day=19");
  });
  it("encodes ids with accents and keeps anchors ASCII and unique across the real data", () => {
    expect(calendarEntryHref("cuban--día-de-los-reyes", "2027-01-06")).toBe("/minnesota-communities/calendar?year=2027&month=1&entry=cuban--d%C3%ADa-de-los-reyes#entry-cuban-dia-de-los-reyes");
    const { entries } = JSON.parse(readFileSync(path.join(process.cwd(), "lib", "content", "cultural-calendar.json"), "utf8")) as { entries: CalendarEntry[] };
    const anchors = entries.map(item => entryAnchor(item.id));
    expect(new Set(anchors).size).toBe(entries.length);
    expect(anchors.every(anchor => /^entry-[a-z0-9-]+$/.test(anchor))).toBe(true);
  });
  it("accepts only real days in a specific month", () => {
    expect(validDay(2026, 6, "19")).toBe("2026-06-19");
    expect(validDay(2026, 2, "30")).toBeNull();
    expect(validDay(2028, 2, "29")).toBe("2028-02-29");
    expect(validDay(2026, "all", "5")).toBeNull();
    for (const bad of ["0", "32", "05", "x", "", undefined, ["5"]]) expect(validDay(2026, 6, bad)).toBeNull();
  });
});

describe("the data reaching the browser", () => {
  it("drops details, unset dates and dates the grid cannot show", () => {
    const list = compactCalendar([
      entry({ id: "one", dates: [{ year: 2025, date: "2025-06-01", endDate: null, confirmed: true }, { year: 2026, date: "2026-06-01", endDate: "2026-06-01", confirmed: true }, { year: 2027, date: null, endDate: null, confirmed: false }, { year: 2028, date: "2028-06-01", endDate: "2028-06-03", confirmed: false }], capsule: "Long text" }),
      entry({ id: "moon", dateCertainty: "moon-sighted or announced", dates: [{ year: 2027, date: "2027-03-01", endDate: null, confirmed: true }] }),
      entry({ id: "none", dates: [{ year: 2019, date: "2019-04-27", endDate: null, confirmed: true }] }),
    ]);
    expect(list).toEqual([["one", "one", [["2026-06-01", "c"], ["2028-06-01", "2028-06-03", "e"]]], ["moon", "moon", [["2027-03-01", "m"]]]]);
  });

  describe("publication rules", () => {
    beforeEach(() => vi.resetModules());
    afterEach(() => vi.doUnmock("@/lib/content/cultural-calendar.json"));

    it("keeps excluded communities out, whatever the data file holds", async () => {
      vi.doMock("@/lib/content/cultural-calendar.json", () => ({ default: { titles: {}, entries: [
        entry({ id: "native-american--only", name: "Excluded observance", communities: ["native-american"], dates: [{ year: 2026, date: "2026-06-01", endDate: null, confirmed: true }] }),
        entry({ id: "tribal-and-alaska", name: "Also excluded", communities: ["tribal-nations", "alaska-native"], dates: [{ year: 2026, date: "2026-06-02", endDate: null, confirmed: true }] }),
        entry({ id: "gated", name: "Unpublished community", communities: ["gated-off"], dates: [{ year: 2026, date: "2026-06-03", endDate: null, confirmed: true }] }),
        entry({ id: "somali--kept", name: "Kept", communities: ["somali"], dates: [{ year: 2026, date: "2026-06-04", endDate: null, confirmed: true }] }),
      ] } }));
      const { publishedCalendar } = await import("@/lib/content/cultural-calendar");
      expect(compactCalendar(await publishedCalendar()).map(item => item[0])).toEqual(["somali--kept"]);
    });

    it("has no excluded community in the real data the grid receives", async () => {
      const { publishedCalendar } = await import("@/lib/content/cultural-calendar");
      const published = await publishedCalendar();
      expect(published.length).toBeGreaterThan(500);
      expect(published.flatMap(item => item.communities).filter(id => ["native-american", "tribal-nations", "alaska-native"].includes(id))).toEqual([]);
      const list = compactCalendar(published);
      const allowed = new Set(published.map(item => item.id));
      expect(list.every(item => allowed.has(item[0]))).toBe(true);
      expect(JSON.stringify(list)).not.toMatch(/native-american|tribal-nations|alaska-native/);
    });

    it("reads the calendar through publishedCalendar only", () => {
      for (const file of ["culture-calendar.tsx", "culture-calendar-section.tsx"]) {
        expect(readFileSync(path.join(process.cwd(), "components", file), "utf8")).not.toContain("cultural-calendar.json");
      }
      expect(readFileSync(path.join(process.cwd(), "components", "culture-calendar-section.tsx"), "utf8")).toContain("publishedCalendar()");
    });

    it("stays within a small size in the real data", async () => {
      const { publishedCalendar } = await import("@/lib/content/cultural-calendar");
      expect(JSON.stringify(compactCalendar(await publishedCalendar())).length).toBeLessThan(70_000);
    });
  });
});

describe("<CultureCalendar>", () => {
  const items: CompactEntry[] = [
    ["a", "Alpha", [["2026-10-05", "c"]]],
    ["b", "Beta", [["2026-10-05", "e"]]],
    ["c", "Charlie", [["2026-10-05", "m"]]],
    ["d", "Delta day", [["2026-10-05", "c"]]],
    ["e", "Epsilon festival with a very long name that goes on and on and on without stopping at all", [["2026-10-05", "c"]]],
    ["f", "Span", [["2026-12-30", "2027-01-02", "c"]]],
    ["last", "Last", [["2028-12-31", "c"]]],
  ];
  const grid = () => screen.getByRole("table", { hidden: true });

  it("server-renders the current month, marks today and offers the fallback links", () => {
    const html = renderToString(<CultureCalendar entries={items} initialToday="2026-10-31" />);
    expect(html).toContain("One DSD Culture Calendar");
    expect(html).toContain("October 2026");
    expect(html).toContain('aria-current="date"');
    expect(html).toContain("Alpha");
    expect(html).toContain('href="/minnesota-communities/calendar?year=2026&amp;month=10&amp;entry=a#entry-a"');
    expect(html).toContain(">View the full calendar<");
    expect(html).toContain('href="/minnesota-communities/calendar/cultural-calendar.ics"');
    expect(html).toContain("<noscript>");
    expect(html).toContain("A date does not tell you whether a particular person observes it.");
    // Until the page is interactive the controls cannot pretend to work.
    expect(html.match(/<button[^>]*>/g)!.every(button => button.includes('aria-disabled="true"'))).toBe(true);
  });

  it("caps a day at three links with a labelled link to the rest, and marks unconfirmed dates in text", () => {
    vi.useFakeTimers({ now: new Date("2026-10-31T17:00:00Z"), toFake: ["Date"] });
    render(<CultureCalendar entries={items} initialToday="2026-10-31" />);
    vi.useRealTimers();
    const table = within(grid());
    const more = table.getByRole("link", { name: "2 more on October 5, 2026", hidden: true });
    expect(more).toHaveProperty("textContent", "2 more");
    expect(more.getAttribute("href")).toBe("/minnesota-communities/calendar?year=2026&month=10&day=5");
    const cell = more.closest("td")!;
    expect(within(cell).getAllByRole("listitem", { hidden: true })).toHaveLength(3);
    expect(within(cell).getByRole("link", { name: /Beta.*expected date, not yet confirmed/, hidden: true })).toBeTruthy();
    expect(within(cell).getByRole("link", { name: /Charlie.*depends on the moon/, hidden: true })).toBeTruthy();
    expect(table.getAllByRole("columnheader", { hidden: true }).map(header => header.textContent!.slice(0, 3))).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  });

  it("moves without a reload, rolls over, announces, and returns to today", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-31T17:00:00Z"), toFake: ["Date"] });
    const user = userEvent.setup();
    render(<CultureCalendar entries={items} initialToday="2026-10-31" />);
    expect(screen.getByRole("heading", { level: 3, hidden: true }).textContent).toBe("October 2026");
    await user.click(screen.getByRole("button", { name: "Next month, November 2026", hidden: true }));
    await user.click(screen.getByRole("button", { name: "Next month, December 2026", hidden: true }));
    await user.click(screen.getByRole("button", { name: "Next month, January 2027", hidden: true }));
    expect(screen.getByRole("heading", { level: 3, hidden: true }).textContent).toBe("January 2027");
    expect(screen.getByRole("status", { hidden: true }).textContent).toContain("January 2027");
    expect(within(grid()).getAllByRole("link", { name: /^Span/, hidden: true })).toHaveLength(2);
    expect(within(grid()).getAllByRole("link", { name: /^Span/, hidden: true })[0].getAttribute("href")).toBe("/minnesota-communities/calendar?year=2026&month=12&entry=f#entry-f");
    await user.click(screen.getByRole("button", { name: "Previous month, December 2026", hidden: true }));
    expect(screen.getByRole("heading", { level: 3, hidden: true }).textContent).toBe("December 2026");
    await user.click(screen.getByRole("button", { name: "Today, October 2026", hidden: true }));
    expect(screen.getByRole("heading", { level: 3, hidden: true }).textContent).toBe("October 2026");
    vi.useRealTimers();
  });

  it("turns off controls at the ends, keeps focus on them, and says dates are loaded through 2028", async () => {
    vi.useFakeTimers({ now: new Date("2028-11-15T17:00:00Z"), toFake: ["Date"] });
    const user = userEvent.setup();
    render(<CultureCalendar entries={items} initialToday="2028-11-15" />);
    const next = screen.getByRole("button", { name: "Next month, December 2028", hidden: true });
    await user.click(next);
    const atEnd = screen.getByRole("button", { name: /^Next month, not available/, hidden: true });
    expect(atEnd.getAttribute("aria-disabled")).toBe("true");
    expect(document.activeElement).toBe(atEnd);
    expect(screen.getAllByText(/Dates are loaded through 2028\. There are no later months/)).toHaveLength(2); // Visible note and live region.
    await user.click(atEnd);
    expect(screen.getByRole("heading", { level: 3, hidden: true }).textContent).toBe("December 2028");
    expect(screen.getByRole("button", { name: /^Next year, not available/, hidden: true }).getAttribute("aria-disabled")).toBe("true");
    vi.useRealTimers();
  });

  it("gives phones a list of only the days that have observances", () => {
    vi.useFakeTimers({ now: new Date("2026-10-31T17:00:00Z"), toFake: ["Date"] });
    const { container } = render(<CultureCalendar entries={items} initialToday="2026-10-31" />);
    vi.useRealTimers();
    expect(container.querySelector("ol")!.children).toHaveLength(1);
    expect(within(container.querySelector("ol")!).getByRole("heading", { level: 4, hidden: true }).textContent).toBe("Monday, October 5");
  });

  it("says so when no dates are available", () => {
    render(<CultureCalendar entries={[]} initialToday="2026-10-31" />);
    expect(screen.getByText(/Dates are not available here right now/)).toBeTruthy();
  });
});
