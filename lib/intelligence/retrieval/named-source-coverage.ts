import "server-only";
import { explicitInputLinks } from "@/lib/ask/source-links";
import type { EvidenceClaim } from "@/lib/content/ask-evidence";
import { AUTHORITY } from "@/lib/content/types";
import {
  WATER_RESOURCE_COLLECTION_SOURCES, WATER_RESOURCE_COLLECTION_TITLE, waterCollectionSourceFamily,
} from "@/lib/learning/water-resource-collection";
import { learningResourcePath } from "./public-source-paths";
import { publicRetrievalDocumentEligible } from "./public-course-boundary";
import { searchDocs, searchExcerpt, tokens, type Citation, type Doc, type SearchHit } from "./search";

const maxNamedSources = 6;
const toolkitReference = "/library/ext-dhs-equity-toolkit";
const directAttachmentTypes = new Set(["learning_pdf_page", "learning_slide", "public_media_transcript", "learning_reference_section"]);
const taskWords = new Set(tokens("cite citations compare contrast connect discuss explain include name overview reading readings references relate source sources summarize synthesize synthesis use using"));

type Group = { title: string; docs: Doc[]; limitation?: string };
export type NamedSourceCoverage = { title: string; refs: string[]; limitation?: string };
type Mention = { start: number; end: number; key: string; resolve: () => Group | undefined };

function normalizedTitle(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/['’]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function evidenceDocument(doc: Doc): boolean {
  return doc.type !== "learning_navigation" && doc.type !== "external_reference"
    && (AUTHORITY[doc.authority].citeable || doc.type === "source_reading_section")
    && Boolean(doc.text.trim());
}

function locationKey(href: string): string | undefined {
  const path = learningResourcePath(href);
  if (!path) return;
  // Anchored readings and recordings can be distinct resources on the same page.
  const fragment = href.split("#")[1];
  return fragment ? path + "#" + fragment : path;
}

function groupDocs(roots: Doc[], docs: Doc[]): Doc[] {
  const locations = new Set(roots.map(doc => locationKey(doc.href)));
  const ids = new Set(roots.map(doc => doc.id));
  const pages = docs.filter(doc => {
    const parent = doc.id.match(/^(.+)-pdf-page-\d+$/)?.[1];
    return parent && ids.has(parent) && evidenceDocument(doc);
  });
  // Prefer the direct reading to its accompanying catalog summary.
  if (pages.length) return pages;
  const attachments = docs.filter(doc => {
    return directAttachmentTypes.has(doc.type) && evidenceDocument(doc)
      && doc.graphRelated?.some(href => locations.has(locationKey(href)));
  });
  return [...roots.filter(evidenceDocument), ...attachments];
}

/** Exact published titles, route aliases, and the application's canonical reading families. */
export function namedSourcePlan(question: string, currentDocs: Doc[]) {
  const locations = new Map<Doc, string>();
  for (const doc of currentDocs) {
    if (doc.status !== "approved" || !publicRetrievalDocumentEligible(doc)) continue;
    const location = locationKey(doc.href);
    if (location) locations.set(doc, location);
  }
  const docs = [...locations.keys()];
  const normalized = " " + normalizedTitle(question) + " ";
  const mentions: Mention[] = [];
  function addTitle(key: string, title: string, resolve: (start: number, end: number) => Group | undefined) {
    const name = normalizedTitle(title);
    const variants = name.startsWith("the ") ? [name, name.slice(4)] : [name];
    for (const phrase of variants) {
      if (tokens(phrase).length < 2) continue;
      const bounded = " " + phrase + " ";
      let start = normalized.indexOf(bounded);
      while (start >= 0) {
        const matchedStart = start;
        const end = start + bounded.length;
        mentions.push({ key, start, end, resolve: () => resolve(matchedStart, end) });
        start = normalized.indexOf(bounded, end - 1);
      }
    }
  }

  const toolkitTitle = WATER_RESOURCE_COLLECTION_SOURCES.find(source => source.family === "toolkit")!.title.replace(/ public companion$/, "");
  function collectionMember(source: typeof WATER_RESOURCE_COLLECTION_SOURCES[number], accessOnly = false): Group {
    const published = source.family !== "toolkit" || docs.some(doc => doc.href === source.resourcePath);
    const candidates = published ? docs.filter(doc => evidenceDocument(doc) && waterCollectionSourceFamily(doc.href) === source.family) : [];
    if (source.family !== "toolkit") return { title: source.title, docs: candidates };
    return {
      title: accessOnly ? toolkitTitle : source.title,
      docs: accessOnly ? [] : candidates,
      limitation: candidates.length && !accessOnly
        ? "The published DHS Equity Analysis Toolkit companion supports this discussion. The original internal toolkit text is unavailable here."
        : "The original DHS Equity Analysis Toolkit text is unavailable here. Use the current internal DHS version for official steps or requirements.",
    };
  }

  for (const source of WATER_RESOURCE_COLLECTION_SOURCES) {
    const key = source.resourcePath;
    addTitle(key, source.title, () => collectionMember(source));
    if (source.family === "water") addTitle(key, WATER_RESOURCE_COLLECTION_TITLE, () => collectionMember(source));
    if (source.family === "american" || source.family === "minnesota") {
      addTitle(key, "Mainstream " + source.title, () => collectionMember(source));
    }
    if (source.family === "toolkit") {
      for (const alias of [toolkitTitle, toolkitTitle.replace(/^DHS /, "Minnesota "), toolkitTitle.replace(/^DHS /, "")]) {
        addTitle(key, alias, (start, end) => {
          const before = normalized.slice(0, start).trimEnd();
          const after = normalized.slice(end);
          const accessOnly = /\b(?:official|original|internal|current)\s*$/.test(before)
            || /^(?:(?:require|requires|required|mandate|mandates)\b|(?:exact|official|required)\s+(?:steps|process|requirements)\b)/.test(after);
          return collectionMember(source, accessOnly);
        });
      }
    }
  }

  const byLocation = new Map<string, Doc[]>();
  const byTitle = new Map<string, Doc[]>();
  for (const doc of docs) {
    const location = locations.get(doc)!;
    const local = byLocation.get(location);
    if (local) local.push(doc);
    else byLocation.set(location, [doc]);
    if (location === toolkitReference || location === "/learn/equity-toolkit") continue;
    if (directAttachmentTypes.has(doc.type) || /-pdf-page-\d+$/.test(doc.id)) continue;
    const title = normalizedTitle(doc.title);
    const titled = byTitle.get(title);
    if (titled) titled.push(doc);
    else byTitle.set(title, [doc]);
  }
  for (const roots of byTitle.values()) {
    const [root] = roots;
    const key = locations.get(root)!;
    // A title shared by different destinations cannot identify one independently.
    if (roots.some(doc => locations.get(doc) !== key)) continue;
    addTitle(key, root.title, () => {
      const candidates = groupDocs(roots, docs);
      if (!candidates.length && roots.every(doc => doc.type === "learning_navigation")) return;
      return { title: root.title, docs: candidates };
    });
  }

  // Pick the longest phrase where titles overlap, e.g. a collection title and
  // the title of a reading inside it. Distinct nonoverlapping names each get a turn.
  const picked: Mention[] = [];
  for (const mention of mentions.sort((a, b) => b.end - b.start - (a.end - a.start))) {
    if (!picked.some(other => mention.start < other.end - 1 && mention.end - 1 > other.start)) picked.push(mention);
  }
  const groups = new Map<string, Group>();
  for (const mention of picked.sort((a, b) => a.start - b.start)) {
    if (groups.has(mention.key)) continue;
    const group = mention.resolve();
    if (group) groups.set(mention.key, group);
  }
  for (const href of explicitInputLinks(question)) {
    const key = locationKey(href);
    if (!key) continue;
    const member = WATER_RESOURCE_COLLECTION_SOURCES.find(source => source.resourcePath === key || (source.family === "toolkit" && key === toolkitReference));
    if (member) {
      if (!groups.has(member.resourcePath) || key === toolkitReference) groups.set(member.resourcePath, collectionMember(member, key === toolkitReference));
      continue;
    }
    if (groups.has(key)) continue;
    const roots = byLocation.get(key);
    if (!roots?.length) continue;
    const candidates = groupDocs(roots, docs);
    if (candidates.length) groups.set(key, { title: roots[0].title, docs: candidates });
  }
  const selected = [...groups.values()].slice(0, maxNamedSources);
  const queryWithoutNames = picked.reduceRight((query, mention) =>
    query.slice(0, mention.start) + " " + query.slice(mention.end), normalized);
  const subject = tokens(queryWithoutNames).filter(term => !taskWords.has(term)).join(" ");
  const ranked = selected.map(group => {
    const matches = subject ? searchDocs(subject, group.docs, { limit: 2 }) : [];
    if (matches.length) return matches;
    const doc = group.docs[0];
    if (!doc) return [];
    return [{ ...doc, authorityLabel: AUTHORITY[doc.authority].label, score: 0,
      excerpt: searchExcerpt(doc.text, subject, doc.title) } satisfies SearchHit];
  });
  return {
    groups: selected,
    hits: [0, 1].flatMap(rank => ranked.flatMap(hits => hits[rank] ? [hits[rank]] : [])),
    ids: new Set(selected.flatMap(group => group.docs.map(doc => doc.id))),
  };
}

/** Derive references from the passages that actually made the answer's budget. */
export function namedSourceCoverage(groups: Group[], sources: Citation[]): NamedSourceCoverage[] {
  return groups.map(group => {
    const ids = new Set(group.docs.map(doc => doc.id));
    const refs = sources.flatMap((source, index) => ids.has(source.id) && source.evidence ? ["S" + (index + 1)] : []);
    const missingPassage = "I couldn't find a published passage from " + group.title + " to support this answer.";
    const limitation = refs.length ? group.limitation : (group.docs.length ? missingPassage : group.limitation ?? missingPassage);
    return { title: group.title, refs, ...(limitation ? { limitation } : {}) };
  });
}

/** A reading named in prose does not count unless the draft cites its actual evidence. */
export function uncitedNamedSources(coverage: NamedSourceCoverage[], sources: Citation[], claims: EvidenceClaim[]): NamedSourceCoverage[] {
  const used = new Set(claims.flatMap(claim => claim.references.map(reference => reference.evidenceId)));
  return coverage.filter(group => group.refs.length && !group.refs.some(ref => {
    const evidence = sources[Number(ref.slice(1)) - 1]?.evidence;
    return evidence && used.has(evidence.evidenceId);
  }));
}
