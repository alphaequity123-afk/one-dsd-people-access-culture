import { describe, expect, it } from "vitest";
import { getCountyAgencies } from "./county-agencies";
import { getOfficialProviders, providersForCounty, STATEWIDE } from "./official-providers";
import organizations from "./organizations.json";

const data = getOfficialProviders();
const countyNames = new Set(getCountyAgencies().counties.map(c => c.county));
const allEntries = data.categories.flatMap(c => c.entries.map(entry => ({ category: c.id, entry })));

// Short forms that should not appear in descriptive text. Program names stay spelled out.
const SHORT_FORMS = /\b(DHS|HCBS|MCO|MCOs|CIL|CILs|AAA|AAAs|SNBC|MSHO|MSC\+?|OIG|DEED|MBA|DLL|SLL|MHCP)\b/;
const BANNED = /\bAI\b|tutor/i;

function visibleText(): string[] {
  const out: string[] = [data.description, data.tribalNote, data.licensedProviderCountsNote ?? ""];
  for (const c of data.categories) {
    out.push(c.title, c.intro, c.designatedBy);
    for (const e of c.entries) out.push(e.name, e.what);
  }
  for (const l of data.lookups) out.push(l.name, l.what);
  return out;
}

describe("official providers", () => {
  it("has a checked date and the expected categories", () => {
    expect(data.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.categories.map(c => c.id)).toEqual([
      "centers-for-independent-living",
      "area-agencies-on-aging",
      "health-plans",
      "disability-hub",
      "licensed-providers",
      "other-designations",
    ]);
    for (const c of data.categories) {
      expect(c.title.trim()).not.toBe("");
      expect(c.intro.trim()).not.toBe("");
      expect(c.designatedBy.trim()).not.toBe("");
      expect(c.entries.length, c.id).toBeGreaterThan(0);
    }
  });

  it("lists the eight Centers for Independent Living and seven area agencies on aging", () => {
    const cils = data.categories.find(c => c.id === "centers-for-independent-living")!;
    expect(cils.entries).toHaveLength(8);
    const aging = data.categories.find(c => c.id === "area-agencies-on-aging")!;
    expect(aging.entries.filter(e => /Area Agency on Aging|Council on Aging/.test(e.name))).toHaveLength(7);
  });

  it("gives every entry a source URL, and an https website when present", () => {
    for (const { category, entry } of allEntries) {
      const label = `${category}: ${entry.name}`;
      expect(entry.name.trim(), label).not.toBe("");
      expect(entry.what.trim(), label).not.toBe("");
      expect(entry.source.title.trim(), label).not.toBe("");
      expect(entry.source.url, label).toMatch(/^https:\/\//);
      expect(entry.source.date, label).toMatch(/^\d{4}-\d{2}(-\d{2})?$/);
      for (const s of entry.additionalSources ?? []) expect(s.url, label).toMatch(/^https:\/\//);
      if (entry.website !== undefined) expect(entry.website, label).toMatch(/^https:\/\//);
      if (entry.phone !== undefined) expect(entry.phone, label).toMatch(/^\d{3}-\d{3}-\d{4}$/);
      expect(Array.isArray(entry.alsoKnownAs), label).toBe(true);
    }
    for (const l of data.lookups) expect(l.url, l.name).toMatch(/^https:\/\//);
  });

  it("spells county names as in the county agencies file", () => {
    for (const { category, entry } of allEntries) {
      for (const county of entry.counties) {
        if (county === STATEWIDE) {
          expect(entry.counties, `${category}: ${entry.name}`).toEqual([STATEWIDE]);
          continue;
        }
        expect(countyNames.has(county), `${entry.name}: ${county}`).toBe(true);
      }
      expect(new Set(entry.counties).size, entry.name).toBe(entry.counties.length);
      for (const list of Object.values(entry.programCounties ?? {})) {
        for (const county of list) expect(countyNames.has(county), `${entry.name}: ${county}`).toBe(true);
      }
    }
    if (data.licensedProviderCounts) {
      for (const county of Object.keys(data.licensedProviderCounts.byCounty)) expect(countyNames.has(county), county).toBe(true);
    }
  });

  it("covers all 87 counties with an area agency on aging", () => {
    const aging = data.categories.find(c => c.id === "area-agencies-on-aging")!;
    const covered = new Set(aging.entries.flatMap(e => e.counties).filter(c => c !== STATEWIDE));
    expect([...covered].sort()).toEqual([...countyNames].sort());
  });

  it("keeps health plan county lists consistent with the per-program lists", () => {
    const plans = data.categories.find(c => c.id === "health-plans")!;
    for (const e of plans.entries) {
      expect(e.programCounties, e.name).toBeDefined();
      const union = new Set([...e.programCounties!.specialNeedsBasicCare, ...e.programCounties!.seniorHealthOptions]);
      expect([...union].sort(), e.name).toEqual([...e.counties].sort());
    }
  });

  it("matches organization names that already appear in organizations.json", () => {
    const names = new Set(organizations.organizations.map(o => o.name));
    for (const { entry } of allEntries) {
      if (entry.organizationsName) expect(names.has(entry.organizationsName), entry.organizationsName).toBe(true);
    }
  });

  it("uses plain wording without banned words or short forms", () => {
    for (const text of visibleText()) {
      expect(text).not.toMatch(BANNED);
      expect(text).not.toMatch(SHORT_FORMS);
    }
    const all = JSON.stringify(data);
    expect(all).not.toMatch(BANNED);
  });

  it("keeps the Tribal note", () => {
    expect(data.tribalNote).toBe(
      "For Tribal Nation programs, contact the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations and consultation.",
    );
  });
});

describe("providersForCounty", () => {
  it("returns entries for Hennepin by name and by FIPS code", () => {
    const byName = providersForCounty("Hennepin");
    expect(byName.length).toBeGreaterThan(0);
    const names = byName.map(m => m.entry.name);
    expect(names).toContain("Metropolitan Center for Independent Living");
    expect(names).toContain("Metropolitan Area Agency on Aging");
    expect(names).toContain("Hennepin Health");
    expect(names).toContain("Disability Hub MN");
    expect(providersForCounty("27053").map(m => m.entry.name)).toEqual(names);
    expect(providersForCounty("Hennepin County").map(m => m.entry.name)).toEqual(names);
  });

  it("can leave out statewide entries", () => {
    const local = providersForCounty("St. Louis", { includeStatewide: false });
    expect(local.length).toBeGreaterThan(0);
    for (const m of local) expect(m.statewide).toBe(false);
    expect(local.map(m => m.entry.name)).toContain("Arrowhead Area Agency on Aging");
  });

  it("returns nothing for an unknown county", () => {
    expect(providersForCounty("Nowhere")).toEqual([]);
  });
});
