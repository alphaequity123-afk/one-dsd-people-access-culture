import { describe, expect, it } from "vitest";
import { agencyForCounty, getCountyAgencies, sharedAgencies } from "./county-agencies";
import { counties as dataCounties } from "./county-data";

const data = getCountyAgencies();
const TRIBAL_NOTE =
  "For Tribal Nations, contact the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations and consultation.";

describe("county agency directory", () => {
  it("has the 87 counties with unique FIPS codes", () => {
    expect(data.counties).toHaveLength(87);
    for (const c of data.counties) expect(c.fips).toMatch(/^27\d{3}$/);
    expect(new Set(data.counties.map(c => c.fips)).size).toBe(87);
    expect(new Set(data.counties.map(c => c.county)).size).toBe(87);
  });

  it("uses the same county names and codes as the county data", () => {
    const expected = dataCounties().map(c => `${c.fips} ${c.name}`).sort();
    expect(data.counties.map(c => `${c.fips} ${c.county}`).sort()).toEqual(expected);
  });

  it("gives every county an agency name, source URL and checked date", () => {
    for (const c of data.counties) {
      expect(c.agencyName.trim(), c.county).not.toBe("");
      expect(c.agencyId, c.county).toMatch(/^[a-z0-9-]+$/);
      expect(c.sourceUrl, c.county).toMatch(/^https:\/\//);
      expect(c.sourceTitle.trim(), c.county).not.toBe("");
      expect(c.checked).toBe("2026-11-05");
      if (c.phone) expect(c.phone, c.county).toMatch(/^\d{3}-\d{3}-\d{4}$/);
      if (c.website) expect(c.website, c.county).toMatch(/^https?:\/\//);
      if (c.status === "partial" || !c.phone) expect(c.notes.trim(), c.county).not.toBe("");
    }
  });

  it("keeps each shared agency's county list consistent across its member counties", () => {
    const byAgency = new Map<string, typeof data.counties>();
    for (const c of data.counties) byAgency.set(c.agencyId, [...(byAgency.get(c.agencyId) ?? []), c]);
    for (const [id, members] of byAgency) {
      const names = members.map(m => m.county).sort();
      if (members.length === 1) {
        expect(members[0].shared, id).toBe(false);
        expect(members[0].sharedCounties, id).toEqual([]);
        continue;
      }
      for (const m of members) {
        expect(m.shared, m.county).toBe(true);
        expect(m.sharedCounties, m.county).toEqual(names);
        expect(m.agencyName, m.county).toBe(members[0].agencyName);
      }
    }
    const shared = sharedAgencies();
    expect(shared.length).toBeGreaterThan(0);
    for (const a of shared) expect(a.counties.length).toBeGreaterThan(1);
  });

  it("has no Tribal Nation entries other than the single directory link", () => {
    expect(data.tribalNations).toHaveLength(1);
    const [link] = data.tribalNations;
    expect(link.kind).toBe("directory-link");
    expect(link.url).toMatch(/^https:\/\/mn\.gov\/dhs\//);
    expect(link.note).toBe(TRIBAL_NOTE);
    for (const c of data.counties) {
      expect(c.agencyName, c.county).not.toMatch(/\b(band|nation|tribe|tribal|reservation|indian community)\b/i);
    }
  });

  it("uses plain wording without banned terms", () => {
    const text = JSON.stringify(data);
    expect(text).not.toMatch(/\bAI\b/);
    expect(text).not.toMatch(/tutor/i);
    expect(text).not.toMatch(/\b(DHS|HCBS|LTSS|PHHS)\b/);
  });

  it("looks up a county by name or FIPS code", () => {
    expect(agencyForCounty("27137")?.county).toBe("St. Louis");
    expect(agencyForCounty("137")?.county).toBe("St. Louis");
    expect(agencyForCounty("Saint Louis County")?.county).toBe("St. Louis");
    expect(agencyForCounty("lac qui parle")?.fips).toBe("27073");
    expect(agencyForCounty("Nowhere")).toBeUndefined();
    const lyon = agencyForCounty("Lyon");
    expect(lyon?.shared).toBe(true);
    expect(lyon?.sharedCounties).toContain("Rock");
  });
});
