import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { withoutResearchNotes } from "./research-notes";

const dir = new URL("./community-360/", import.meta.url);
const profiles = readdirSync(dir).filter(f => f.endsWith(".json")).map(f => ({ id: f, data: JSON.parse(readFileSync(new URL(f, dir), "utf8")) }));
const LEFTOVER = /could not be opened|repeated refusals|unavailable when checked|blocked or unavailable|were unavailable|was unavailable|could not confirm/i;

describe("community profiles show no research notes (owner decision 2026-11-22)", () => {
  it("removes note sentences and keeps the surrounding facts", () => {
    const md = "**Schools.** Noble Academy serves Hmong students (source). Current pages for Noble Academy could not be opened. Higher education programs continue.\n\n**Unavailable sites.** The Commission's pages were unavailable.";
    expect(withoutResearchNotes(md)).toBe("**Schools.** Noble Academy serves Hmong students (source). Higher education programs continue.");
  });
  it("leaves no notes in any profile section and keeps nearly all content", () => {
    let before = 0, after = 0;
    for (const { id, data } of profiles) {
      for (const section of data.sections) {
        const cleaned = withoutResearchNotes(section.body);
        expect(cleaned, `${id} ${section.id}`).not.toMatch(LEFTOVER);
        before += section.body.length; after += cleaned.length;
      }
    }
    expect(after / before).toBeGreaterThan(0.9);
  });
});

describe("sentence edges", () => {
  it("never splits links, web addresses or abbreviations", () => {
    const md = "The center in St. Paul opened Nov. 3, 2025 ([ZeHabesha](https://zehabesha.com/a.b)). Its page could not be opened. See example.org for 2.5 hours of events.";
    expect(withoutResearchNotes(md)).toBe("The center in St. Paul opened Nov. 3, 2025 ([ZeHabesha](https://zehabesha.com/a.b)). See example.org for 2.5 hours of events.");
  });
  it("keeps every link in every profile intact", () => {
    for (const { id, data } of profiles) for (const section of data.sections) {
      const cleaned = withoutResearchNotes(section.body);
      const opens = (cleaned.match(/\]\(/g) ?? []).length, closes = (cleaned.match(/\]\([^)]*\)/g) ?? []).length;
      expect(opens, `${id} ${section.id}`).toBe(closes);
      expect((cleaned.match(/\*\*/g) ?? []).length % 2, `${id} ${section.id} bold markers`).toBe(0);
    }
  });
});
