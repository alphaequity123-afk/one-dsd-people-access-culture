import { describe, expect, it } from "vitest";
import { allNarratives, baseline, GLOSSARY, goalMap, measures, pool, properNouns, RACE_LABELS, riskRatioInterval, UNIT_LABEL, wilsonInterval, askQuestion } from "./equity-baseline";
import { fleschKincaidGrade, splitSentences } from "@/lib/content/readability";

/** Short forms that should never appear outside the glossary page. A short form that is its own full name is not an acronym. */
export const SHORT_FORMS = GLOSSARY.terms.filter(t => t.short !== t.full).map(t => t.short);

/** Finds a glossary short form used as a word, ignoring any that sit inside a glossary full name. */
export function findShortForm(text: string): string | null {
  let cleaned = text;
  for (const full of [...GLOSSARY.terms.map(t => t.full)].sort((a, b) => b.length - a.length)) cleaned = cleaned.split(full).join(" ");
  for (const short of SHORT_FORMS) {
    const escaped = short.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(?<![A-Za-z0-9$])${escaped}(?![A-Za-z0-9])`).test(cleaned)) return short;
  }
  return null;
}

describe("Wilson interval", () => {
  it("brackets the observed share and narrows with more people", () => {
    const [lo, hi] = wilsonInterval(30, 100);
    expect(lo).toBeLessThan(0.3);
    expect(hi).toBeGreaterThan(0.3);
    expect(lo).toBeCloseTo(0.2189, 3);
    expect(hi).toBeCloseTo(0.3958, 3);
    const [lo2, hi2] = wilsonInterval(300, 1000);
    expect(hi2 - lo2).toBeLessThan(hi - lo);
  });
  it("stays inside 0 and 1 at the edges", () => {
    expect(wilsonInterval(0, 50)[0]).toBe(0);
    expect(wilsonInterval(50, 50)[1]).toBeCloseTo(1, 9);
  });
});

describe("risk ratio interval", () => {
  it("uses the log method and returns null when a cell is empty", () => {
    const result = riskRatioInterval({ a: 43, b: 1225, c: 1757, d: 46839 });
    expect(result).not.toBeNull();
    expect(result!.value).toBeCloseTo(0.936, 2);
    expect(result!.interval[0]).toBeLessThan(result!.value);
    expect(result!.interval[1]).toBeGreaterThan(result!.value);
    expect(riskRatioInterval({ a: 0, b: 10, c: 5, d: 100 })).toBeNull();
  });
});

describe("pooling", () => {
  it("weights percents by count, not by year", () => {
    const pooled = pool("percent", [{ year: 2022, value: 10, k: 10, n: 100 }, { year: 2023, value: 50, k: 450, n: 900 }]);
    expect(pooled.value).toBe(46);
    expect(pooled.method).toBe("count-weighted");
    expect(pooled.interval![0]).toBeLessThan(46);
    expect(pooled.interval![1]).toBeGreaterThan(46);
    expect(pooled.years).toEqual([2022, 2023]);
  });
  it("sums two-by-two cells for risk ratios", () => {
    const pooled = pool("riskRatio", [{ year: 2022, value: 2, cells: { a: 20, b: 100, c: 100, d: 1000 } }, { year: 2023, value: 2, cells: { a: 20, b: 100, c: 100, d: 1000 } }]);
    expect(pooled.value).toBe(2);
    expect(pooled.interval).not.toBeNull();
  });
  it("falls back to a mean with no interval when counts are missing", () => {
    const pooled = pool("dollars", [{ year: 2022, value: 100 }, { year: 2023, value: 300 }]);
    expect(pooled.value).toBe(200);
    expect(pooled.interval).toBeNull();
    expect(pooled.method).toBe("mean");
    expect(pool("percent", []).value).toBeNull();
  });
  it("gives every measure a baseline for every race it has, within the baseline years", () => {
    for (const m of measures()) {
      const rows = baseline(m);
      expect(rows.length, m.id).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.years.every(y => y >= 2022 && y <= 2024), `${m.id} ${row.race}`).toBe(true);
        if (row.value != null && m.unit === "percent") expect(row.value, `${m.id} ${row.race}`).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("measures and goals", () => {
  it("covers the division programs for young people and adults separately", () => {
    const ids = measures().map(m => m.id);
    expect(ids).toContain("adults-vocational-rehabilitation");
    expect(ids).toContain("youth-vocational-rehabilitation");
    expect(ids).toContain("adults-employment-support-services-group");
    expect(ids).toContain("adults-prevocational-services");
    expect(ids).toContain("adults-income-600-or-more");
    expect(ids).toContain("youth-no-reported-income");
    expect(ids).toContain("vocational-rehabilitation-exit-earnings-waiver");
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of measures()) expect(m.title, m.id).toMatch(/by race and ethnicity/);
  });
  it("labels the unknown race as Race not recorded", () => {
    expect(RACE_LABELS.unknown).toBe("Race not recorded");
  });
  it("maps every goal and names data gaps for goals without measures", () => {
    const map = goalMap();
    expect(map.map(e => e.goal.number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(map[0].measureIds.length).toBe(measures().length);
    for (const n of [2, 3, 5]) expect(map.find(e => e.goal.number === n)!.dataGaps.length, `goal ${n}`).toBeGreaterThan(0);
  });
});

describe("owner rules", () => {
  const texts = [
    ...allNarratives().map(n => ({ where: `${n.measureId} ${n.race ?? "focus"}`, text: n.text })),
    ...measures().flatMap(m => [{ where: `${m.id} title`, text: m.title }, { where: `${m.id} program`, text: m.program }, { where: `${m.id} ask`, text: askQuestion(m) }]),
    ...measures().flatMap(m => m.series.map(s => ({ where: `${m.id} ${s.race} label`, text: s.label }))),
    ...goalMap().flatMap(e => e.dataGaps.map(text => ({ where: `goal ${e.goal.number} gap`, text }))),
    ...Object.values(UNIT_LABEL).map(text => ({ where: "unit label", text })),
  ];
  it("never uses a glossary short form in any sentence or label", () => {
    for (const { where, text } of texts) expect(findShortForm(text), `${where}: ${text}`).toBeNull();
  });
  it("keeps every narrative sentence at or below a 10th-grade level", () => {
    const nouns = properNouns();
    for (const n of allNarratives()) for (const sentence of splitSentences(n.text)) {
      expect(fleschKincaidGrade(sentence, nouns), `${n.measureId} ${n.race ?? "focus"}: ${sentence}`).toBeLessThanOrEqual(10.5);
    }
  });
  it("scores the readability example as the owner expects", () => {
    expect(fleschKincaidGrade("Out of every 100 Black or African American adults on a waiver, 16 had a paying job in 2022.", properNouns())).toBeLessThanOrEqual(10.5);
    expect(fleschKincaidGrade("The implementation of multidimensional organizational transformation necessitates comprehensive stakeholder engagement.")).toBeGreaterThan(10.5);
    expect(findShortForm("Adults used VRS this year.")).toBe("VRS");
    expect(findShortForm("Adults used Vocational Rehabilitation Services this year.")).toBeNull();
  });
});
