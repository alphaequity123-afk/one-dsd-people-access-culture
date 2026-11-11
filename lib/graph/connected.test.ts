import { expect, it } from "vitest";
import { facetValue, facetValues } from "@/lib/graph/facets";
import { STATE_AGENCIES, agencyNodeId } from "@/lib/content/state-agencies";

const all = () => [...facetValues("task"), ...facetValues("role"), ...facetValues("standard"), ...facetValues("community")];

it("connects every State of Minnesota agency to the graph", () => {
  const values = all();
  for (const agency of STATE_AGENCIES) {
    expect(values.some(value => value.items.some(item => item.id === agencyNodeId(agency))), agency.name).toBe(true);
  }
});

it("links the agencies staff work with most to program work, both ways", () => {
  for (const name of ["Employment and Economic Development", "Revenue, Department of", "Health, Department of", "Human Services, Department of"]) {
    const agency = STATE_AGENCIES.find(a => a.name.includes(name))!;
    const own = facetValue("community", `agency-${agency.id}`)!;
    expect(own.items.filter(item => item.kind !== "agency").length, name).toBeGreaterThanOrEqual(2);
  }
  const elsewhere = (name: string) => {
    const agency = STATE_AGENCIES.find(a => a.name.includes(name))!;
    return all().filter(value => !value.id.startsWith("agency-") && value.id !== "state-agencies" && value.items.some(item => item.id === agencyNodeId(agency))).map(value => value.title);
  };
  for (const name of ["Employment and Economic Development", "Human Services, Department of", "Health, Department of", "Revenue, Department of"]) {
    expect(elsewhere(name).length, `${name} is linked only from its own page`).toBeGreaterThan(0);
  }
});

it("keeps link-only agencies out of program connections", () => {
  for (const agency of STATE_AGENCIES.filter(a => a.linkOnly)) {
    expect(facetValue("community", `agency-${agency.id}`)!.items.map(item => item.id)).toEqual([agencyNodeId(agency)]);
  }
});

it("reports how connected the agencies are", () => {
  const counts = new Map<string, number>();
  for (const value of all()) for (const item of value.items) counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
  const linked = STATE_AGENCIES.filter(a => (counts.get(agencyNodeId(a)) ?? 0) > 2);
  console.log(JSON.stringify({ agencies: STATE_AGENCIES.length, linkedBeyondTheirOwnPage: linked.length, connectedItems: counts.size }));
});

