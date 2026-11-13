import "server-only";
import { contentGraphForDocs, type GraphEdgeType } from "@/lib/content/knowledge-graph";
import { AUTHORITY } from "@/lib/content/types";
import { scoreDoc, searchExcerpt, tokens, type Doc, type SearchHit } from "./search";

const EDGE_WEIGHT: Partial<Record<GraphEdgeType, number>> = { curated_reading: 5, suggested_reading: 5, informs: 4, about_community: 3, cites: 3, practice_link: 2, part_of: 2, related: 1.5 };
export const BRAIN_LIMITS = { connected: 6, totalChars: 24_000, leadChars: 4000, connectedChars: 1500 };

/** Follow the graph one step from the best matches, ranked by connection strength and fit with the question. */
export function expandThroughGraph(hits: SearchHit[], docs: Doc[], question: string, limit = BRAIN_LIMITS.connected): Array<SearchHit & { via: string }> {
  const graph = contentGraphForDocs(docs);
  const present = new Set(hits.map(hit => hit.id));
  const scores = new Map<string, { doc: Doc; score: number; via: string }>();
  for (const hit of hits) {
    for (const nodeId of graph.nodesForDocument(hit.id)) {
      for (const { node, edge } of graph.neighbors(nodeId)) {
        const weight = EDGE_WEIGHT[edge.type];
        if (!weight) continue;
        for (const candidate of graph.documentsForNode<Doc>(node.id)) {
          if (present.has(candidate.id)) continue;
          const fromPage = hit.kind === "brief" && candidate.kind === "brief" && candidate.href === hit.href;
          const row = scores.get(candidate.id) ?? { doc: candidate, score: scoreDoc(question, candidate, [], fromPage), via: `Connected to ${hit.title}` };
          row.score += weight;
          scores.set(candidate.id, row);
        }
      }
    }
  }
  return [...scores.values()].sort((a, b) => b.score - a.score).slice(0, limit).map(({ doc, score, via }) => ({
    kind: doc.kind, id: doc.id, title: doc.title, href: doc.href, authority: doc.authority, authorityLabel: AUTHORITY[doc.authority].label,
    type: doc.type, layer: doc.layer, status: doc.status, reviewDate: doc.reviewDate, scope: doc.scope,
    excerpt: searchExcerpt(doc.text || doc.summary, question, doc.title), score: Math.round(score * 10) / 10, via,
  }));
}

/** The parts of a long document closest to the question, in their original order. */
export function relevantPassages(text: string, question: string, maxChars: number): { text: string; trimmed: boolean } {
  const clean = text.replace(/[ \t]+/g, " ").trim();
  if (clean.length <= maxChars) return { text: clean, trimmed: false };
  const terms = new Set(tokens(question));
  const size = 800;
  const windows: Array<{ start: number; score: number }> = [];
  for (let start = 0; start < clean.length; start += size) {
    windows.push({ start, score: tokens(clean.slice(start, start + size)).filter(word => terms.has(word)).length + (start === 0 ? 0.5 : 0) });
  }
  const chosen = windows.sort((a, b) => b.score - a.score).slice(0, Math.max(1, Math.floor(maxChars / size))).sort((a, b) => a.start - b.start);
  return { text: chosen.map(row => clean.slice(row.start, row.start + size).trim()).join(" [...] "), trimmed: true };
}

/** Full text for the writer: more for the best matches, less for connected items, always within the budget. */
export function brainContext(lead: SearchHit[], connected: Array<SearchHit & { via: string }>, docs: Doc[], question: string) {
  const byId = new Map(docs.map(doc => [doc.id, doc]));
  const context: Array<{ id: string; title: string; href: string; connection?: string; text: string; sourceContext?: Doc["sourceContext"] }> = [];
  let used = 0, trimmedDocuments = 0, droppedDocuments = 0;
  for (const [hit, room, via] of [...lead.map(hit => [hit, BRAIN_LIMITS.leadChars, undefined] as const), ...connected.map(hit => [hit, BRAIN_LIMITS.connectedChars, hit.via] as const)]) {
    const doc = byId.get(hit.id);
    if (!doc) continue;
    const remaining = BRAIN_LIMITS.totalChars - used;
    if (remaining < 400) { droppedDocuments++; continue; }
    const passage = relevantPassages(doc.text, question, Math.min(room, remaining));
    if (passage.trimmed) trimmedDocuments++;
    used += passage.text.length;
    context.push({ id: doc.id, title: doc.title, href: doc.href, connection: via, text: passage.text, ...(doc.sourceContext ? { sourceContext: doc.sourceContext } : {}) });
  }
  return { context, usedChars: used, trimmedDocuments, droppedDocuments };
}

/** Shrink what the writer receives, least useful first, so program knowledge and public research both still fit. */
export function fitWriterPrompt<D, K extends { text: string }, R extends { answer?: string; sources: unknown[] } | undefined>(
  system: string, directory: D[], knowledge: K[], research: R, build: (directory: D[], knowledge: K[], research: R) => string, limit = 78_000,
) {
  const shortKnowledge = (share: number) => knowledge.map(item => ({ ...item, text: item.text.slice(0, Math.floor(item.text.length * share)) }));
  const shortResearch = (chars: number, sources: number) => (research ? { ...research, answer: research.answer?.slice(0, chars), sources: research.sources.slice(0, sources) } : research) as R;
  const steps: Array<[D[], K[], R]> = [
    [directory.slice(0, 70), knowledge, research],
    [directory.slice(0, 30), knowledge, research],
    [directory.slice(0, 30), knowledge, shortResearch(16_000, 15)],
    [directory.slice(0, 15), shortKnowledge(0.6), shortResearch(16_000, 15)],
    [directory.slice(0, 15), shortKnowledge(0.6), shortResearch(10_000, 10)],
    [directory.slice(0, 10), shortKnowledge(0.35), shortResearch(8_000, 8)],
  ];
  let user = "";
  for (let step = 0; step < steps.length; step++) {
    user = build(...steps[step]);
    if (Buffer.byteLength(system + user, "utf8") <= limit) return { user, step };
  }
  return { user, step: steps.length - 1 };
}
