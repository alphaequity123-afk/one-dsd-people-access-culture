import "server-only";
/**
 * Site-wide search: the same published program content Ask draws on, plus the State of Minnesota agencies,
 * boards and councils and the public state pages indexed for Ask. One index, so search and Ask always agree.
 * Nothing here records what anyone searches for.
 */
import { indexedStaffDocs } from "@/lib/intelligence/retrieval/staff-search";
import { searchDocs, type Doc } from "@/lib/intelligence/retrieval/search";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { PUBLIC_BODIES, agencyDisplayName, agencyNodeId } from "@/lib/content/state-agencies";
import { pageArea, type PageArea } from "@/lib/program/page-purpose";
import { statePageDocs } from "@/lib/search/state-pages";

export type SiteSearchResult = { id: string; title: string; href: string; excerpt: string; area: PageArea | "state"; external: boolean };

/** The agencies as documents. Ask leaves out link-only agencies (Tribal matters): it points to them but never answers from them. */
export function agencyDocs(options: { forAnswers?: boolean } = {}): Doc[] {
  return PUBLIC_BODIES.filter(agency => !(options.forAnswers && agency.linkOnly)).map(agency => ({
    kind: "content", id: agencyNodeId(agency), title: agencyDisplayName(agency.name), href: agency.href,
    authority: "external_verify", type: "agency", status: "published", reviewDate: "", scope: "public",
    summary: agency.description, text: agency.description, tags: agency.topics.split(/\s+/).filter(Boolean), intents: [],
  }));
}

const cache = new Map<string, Promise<Doc[]>>();
function allDocs(scope: StaffProgramScope): Promise<Doc[]> {
  let docs = cache.get(scope);
  if (!docs) {
    docs = (async () => [...(await indexedStaffDocs(scope)), ...agencyDocs(), ...statePageDocs()])();
    cache.set(scope, docs);
    // A failed load is retried on the next search rather than remembered.
    docs.catch(() => cache.delete(scope));
  }
  return docs;
}

export async function siteSearch(query: string, scope: StaffProgramScope, limit = 20): Promise<SiteSearchResult[]> {
  const q = query.trim().slice(0, 200);
  if (q.length < 2) return [];
  // Program material leads; State of Minnesota pages follow close behind, weighted a little lower.
  const hits = searchDocs(q, await allDocs(scope), { limit: limit * 3 })
    .map(hit => ({ ...hit, score: /^https?:\/\//.test(hit.href) ? hit.score * 0.7 : hit.score }))
    .sort((a, b) => b.score - a.score);
  const seen = new Set<string>(), out: SiteSearchResult[] = [];
  for (const hit of hits) {
    const href = hit.href.split("#")[0];
    if (seen.has(href)) continue;
    seen.add(href);
    const external = /^https?:\/\//.test(hit.href);
    out.push({ id: hit.id, title: hit.title, href: hit.href, excerpt: hit.excerpt, area: external ? "state" : pageArea(href), external });
    if (out.length === limit) break;
  }
  return out;
}
