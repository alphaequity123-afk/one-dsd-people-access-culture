import { describe, expect, it } from "vitest";
import { FACETS, facetValue, facetValues, facetsForHref, graphStats } from "./facets";

describe("four-way facets", () => {
  it("gives every facet values, each with linked items", () => {
    for (const facet of FACETS) {
      const values = facetValues(facet.id);
      expect(values.length, facet.id).toBeGreaterThan(5);
      for (const entry of values) expect(entry.items.length).toBeGreaterThan(0);
    }
  });
  it("links all 15 national standards to curriculum lessons", () => {
    for (let n = 1; n <= 15; n++) expect(facetValue("standard", `clas-${n}`)?.items.some(item => item.kind === "lesson")).toBe(true);
  });
  it("keeps Native community pages to the brief alone", () => {
    for (const id of ["native-american", "tribal-nations", "alaska-native"]) {
      const entry = facetValue("community", `community-${id}`);
      if (entry) expect(entry.items.every(item => item.kind === "brief")).toBe(true);
    }
  });
  it("finds the facets an item belongs to", () => {
    const hiring = facetValues("task").find(entry => entry.items.length > 1)!;
    expect(facetsForHref(hiring.items[0].href).length).toBeGreaterThan(0);
  });
  it("reports coverage", () => {
    const stats = graphStats();
    console.log(stats);
    expect(stats.linkedItems).toBeGreaterThan(100);
  });
});
