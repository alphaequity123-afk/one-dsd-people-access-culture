import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contentGraphForDocs } from "@/lib/content/knowledge-graph";
import { indexedProgramResources } from "./program-resources";
import { indexedStaffDocs } from "./staff-search";
import { brainContext, BRAIN_LIMITS, expandThroughGraph, relevantPassages } from "./brain";
import { searchDocs } from "./search";

const allDocs = async () => [...(await indexedStaffDocs("dsd")).filter(doc => doc.kind !== "brief"), ...(await indexedProgramResources("dsd")).destinations];

describe("knowledge graph brain", () => {
  it("covers every searchable document and resolves each to text", async () => {
    const docs = await allDocs();
    const graph = contentGraphForDocs(docs);
    const attached = new Set(graph.documentIds());
    const missing = docs.filter(doc => !attached.has(doc.id));
    const byType: Record<string, number> = {};
    for (const doc of docs) byType[doc.type] = (byType[doc.type] ?? 0) + 1;
    const kinds: Record<string, number> = {};
    for (const node of graph.nodes.values()) kinds[node.kind] = (kinds[node.kind] ?? 0) + 1;
    const edges: Record<string, number> = {};
    for (const list of graph.out.values()) for (const edge of list) edges[edge.type] = (edges[edge.type] ?? 0) + 1;
    const noText = docs.filter(doc => !doc.text.trim()).map(doc => doc.id);
    const isolated = [...graph.nodes.values()].filter(node => !["theme", "level", "series"].includes(node.kind) && graph.edgesOf(node.id).length === 0);
    if (process.env.BRAIN_REPORT) writeFileSync(process.env.BRAIN_REPORT, JSON.stringify({ documents: docs.length, documentsByType: byType, graphNodes: kinds, graphEdges: edges, notAttached: missing.map(doc => doc.id), withoutText: noText, nodesWithNoConnection: isolated.length, nodesWithNoConnectionSample: isolated.slice(0, 40).map(node => node.id) }, null, 2));
    expect(missing).toEqual([]);
    expect(noText).toEqual([]);
    expect(byType.reading).toBe(306);
    expect(byType.community_research).toBeGreaterThan(1500);
    expect(byType.curriculum).toBeGreaterThan(50);
    expect(edges.about_community).toBeGreaterThan(1500);
  });

  it("expands from a book to connected work, and from a community page to its research", async () => {
    const docs = await allDocs();
    const book = searchDocs("Leading with Cultural Intelligence Livermore", docs, { limit: 1 });
    expect(expandThroughGraph(book, docs, "cultural intelligence").length).toBeGreaterThan(0);
    const page = docs.filter(doc => doc.type === "community_brief" && doc.href.endsWith("/hmong"));
    const hit = { kind: "brief" as const, id: page[0].id, title: page[0].title, href: page[0].href, authority: page[0].authority, authorityLabel: "", type: page[0].type, status: "approved", reviewDate: "", scope: "dsd", excerpt: "", score: 1 };
    const connected = expandThroughGraph([hit], docs, "Hmong organizations in Minnesota");
    expect(connected.some(row => row.type === "community_research")).toBe(true);
  });

  it("stays within the context budget and keeps the passage nearest the question", async () => {
    const long = "alpha ".repeat(2000) + "unmistakable finding here " + "beta ".repeat(2000);
    const passage = relevantPassages(long, "unmistakable finding", 1600);
    expect(passage.trimmed).toBe(true);
    expect(passage.text).toContain("unmistakable");
    const docs = await allDocs();
    const hits = searchDocs("community engagement accessibility equity", docs, { limit: 8 });
    const built = brainContext(hits, expandThroughGraph(hits, docs, "community engagement"), docs, "community engagement");
    expect(built.usedChars).toBeLessThanOrEqual(BRAIN_LIMITS.totalChars + 2000);
    expect(built.context.length).toBeGreaterThan(0);
  });
});
