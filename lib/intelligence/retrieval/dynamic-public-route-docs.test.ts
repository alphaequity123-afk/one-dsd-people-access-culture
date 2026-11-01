import { describe, expect, it } from "vitest";
import { getEditableSurfaceDefinition } from "@/lib/content/staff-surface-registry";
import { contentGraphForDocs } from "@/lib/content/knowledge-graph";
import { searchDocs } from "./search";
import { dynamicPublicRouteDocs } from "./dynamic-public-route-docs";

describe("dynamic public route indexing", () => {
  it("enumerates public administrations and substantive practice guides", () => {
    const docs = dynamicPublicRouteDocs("dsd", []);
    expect(docs.filter(d => d.href.startsWith("/administrations/")).length).toBe(4);
    const guide = docs.find(d => d.href === "/practice-guides/inclusive-meetings")!;
    expect(guide.text).toMatch(/Prepare more than one way to contribute/);
    expect(searchDocs("prepare participation ways contribute meeting", docs, {limit: 5}).some(hit => hit.id === guide.id)).toBe(true);
    expect(docs.some(d => d.text.includes("Organizational information can change"))).toBe(true);
  });
  it("gates work areas on the current scoped parent and related domains", () => {
    expect(dynamicPublicRouteDocs("dsd", []).some(d => d.href.startsWith("/areas/work/"))).toBe(false);
    const values = { ...getEditableSurfaceDefinition("areas.page")!.approvedValues };
    const rows = [{surfaceId: "areas.page", values}];
    const docs = dynamicPublicRouteDocs("dsd", rows);
    expect(docs.filter(d => d.href.startsWith("/areas/work/")).length).toBe(9);
    const workforce = docs.find(d => d.href === "/areas/work/workforce_equity")!;
    expect(workforce.text).toContain("Workforce equity");
    expect(workforce.graphRelated).not.toContain("/areas/workforce");
    const available = dynamicPublicRouteDocs("dsd", [...rows, {surfaceId: "domain.workforce", values: {}}]).find(d => d.id === workforce.id)!;
    expect(available.graphRelated).toContain("/areas/workforce");
    const graph = contentGraphForDocs(docs);
    expect(graph.documentIds()).toContain(workforce.id);
    expect(JSON.stringify(docs)).not.toContain("Private sentinel");
  });
});
