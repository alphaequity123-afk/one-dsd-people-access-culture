/**
 * Maintenance check for the program's knowledge graph: every book and every resource must connect to the work
 * beyond a theme label, and nothing may stand alone. Writes evidence/reading-links/graph-report.json.
 */
import { it, expect } from "vitest";
import { writeFile, mkdir } from "node:fs/promises";
import { graphReport, knowledgeGraph, relatedItems, readingsFor, usesOfReading } from "@/lib/content/knowledge-graph";

it("connects every book and resource into the graph", async () => {
  const report = graphReport();
  const g = knowledgeGraph();
  // Reachability: from any course, can a reader reach a book within two steps (course → theme/series/practice → book, or course → book)?
  const readings = [...g.nodes.values()].filter(node => node.kind === "reading");
  const resources = [...g.nodes.values()].filter(node => node.kind === "resource");
  const reachBook = (id: string) => readingsFor(id, 1).length > 0 || relatedItems(id, { kinds: ["reading"], limit: 1 }).length > 0;
  const resourcesWithoutBook = resources.filter(node => !reachBook(node.id)).map(node => node.id);
  const booksWithoutUse = readings.filter(node => usesOfReading(node.id, 1).length === 0).map(node => node.id);
  const sample = ["course-cultural-humility-vs-checklist", "ja-plain-language", "gp-12", "brief:somali", readings[0]?.id].filter(Boolean).map(id => ({ id, related: relatedItems(id!, { limit: 4 }).map(r => `${r.kind}:${r.title}`) }));
  const output = { at: new Date().toISOString(), ...report, resourcesWithoutBook: resourcesWithoutBook.length, booksWithoutUse, sample };
  await mkdir("evidence/reading-links", { recursive: true });
  await writeFile("evidence/reading-links/graph-report.json", JSON.stringify(output, null, 2) + "\n");
  console.log(JSON.stringify({ nodes: report.nodes, edges: report.edges, isolated: report.isolated.length, readingsWithoutWork: report.readingsWithoutWork.length, resourcesWithoutTheme: report.resourcesWithoutTheme.length, resourcesWithoutBook: resourcesWithoutBook.length, booksWithoutUse: booksWithoutUse.length }));
  // Every reviewed book link must land on a node, or a page would silently show nothing.
  const rows = (await import("@/lib/content/reading-links.json")).default.rows as Array<[string, string, string, number, string]>;
  const missingTargets = [...new Set(rows.map(r => (r[2] === "b" ? "brief:" + r[1] : r[1])).filter(id => !g.nodes.has(id)))];
  console.log("link targets with no graph node:", missingTargets.length, missingTargets.slice(0, 10).join(", "));
  expect(missingTargets).toEqual([]);
  expect(report.isolated).toEqual([]);
  expect(report.readingsWithoutWork).toEqual([]);
  expect(booksWithoutUse).toEqual([]);
});
