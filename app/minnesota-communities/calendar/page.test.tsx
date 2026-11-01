import React from "react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { calendarDayHref, calendarEntryHref, entryAnchor } from "@/lib/content/culture-calendar-grid";
import CulturalCalendarPage from "./page";

vi.mock("@/lib/content/cultural-intelligence-publication", () => ({ communityPagePublished: async () => true }));

const page = async (params: Record<string, string>) => renderToStaticMarkup(await CulturalCalendarPage({ searchParams: Promise.resolve(params) }));
const openDetails = (html: string) => [...html.matchAll(/<details id="([^"]+)"[^>]*\sopen=""/g)].map(match => match[1]);
const anchors = (html: string) => [...html.matchAll(/<details id="([^"]+)"/g)].map(match => match[1]);
const juneteenth = "african-american--juneteenth";

describe("full calendar page", () => {
  it("carries the new heading", async () => {
    expect(await page({ year: "2026", month: "6" })).toContain("<h1>One DSD Culture Calendar</h1>");
  });

  it("opens the linked entry, on its month, with its anchor", async () => {
    const href = new URL(calendarEntryHref(juneteenth, "2026-06-19"), "https://example.org");
    const params = Object.fromEntries(href.searchParams);
    expect(params).toEqual({ year: "2026", month: "6", entry: juneteenth });
    const html = await page(params);
    expect(html).toContain("<h2>June 2026</h2>");
    expect(openDetails(html)).toEqual([entryAnchor(juneteenth)]);
    expect(href.hash).toBe(`#${entryAnchor(juneteenth)}`);
    expect(anchors(html).length).toBeGreaterThan(1);
  });

  it("opens an entry whose id has accents and links for a date running into the next year", async () => {
    const { entries } = JSON.parse(readFileSync(path.join(process.cwd(), "lib", "content", "cultural-calendar.json"), "utf8")) as { entries: Array<{ id: string; dates: Array<{ year: number; date: string | null; endDate: string | null }> }> };
    const accented = entries.find(entry => /[^\x00-\x7f]/.test(entry.id) && entry.dates.some(date => date.year === 2027 && date.date))!;
    const start = accented.dates.find(date => date.year === 2027)!.date!;
    const params = Object.fromEntries(new URL(calendarEntryHref(accented.id, start), "https://example.org").searchParams);
    expect(openDetails(await page(params))).toEqual([entryAnchor(accented.id)]);
    const crossing = entries.flatMap(entry => entry.dates.filter(date => date.endDate && date.date && date.endDate.slice(0, 4) !== date.date.slice(0, 4)).map(date => ({ id: entry.id, start: date.date! })))[0];
    const crossingParams = Object.fromEntries(new URL(calendarEntryHref(crossing.id, crossing.start), "https://example.org").searchParams);
    expect(openDetails(await page(crossingParams))).toEqual([entryAnchor(crossing.id)]);
  });

  it("ignores an unknown entry and an excluded or invalid day without losing the month", async () => {
    const plain = await page({ year: "2026", month: "6" });
    expect(openDetails(await page({ year: "2026", month: "6", entry: "not-a-real-id" }))).toEqual([]);
    expect(await page({ year: "2026", month: "2", day: "30" })).toBe(await page({ year: "2026", month: "2" }));
    expect(await page({ year: "2026", month: "6", day: "x" })).toBe(plain);
    expect(await page({ year: "2026", month: "all", day: "5" })).toBe(await page({ year: "2026", month: "all" }));
  });

  it("shows only that day's entries, including ones that began earlier, with a way back", async () => {
    const { entries } = JSON.parse(readFileSync(path.join(process.cwd(), "lib", "content", "cultural-calendar.json"), "utf8")) as { entries: Array<{ id: string; communities: string[]; dates: Array<{ date: string | null; endDate: string | null }> }> };
    const covers = (iso: string) => entries.filter(entry => entry.dates.some(date => date.date && date.date <= iso && (date.endDate ?? date.date) >= iso)).map(entry => entryAnchor(entry.id)).sort();
    const params = Object.fromEntries(new URL(calendarDayHref(2026, 6, 19), "https://example.org").searchParams);
    const html = await page(params);
    expect(anchors(html).sort()).toEqual(covers("2026-06-19"));
    expect(anchors(html)).toContain(entryAnchor(juneteenth));
    expect(html).toContain("Fri, June 19, 2026");
    expect(html).toContain('href="/minnesota-communities/calendar?year=2026&amp;month=6"');
    expect(html).toContain("Back to all of June 2026");
    expect(html).not.toContain("<h2>June 2026</h2>");
    // The crossing observance is listed on a day in the following year too.
    const crossing = entries.flatMap(entry => entry.dates.filter(date => date.endDate && date.date && date.endDate.slice(0, 4) !== date.date.slice(0, 4)).map(() => entry.id))[0];
    expect(anchors(await page({ year: "2027", month: "1", day: "2" }))).toContain(entryAnchor(crossing));
    expect(openDetails(await page({ ...params, entry: juneteenth }))).toEqual([entryAnchor(juneteenth)]);
  });

  it("gives every entry one anchor on any view, and keeps the download link", async () => {
    for (const year of ["2026", "2027", "2028"]) {
      const html = await page({ year, month: "all" });
      const list = anchors(html);
      expect(new Set(list).size).toBe(list.length);
      expect(html).toContain('href="/minnesota-communities/calendar/cultural-calendar.ics"');
    }
  });
});
