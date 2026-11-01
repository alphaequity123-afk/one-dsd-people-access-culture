/**
 * The program's knowledge graph, built from the published content itself: library resources and courses, the
 * reading collection, guided practices, community briefs, themes, levels and course series. Edges come from the
 * shared theme vocabulary, curated course-to-book connections, computed book-to-work links (reading-links.json),
 * and the links each guided practice makes. Pages use it to show what connects to what; it stores nothing about people.
 */
import readingsData from "./reading-collection.json";
import organizationData from "./resource-organization-data.json";
import connectionsData from "./reading-connections.json";
import readingLinksData from "./reading-links.json";
import communitySuggestions from "./community-reading-suggestions.json";
import themeMemberships from "./courses/theme-memberships.json";
import { RESOURCE_THEMES } from "./resource-organization";
import { GRADUATION_PATHS } from "./paths";
import { communityDesignEntries } from "./community-design";

export type GraphNodeKind = "resource" | "reading" | "path" | "brief" | "theme" | "level" | "series" | "lesson" | "curriculum" | "community_research" | "document";
export type GraphEdgeType = "theme" | "level" | "series" | "curated_reading" | "suggested_reading" | "informs" | "practice_link" | "part_of" | "about_community" | "cites" | "related";
export type GraphNode = { id: string; kind: GraphNodeKind; title: string; href: string | null };
export type GraphEdge = { from: string; to: string; type: GraphEdgeType; weight: number; why?: string; practice?: string };
export type RelatedItem = { id: string; kind: GraphNodeKind; title: string; href: string; score: number; why: string; practice?: string };

type Organization = Record<string, { title: string; themes?: string[]; level?: string | null }>;
/** Reviewed rows from reading-links.json: [book id, target id, kind r|p|b, curated 1|0, why the book deepens this work]. */
type ReadingLinkRow = [string, string, "r" | "p" | "b", 0 | 1, string];

const LEVEL_TITLES: Record<string, string> = { foundation: "Foundation", intermediate: "Intermediate", advanced: "Advanced" };
const SERIES_TITLES: Record<string, string> = {
  intercultural: "Intercultural practice", access: "Access and communication", culture: "Workplace culture",
  structural: "Structural equity", partnership: "Community partnership", facilitation: "Facilitation and learning",
};

/** Library ids map to their richest page: courses to the course page, everything else to its library page. */
export function resourceHref(id: string): string {
  return id.startsWith("course-") ? `/courses/${id.slice("course-".length)}` : `/library/${id}`;
}

function resourceIdFromHref(href: string): string | null {
  const clean = href.split(/[?#]/)[0];
  const course = clean.match(/^\/courses\/([a-z0-9-]+)$/); if (course) return `course-${course[1]}`;
  const library = clean.match(/^\/(?:library|resources)\/([a-z0-9.-]+)$/); if (library) return library[1];
  return null;
}

class KnowledgeGraph {
  readonly nodes = new Map<string, GraphNode>();
  readonly out = new Map<string, GraphEdge[]>();
  readonly in = new Map<string, GraphEdge[]>();
  addNode(node: GraphNode) { if (!this.nodes.has(node.id)) this.nodes.set(node.id, node); }
  addEdge(edge: GraphEdge) {
    if (!this.nodes.has(edge.from) || !this.nodes.has(edge.to) || edge.from === edge.to) return;
    (this.out.get(edge.from) ?? this.out.set(edge.from, []).get(edge.from)!).push(edge);
    (this.in.get(edge.to) ?? this.in.set(edge.to, []).get(edge.to)!).push(edge);
  }
  edgesOf(id: string): GraphEdge[] { return [...(this.out.get(id) ?? []), ...(this.in.get(id) ?? [])]; }
  neighbors(id: string, types?: GraphEdgeType[]): Array<{ node: GraphNode; edge: GraphEdge }> {
    return this.edgesOf(id).filter(edge => !types || types.includes(edge.type))
      .map(edge => ({ node: this.nodes.get(edge.from === id ? edge.to : edge.from)!, edge }));
  }
}

let built: KnowledgeGraph | undefined;

export function knowledgeGraph(): KnowledgeGraph {
  if (built) return built;
  const g = new KnowledgeGraph();
  for (const theme of RESOURCE_THEMES) g.addNode({ id: `theme:${theme.id}`, kind: "theme", title: theme.title, href: `/library?theme=${theme.id}` });
  for (const [id, title] of Object.entries(LEVEL_TITLES)) g.addNode({ id: `level:${id}`, kind: "level", title, href: null });
  for (const [id, title] of Object.entries(SERIES_TITLES)) g.addNode({ id: `series:${id}`, kind: "series", title, href: null });

  const organization = organizationData as Organization;
  for (const [id, entry] of Object.entries(organization)) {
    g.addNode({ id, kind: "resource", title: entry.title, href: resourceHref(id) });
    for (const theme of entry.themes ?? []) g.addEdge({ from: id, to: `theme:${theme}`, type: "theme", weight: 1 });
    if (entry.level && LEVEL_TITLES[entry.level]) g.addEdge({ from: id, to: `level:${entry.level}`, type: "level", weight: 1 });
  }
  for (const [series, ids] of Object.entries(themeMemberships as Record<string, string[]>)) {
    for (const id of ids) g.addEdge({ from: id, to: `series:${series}`, type: "series", weight: 1 });
  }
  for (const book of readingsData) {
    g.addNode({ id: book.id, kind: "reading", title: book.title, href: `/learn/readings/${book.id}` });
    for (const theme of book.themes as string[]) g.addEdge({ from: book.id, to: `theme:${theme}`, type: "theme", weight: 1 });
  }
  for (const path of GRADUATION_PATHS) {
    g.addNode({ id: path.id, kind: "path", title: path.title, href: `/practice/${path.id}` });
    for (const step of path.steps) for (const link of step.links) {
      const target = resourceIdFromHref(link.href);
      if (target && g.nodes.has(target)) g.addEdge({ from: path.id, to: target, type: "practice_link", weight: 1, why: step.title });
    }
  }
  for (const entry of communityDesignEntries()) {
    g.addNode({ id: `brief:${entry.id}`, kind: "brief", title: entry.title, href: `/minnesota-communities/${entry.id}` });
    for (const theme of ["identity", "partnership"]) g.addEdge({ from: `brief:${entry.id}`, to: `theme:${theme}`, type: "theme", weight: 1 });
  }
  const byNumber = new Map(readingsData.map(book => [book.number, book.id]));
  for (const link of connectionsData as Array<{ book: number; course: string; reason: string; practice: string }>) {
    const book = byNumber.get(link.book); if (!book) continue;
    g.addEdge({ from: book, to: `course-${link.course}`, type: "curated_reading", weight: 1, why: link.reason, practice: link.practice });
  }
  for (const [book, targetId, kind, curated, why] of (readingLinksData as unknown as { rows: ReadingLinkRow[] }).rows) {
    if (curated) continue; // already present with its reason and practice
    g.addEdge({ from: book, to: kind === "b" ? `brief:${targetId}` : targetId, type: "informs", weight: 1, why });
  }
  for (const [brief, books] of Object.entries(communitySuggestions as Record<string, string[]>)) {
    for (const book of books) g.addEdge({ from: book, to: `brief:${brief}`, type: "suggested_reading", weight: 1, why: "Suggested reading for this community" });
  }
  built = g;
  return g;
}

type GraphDoc = { id: string; href: string; title: string; type: string; kind: string; graphLinks?: string[]; graphRelated?: string[] };

function nodeIdForHref(href: string): string | null {
  const selfDirected = href.match(/^\/learning\/self-directed\/index\.html\?course=([FIA](?:0[1-9]|1[0-9]|2[0-4]))$/);
  if (selfDirected) return `self-directed-${selfDirected[1]}`;
  const clean = href.split(/[?#]/)[0];
  const collection = clean.match(/^\/collections\/([a-z-]+)$/); if (collection) return `theme:${collection[1]}`;
  const reading = clean.match(/^\/learn\/readings\/([a-z0-9-]+)$/); if (reading) return reading[1];
  const community = clean.match(/^\/minnesota-communities\/([a-z0-9-]+)$/); if (community) return `brief:${community[1]}`;
  const practice = clean.match(/^\/practice\/([a-z0-9-]+)$/); if (practice) return practice[1];
  return resourceIdFromHref(clean);
}

/**
 * The whole program as one graph: the content graph above plus every searchable document Ask can read.
 * Each document attaches to its node, so a node resolves to full text. Pages keep using the smaller knowledgeGraph().
 */
class ContentGraph extends KnowledgeGraph {
  private readonly documents = new Map<string, GraphDoc[]>();
  private readonly nodesByDocument = new Map<string, string[]>();
  attach(nodeId: string, doc: GraphDoc) {
    (this.documents.get(nodeId) ?? this.documents.set(nodeId, []).get(nodeId)!).push(doc);
    (this.nodesByDocument.get(doc.id) ?? this.nodesByDocument.set(doc.id, []).get(doc.id)!).push(nodeId);
  }
  nodesForDocument(id: string): string[] { return this.nodesByDocument.get(id) ?? []; }
  documentsForNode<T = GraphDoc>(id: string): T[] { return (this.documents.get(id) ?? []) as unknown as T[]; }
  documentIds(): string[] { return [...this.nodesByDocument.keys()]; }
}

let contentGraphCache: { docs: readonly GraphDoc[]; graph: ContentGraph } | undefined;

export function contentGraphForDocs(docs: readonly GraphDoc[]): ContentGraph {
  if (contentGraphCache?.docs === docs) return contentGraphCache.graph;
  const base = knowledgeGraph();
  const g = new ContentGraph();
  for (const node of base.nodes.values()) g.addNode(node);
  for (const edges of base.out.values()) for (const edge of edges) g.addEdge(edge);
  for (const doc of docs) {
    let nodeId: string;
    if (doc.type === "community_research") {
      nodeId = `research:${doc.id}`;
      g.addNode({ id: nodeId, kind: "community_research", title: doc.title, href: doc.href });
      g.addEdge({ from: nodeId, to: nodeIdForHref(doc.href) ?? "", type: "about_community", weight: 1 });
    } else if (doc.type === "course_lesson") {
      nodeId = `lesson:${doc.id}`;
      g.addNode({ id: nodeId, kind: "lesson", title: doc.title, href: doc.href });
      g.addEdge({ from: nodeId, to: nodeIdForHref(doc.href.split("/").slice(0, 3).join("/")) ?? "", type: "part_of", weight: 1 });
    } else if (doc.type === "curriculum") {
      nodeId = `curriculum:${doc.id}`;
      g.addNode({ id: nodeId, kind: "curriculum", title: doc.title, href: doc.href });
      const course = nodeIdForHref(doc.href);
      if (course) g.addEdge({ from: nodeId, to: course, type: "part_of", weight: 1 });
    } else {
      const known = nodeIdForHref(doc.href);
      if (known && g.nodes.has(known)) nodeId = known;
      else {
        nodeId = `document:${doc.href}`;
        g.addNode({ id: nodeId, kind: "document", title: doc.title, href: doc.href });
        const parent = doc.href.split("#")[0];
        if (parent !== doc.href) { g.addNode({ id: `document:${parent}`, kind: "document", title: doc.title.split(":")[0], href: parent }); g.addEdge({ from: nodeId, to: `document:${parent}`, type: "part_of", weight: 1 }); }
      }
    }
    g.attach(nodeId, doc);
  }
  for (const doc of docs) for (const [href, type] of [...(doc.graphLinks ?? []).map(href => [href, "cites"] as const), ...(doc.graphRelated ?? []).map(href => [href, "related"] as const)]) {
    // Do not create nodes for arbitrary links: connect only to an existing
    // graph node or an already indexed public document.
    const known = nodeIdForHref(href);
    const target = known && g.nodes.has(known) ? known : (g.nodes.has(`document:${href.split("#")[0]}`) ? `document:${href.split("#")[0]}` : null);
    for (const from of g.nodesForDocument(doc.id)) if (target && (type !== "related" || g.documentsForNode(target).length > 0)) g.addEdge({ from, to: target, type, weight: 1, why: type === "related" ? "Linked program content" : "Cited source" });
  }
  contentGraphCache = { docs, graph: g };
  return g;
}

const WEIGHT: Record<GraphEdgeType, number> = { curated_reading: 5, suggested_reading: 5, informs: 4, practice_link: 2, series: 1.5, theme: 1, level: 0.4, part_of: 2, about_community: 3, cites: 3, related: 1.5 };

/** Items most connected to the given one, scored by the strength and kind of the connections between them. */
export function relatedItems(id: string, options: { limit?: number; kinds?: GraphNodeKind[]; exclude?: string[] } = {}): RelatedItem[] {
  const g = knowledgeGraph();
  const start = g.nodes.get(id);
  if (!start) return [];
  const limit = options.limit ?? 6;
  const scores = new Map<string, { score: number; why: Set<string>; practice?: string }>();
  const bump = (node: GraphNode, amount: number, why: string, practice?: string) => {
    if (node.id === id || !node.href || node.kind === "theme" || node.kind === "level" || node.kind === "series") return;
    if (options.kinds && !options.kinds.includes(node.kind)) return;
    if (options.exclude?.includes(node.id)) return;
    const row = scores.get(node.id) ?? { score: 0, why: new Set<string>() };
    row.score += amount; row.why.add(why); if (practice) row.practice = practice;
    scores.set(node.id, row);
  };
  for (const { node, edge } of g.neighbors(id)) {
    if (node.kind === "theme" || node.kind === "level" || node.kind === "series") {
      // Two steps: everything else attached to the same theme, level or series.
      const label = node.kind === "theme" ? `Shares the theme ${node.title}` : node.kind === "series" ? `Part of the ${node.title} series` : `Also at the ${node.title} level`;
      for (const second of g.neighbors(node.id)) bump(second.node, WEIGHT[edge.type] * edge.weight, label);
    } else {
      const label = edge.type === "curated_reading" || edge.type === "informs" || edge.type === "suggested_reading" ? (edge.why ?? "A chosen connection") : edge.type === "practice_link" ? `Used in the step "${edge.why}"` : "Connected";
      bump(node, WEIGHT[edge.type] * edge.weight, label, edge.practice);
    }
  }
  return [...scores.entries()].map(([nodeId, row]) => {
    const node = g.nodes.get(nodeId)!;
    return { id: nodeId, kind: node.kind, title: node.title, href: node.href!, score: Math.round(row.score * 100) / 100, why: [...row.why][0], practice: row.practice };
  }).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}

/** Books connected to a resource, practice or brief: curated connections first, then the strongest computed ones. */
export function readingsFor(id: string, limit = 4): RelatedItem[] {
  const g = knowledgeGraph();
  const nodeId = g.nodes.has(id) ? id : `brief:${id}`;
  return g.neighbors(nodeId, ["curated_reading", "suggested_reading", "informs"]).filter(({ node }) => node.kind === "reading")
    .map(({ node, edge }) => ({ id: node.id, kind: node.kind, title: node.title, href: node.href!, score: edge.type === "curated_reading" || edge.type === "suggested_reading" ? 10 : edge.weight, why: edge.why ?? "", practice: edge.practice }))
    .sort((a, b) => b.score - a.score).slice(0, limit);
}

/** The courses, guided practices and briefs a book's ideas connect to. */
export function usesOfReading(id: string, limit = 6): RelatedItem[] {
  const g = knowledgeGraph();
  return g.neighbors(id, ["curated_reading", "suggested_reading", "informs"]).filter(({ node }) => node.kind !== "reading")
    .map(({ node, edge }) => ({ id: node.id, kind: node.kind, title: node.title, href: node.href!, score: edge.type === "curated_reading" || edge.type === "suggested_reading" ? 10 : edge.weight, why: edge.why ?? "", practice: edge.practice }))
    .sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Counts and gaps, for the maintenance check: every book and resource should connect to the work beyond a theme label. */
export function graphReport() {
  const g = knowledgeGraph();
  const counts: Record<string, number> = {};
  for (const node of g.nodes.values()) counts[node.kind] = (counts[node.kind] ?? 0) + 1;
  const edgeCounts: Record<string, number> = {};
  for (const edges of g.out.values()) for (const edge of edges) edgeCounts[edge.type] = (edgeCounts[edge.type] ?? 0) + 1;
  const strong = (id: string) => g.edgesOf(id).some(edge => edge.type === "curated_reading" || edge.type === "suggested_reading" || edge.type === "informs" || edge.type === "practice_link");
  const readingsWithoutWork = [...g.nodes.values()].filter(node => node.kind === "reading" && !strong(node.id)).map(node => node.id);
  const resourcesWithoutTheme = [...g.nodes.values()].filter(node => node.kind === "resource" && !g.edgesOf(node.id).some(edge => edge.type === "theme")).map(node => node.id);
  const isolated = [...g.nodes.values()].filter(node => node.kind !== "theme" && node.kind !== "level" && node.kind !== "series" && g.edgesOf(node.id).length === 0).map(node => node.id);
  return { nodes: counts, edges: edgeCounts, readingsWithoutWork, resourcesWithoutTheme, isolated };
}

/** The two books suggested for a Minnesota community brief, in the order chosen. */
export function suggestedReadingFor(briefId: string): Array<{ id: string; title: string; authors: string }> {
  const ids = (communitySuggestions as Record<string, string[]>)[briefId] ?? [];
  return ids.flatMap(id => { const book = readingsData.find(r => r.id === id); return book ? [{ id: book.id, title: book.title, authors: book.authors }] : []; });
}

/** The community briefs a book is suggested for. */
export function briefsSuggestingReading(bookId: string): Array<{ id: string; title: string; href: string }> {
  const g = knowledgeGraph();
  return g.neighbors(bookId, ["suggested_reading"]).map(({ node }) => ({ id: node.id, title: node.title, href: node.href! }));
}
