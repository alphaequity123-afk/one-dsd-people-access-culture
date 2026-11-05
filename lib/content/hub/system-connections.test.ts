import { describe, expect, it } from "vitest";
import { allSources, getSystemConnections, structureByKind } from "./system-connections";

const data = getSystemConnections();
const TRIBAL_NOTE =
  "For anything concerning Native American individuals, communities or Tribal Nations, contact the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations and consultation.";
const OFFICIAL_HOSTS = [
  "www.revisor.mn.gov",
  "www.lrl.mn.gov",
  "www.dhs.state.mn.us",
  "mn.gov",
  "content.govdelivery.com",
  "www.house.mn.gov",
];

/** All visible text, leaving out URLs. */
function visibleText(): string[] {
  const out: string[] = [];
  const walk = (v: unknown, key = "") => {
    if (typeof v === "string") {
      if (key !== "url") out.push(v);
    } else if (Array.isArray(v)) v.forEach(x => walk(x));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk(data);
  return out;
}

describe("system connections", () => {
  it("has a checked date and items in every section", () => {
    expect(data.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.structure.length).toBeGreaterThan(0);
    expect(data.leadAgencyTypes.length).toBeGreaterThan(0);
    expect(data.divisionRoles.length).toBeGreaterThan(0);
    expect(data.departmentRoles.length).toBeGreaterThan(0);
    expect(data.referralPaths.length).toBeGreaterThan(0);
    expect(data.glossary.length).toBeGreaterThan(0);
    expect(structureByKind("administration").length).toBeGreaterThan(0);
  });

  it("gives every item an official source with a title, https URL and date", () => {
    const sources = allSources();
    expect(sources.length).toBe(
      data.structure.length +
        data.leadAgencyTypes.length +
        data.divisionRoles.reduce((n, r) => n + 1 + (r.alsoSee?.length ?? 0), 0) +
        data.departmentRoles.length +
        data.referralPaths.length +
        2,
    );
    for (const s of sources) {
      expect(s.title.trim(), s.url).not.toBe("");
      expect(s.url).toMatch(/^https:\/\//);
      expect(OFFICIAL_HOSTS, s.url).toContain(new URL(s.url).hostname);
      expect(s.date, s.url).toMatch(/^\d{4}(-\d{2}(-\d{2})?)?$/);
    }
  });

  it("fills in every text field", () => {
    for (const s of data.structure) {
      expect(["administration", "division", "office"]).toContain(s.kind);
      for (const t of [s.name, s.whatItDoesForDisabilityServices, s.connectionToDivision]) expect(t.trim()).not.toBe("");
    }
    for (const l of data.leadAgencyTypes) {
      expect(l.examples.length, l.type).toBeGreaterThan(0);
      expect(l.programs.length, l.type).toBeGreaterThan(0);
    }
    for (const r of data.divisionRoles) expect(r.howLeadAgenciesExperienceIt.trim(), r.role).not.toBe("");
    for (const p of data.referralPaths) for (const t of [p.from, p.to, p.when]) expect(t.trim()).not.toBe("");
  });

  it("uses no banned words or short forms in visible text", () => {
    for (const t of visibleText()) {
      expect(t).not.toMatch(/\bAI\b|tutor/i);
      expect(t).not.toMatch(/\b(DSD|DHS|ADSA|AASD|HCBS|CBSM|MCO|MCOs|CMS|OIG|BHA|LTSS|CADI|CAC|BI|DD|EW|MA|LTCC|MMIS)\b/);
      // Any other run of two or more capitals, except MN in "Disability Hub MN".
      const caps = (t.match(/\b[A-Z]{2,}\b/g) ?? []).filter(w => w !== "MN");
      expect(caps, t).toEqual([]);
    }
  });

  it("names no individual people", () => {
    const text = visibleText().join(" ");
    expect(text).not.toMatch(/\b(Commissioner|Assistant Commissioner|Director) [A-Z][a-z]+ [A-Z][a-z]+/);
  });

  it("keeps the Tribal Nations section factual and includes the required note", () => {
    const t = data.tribalNations;
    expect(t.note).toBe(TRIBAL_NOTE);
    expect(t.lines.join(" ")).toMatch(/government to government/);
    expect(t.lines.join(" ")).toMatch(/Leech Lake Band of Ojibwe.*Red Lake Nation.*White Earth Nation/);
    expect(t.source.url).toMatch(/^https:\/\//);
    expect(t.relationshipSource.url).toBe("https://www.revisor.mn.gov/statutes/cite/10.65");
  });
});
