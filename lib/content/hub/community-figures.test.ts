import { describe, expect, it } from "vitest";
import { NATIVE_DEFERENCE_COMMUNITY_IDS } from "@/lib/content/community-presentation";
import figures from "./community-figures.json";
import { COMMUNITY_CROSSWALK, NATIVE_FIGURES_NOTE, communityFigureGroups } from "./community-crosswalk";

const COMMUNITY_IDS = [
  "somali", "hmong", "karen", "oromo", "african-american", "latino", "vietnamese", "khmer", "lao", "russian-speaking",
  "arabic-speaking", "deaf-deafblind-hard-of-hearing", "rural", "tribal-nations", "ethiopian", "liberian", "nigerian",
  "kenyan", "mexican", "puerto-rican", "guatemalan", "salvadoran", "ecuadorian", "colombian", "cuban", "korean", "indian",
  "chinese", "filipino", "japanese", "thai", "burmese", "bosnian", "ukrainian", "lebanese", "amharic", "french",
  "european-american", "american", "minnesota", "native-american", "alaska-native",
];
const NOT_REPORTED = ["oromo", "khmer", "arabic-speaking", "nigerian", "ukrainian", "bosnian", "deaf-deafblind-hard-of-hearing", "rural"];

type Figure = {
  status: string;
  estimate?: number;
  table?: string;
  page?: number;
  marginOfError?: number | null;
  marginOfErrorPrinted?: boolean;
  universeCount?: number;
  universeMarginOfError?: number | null;
  universeMarginOfErrorPrinted?: boolean;
};

const groupNames = new Set(figures.groups.map(group => group.name));
const allFigures: { group: string; key: string; figure: Figure }[] = figures.groups.flatMap(group =>
  Object.entries(group.figures).map(([key, figure]) => ({ group: group.name, key, figure: figure as Figure })));

describe("community crosswalk", () => {
  it("has one entry for every community id, and no others", () => {
    const ids = COMMUNITY_CROSSWALK.map(entry => entry.communityId);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...COMMUNITY_IDS].sort());
  });

  it("points every exact or approximate match at groups that exist in the figures file", () => {
    for (const entry of COMMUNITY_CROSSWALK) {
      if (entry.match === "none") {
        expect(entry.demographicCenterGroups, entry.communityId).toEqual([]);
        continue;
      }
      expect(entry.demographicCenterGroups.length, entry.communityId).toBeGreaterThan(0);
      for (const name of entry.demographicCenterGroups) expect(groupNames.has(name), `${entry.communityId} -> ${name}`).toBe(true);
      expect(communityFigureGroups(entry.communityId).map(group => group.name)).toEqual(entry.demographicCenterGroups);
    }
    for (const entry of COMMUNITY_CROSSWALK) {
      for (const name of entry.countedWithin ?? []) expect(groupNames.has(name), `${entry.communityId} within ${name}`).toBe(true);
    }
  });

  it("keeps every Native page at none, with the owner's note and no figures", () => {
    for (const id of ["native-american", "tribal-nations", "alaska-native", ...NATIVE_DEFERENCE_COMMUNITY_IDS]) {
      const entry = COMMUNITY_CROSSWALK.find(item => item.communityId === id);
      expect(entry, id).toBeDefined();
      expect(entry!.match).toBe("none");
      expect(entry!.equityGroup).toBeNull();
      expect(entry!.demographicCenterGroups).toEqual([]);
      expect(entry!.countedWithin).toBeUndefined();
      expect(entry!.note).toBe(NATIVE_FIGURES_NOTE);
      expect(communityFigureGroups(id)).toEqual([]);
    }
    expect(NATIVE_FIGURES_NOTE).toBe("This page defers to the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations; no figures are added here.");
  });

  it("marks the communities the report does not cover as none", () => {
    for (const id of NOT_REPORTED) expect(COMMUNITY_CROSSWALK.find(entry => entry.communityId === id)?.match, id).toBe("none");
  });

  it("encodes the known definition differences", () => {
    const byId = (id: string) => COMMUNITY_CROSSWALK.find(entry => entry.communityId === id)!;
    expect(byId("african-american").match).toBe("approximate");
    expect(byId("african-american").note).toMatch(/born in the United States/);
    expect(byId("russian-speaking").match).toBe("approximate");
    expect(byId("russian-speaking").note).toMatch(/ancestry, not language/);
    expect(byId("latino").demographicCenterGroups).toEqual(["Mexican", "Puerto Rican", "Other Hispanic"]);
    expect(byId("latino").note).toMatch(/no single Latino total/);
    expect(groupNames.has("Hispanic")).toBe(false);
  });

  it("uses plain wording in staff notes", () => {
    for (const entry of COMMUNITY_CROSSWALK) {
      expect(entry.note.trim().length, entry.communityId).toBeGreaterThan(0);
      expect(entry.note, entry.communityId).not.toMatch(/\bACS\b|\bAI\b|tutor/i);
    }
  });
});

describe("community figures", () => {
  it("carries the source details, survey years, suppression rules and the 2023 edition warning", () => {
    expect(figures.sources.chartbook.publisher).toBe("Minnesota State Demographic Center");
    expect(figures.sources.chartbook.date).toBe("January 2026");
    expect(figures.sources.chartbook.url).toMatch(/^https:\/\/mn\.gov\/admin\/assets\//);
    expect(figures.sources.disabilityBrief.date).toBe("February 2026");
    expect(figures.sources.disabilityBrief.url).toMatch(/^https:\/\/mn\.gov\/admin\/assets\//);
    expect(figures.surveyYears).toBe("2019 to 2023");
    expect(figures.suppressionRules.join(" ")).toMatch(/300 or more/);
    expect(figures.suppressionRules.join(" ")).toMatch(/fewer than 150/);
    expect(figures.comparabilityNote).toMatch(/2023 edition/);
  });

  it("has all 24 report groups plus the total", () => {
    expect(figures.groups).toHaveLength(25);
    expect(groupNames.has("Total")).toBe(true);
  });

  it("gives every published figure its estimate, table and page", () => {
    const published = allFigures.filter(item => item.figure.status === "published");
    expect(published.length).toBeGreaterThan(0);
    for (const { group, key, figure } of published) {
      expect(typeof figure.estimate, `${group} ${key}`).toBe("number");
      expect(figure.table, `${group} ${key}`).toMatch(/^Table /);
      expect(typeof figure.page, `${group} ${key}`).toBe("number");
    }
    for (const { group, key, figure } of allFigures) {
      expect(["published", "suppressed", "dash"], `${group} ${key}`).toContain(figure.status);
      expect(figure.table, `${group} ${key}`).toBeTruthy();
      expect(figure.page, `${group} ${key}`).toBeTruthy();
      if (figure.status !== "published") expect(figure.estimate, `${group} ${key}`).toBeUndefined();
    }
    for (const figure of figures.disabilityBrief.groups) {
      expect(typeof figure.estimate).toBe("number");
      expect(figure.table).toBe("Figure 6a");
      expect(figure.page).toBe(6);
    }
  });

  it("includes the margin of error wherever the source prints one", () => {
    for (const { group, key, figure } of allFigures.filter(item => item.figure.status === "published")) {
      expect(typeof figure.marginOfErrorPrinted, `${group} ${key}`).toBe("boolean");
      if (figure.marginOfErrorPrinted) expect(typeof figure.marginOfError, `${group} ${key}`).toBe("number");
      else expect(figure.marginOfError, `${group} ${key}`).toBeNull();
      // Every table used prints a margin of error for each cultural group; only some Total cells are blank.
      if (group !== "Total") expect(figure.marginOfErrorPrinted, `${group} ${key}`).toBe(true);
      if (figure.universeCount !== undefined) {
        if (figure.universeMarginOfErrorPrinted) expect(typeof figure.universeMarginOfError, `${group} ${key}`).toBe("number");
        if (group !== "Total") expect(figure.universeMarginOfErrorPrinted, `${group} ${key}`).toBe(true);
      }
    }
  });

  it("keeps only values that every extraction method agreed on", () => {
    expect(figures.verification.valuesDropped).toBe(figures.verification.disagreements.length);
    expect(figures.verification.valuesVerified).toBeGreaterThan(0);
    expect(JSON.stringify(figures)).not.toContain("DROPPED");
  });

  it("matches the chartbook wherever the disability brief repeats a chartbook value", () => {
    const table17 = new Map(figures.groups.map(group => [group.name, group.figures.disabilityAges18to64 as Figure]));
    for (const figure of figures.disabilityBrief.groups) {
      const chartbook = table17.get(figure.group);
      expect(chartbook, figure.group).toBeDefined();
      if (chartbook!.status === "published") expect(figure.estimate, figure.group).toBe(chartbook!.estimate);
    }
  });

  it("uses plain wording with no acronyms in labels", () => {
    const labels = [
      ...figures.measures.flatMap(measure => [measure.label, measure.universe, "note" in measure ? String(measure.note) : ""]),
      figures.readingNote, figures.comparabilityNote, ...figures.suppressionRules,
      figures.sources.chartbook.dataSource, figures.sources.disabilityBrief.dataSource,
      figures.disabilityBrief.universe, figures.disabilityBrief.definitionNote, figures.disabilityBrief.excluded,
      ...figures.groups.map(group => group.definition),
    ];
    for (const text of labels) expect(text).not.toMatch(/\bACS\b|\bAI\b|\bMOE\b|\bFPL\b|tutor/i);
  });
});
