import { describe, expect, it } from "vitest";
import {
  counties,
  getCountyData,
  getCountyShapes,
  GROUP_IDS,
  measureFor,
  MIN_COMPARE_COUNT,
  statewide,
  type GroupId,
} from "./county-data";

const data = getCountyData();
const raceGroups = GROUP_IDS.filter(g => g !== "all");

describe("county data", () => {
  it("has the 87 counties plus Statewide, each with a FIPS code", () => {
    expect(data.places).toHaveLength(88);
    expect(counties()).toHaveLength(87);
    const state = data.places.filter(p => p.name === "Statewide");
    expect(state).toHaveLength(1);
    expect(state[0].fips).toBe("27");
    for (const c of counties()) expect(c.fips).toMatch(/^27\d{3}$/);
    expect(new Set(data.places.map(p => p.fips)).size).toBe(88);
  });

  it("uses the same counties as the map shapes", () => {
    const shapes = getCountyShapes();
    expect(shapes.counties).toHaveLength(87);
    expect(shapes.counties.map(c => c.fips).sort()).toEqual(counties().map(c => c.fips).sort());
  });

  it("has exactly the seven group ids and labels", () => {
    expect(data.groups).toEqual([
      { id: "american-indian", label: "American Indian or Alaska Native" },
      { id: "asian-pacific-islander", label: "Asian or Pacific Islander" },
      { id: "black", label: "Black or African American" },
      { id: "hispanic", label: "Hispanic or Latino" },
      { id: "multiracial", label: "Multiracial" },
      { id: "white", label: "White" },
      { id: "all", label: "All people" },
    ]);
    for (const p of data.places) expect(Object.keys(p.groups).sort()).toEqual([...GROUP_IDS].sort());
  });

  it("has statewide population shares that add to about 1, for 2022 and 2018", () => {
    const sum22 = raceGroups.reduce((s, g) => s + (statewide(g, "population").value ?? 0), 0);
    expect(sum22).toBeGreaterThan(0.995);
    expect(sum22).toBeLessThan(1.005);
    const state = data.places[0];
    const sum18 = raceGroups.reduce((s, g) => s + (state.groups[g].population.share2018 ?? 0), 0);
    expect(Math.abs(sum18 - 1)).toBeLessThan(0.005);
  });

  it("never compares when the group count is below 11", () => {
    let checked = 0;
    for (const p of data.places) {
      for (const g of raceGroups) {
        const c = p.groups[g].comparison;
        if (c.groupCount == null || c.groupCount < MIN_COMPARE_COUNT) {
          expect(c.ratio).toBeNull();
          checked++;
        } else {
          expect(c.ratio).not.toBeNull();
        }
        const v = measureFor(p, g, "comparison");
        if (v.count != null && v.count < MIN_COMPARE_COUNT) expect(v.status).toBe("too-few");
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("leaves suppressed values null", () => {
    let suppressed = 0;
    for (const p of data.places) {
      for (const g of GROUP_IDS) {
        const s = p.groups[g].services;
        if (s.suppressed) {
          suppressed++;
          expect(s.share).toBeNull();
          expect(s.count).toBeNull();
          expect(p.groups[g].comparison.ratio).toBeNull();
          expect(measureFor(p, g, "services").status).toBe(g === "all" ? "not-applicable" : "suppressed");
        }
        const e = p.groups[g].earnedIncome;
        if (e.suppressed) {
          suppressed++;
          expect(e.percent).toBeNull();
          expect(e.recipients).toBeNull();
        }
      }
    }
    expect(suppressed).toBeGreaterThan(0);
  });

  it("computes service share as group count divided by the county count", () => {
    const h = measureFor("Hennepin", "black", "services");
    expect(h.status).toBe("ok");
    expect(h.value).toBeCloseTo((h.count as number) / (h.countyCount as number), 5);
    const pop = measureFor("Hennepin", "black", "population").value as number;
    expect(measureFor("Hennepin", "black", "comparison").value).toBeCloseTo((h.value as number) / pop, 4);
  });

  it("has total population and language share for every place", () => {
    for (const p of data.places) {
      expect(p.totalPopulation2025).toBeGreaterThan(0);
      expect(p.nonEnglishShare).toBeGreaterThan(0);
      expect(p.nonEnglishShare).toBeLessThan(0.5);
    }
  });

  it("states sources, dates, the county definition and suppression rules", () => {
    expect(data.sources.length).toBe(4);
    for (const s of data.sources) expect(s.url).toMatch(/^https:\/\/mn\.gov\//);
    expect(data.measures.services.date).toBe("January 2023");
    expect(data.measures["earned-income"].date).toBe("State fiscal year 2022");
    expect(data.measures.population.date).toBe("July 2022");
    expect(data.definitions.county).toMatch(/paying for/);
    expect(data.definitions.suppression).toMatch(/under 6/);
  });

  it("finds places by name or FIPS and treats 'all people' shares as not applicable", () => {
    expect(measureFor("27053", "white", "population")).toEqual(measureFor("Hennepin County", "white", "population"));
    expect(measureFor("Hennepin", "all" as GroupId, "population").status).toBe("not-applicable");
    expect(statewide("all", "earned-income").status).toBe("ok");
  });

  it("stays small enough to ship to the browser", () => {
    expect(JSON.stringify(data).length).toBeLessThan(400 * 1024);
  });
});
