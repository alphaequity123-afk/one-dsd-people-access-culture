import "server-only";
/**
 * Site-wide search: the same published program content Ask draws on, plus the State of Minnesota agencies,
 * boards and councils and the public state pages indexed for Ask. One index, so search and Ask always agree.
 * Nothing here records what anyone searches for.
 */
import { recentStaffDocs, recentProgramResources } from "@/lib/intelligence/retrieval/ask-library";
import { searchDocs, type Doc } from "@/lib/intelligence/retrieval/search";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { PUBLIC_BODIES, agencyDisplayName, agencyNodeId, agencyPageHref } from "@/lib/content/state-agencies";
import { pageArea, type PageArea } from "@/lib/program/page-purpose";
import { statePageDocs, stateReadingHref } from "@/lib/search/state-pages";

export type SiteSearchResult = { id: string; title: string; href: string; excerpt: string; area: PageArea | "state"; external: boolean };

/** The agencies as documents. Ask leaves out link-only agencies (Tribal matters): it points to them but never answers from them. */
const agencyDocsByUse = new Map<boolean, Doc[]>();
export function agencyDocs(options: { forAnswers?: boolean } = {}): Doc[] {
  // The directory is fixed while the application runs, so the documents are built once and kept.
  const forAnswers = Boolean(options.forAnswers);
  const kept = agencyDocsByUse.get(forAnswers);
  if (kept) return kept;
  const built = buildAgencyDocs(forAnswers);
  agencyDocsByUse.set(forAnswers, built);
  return built;
}
function buildAgencyDocs(forAnswers: boolean): Doc[] {
  return PUBLIC_BODIES.filter(agency => !(forAnswers && agency.linkOnly)).map(agency => ({
    kind: "content", id: agencyNodeId(agency), title: agencyDisplayName(agency.name), href: agency.href,
    authority: "external_verify", type: "agency", status: "published", reviewDate: "", scope: "public",
    summary: agency.description, text: agency.description, tags: agency.topics.split(/\s+/).filter(Boolean), intents: [],
  }));
}

async function allDocs(scope: StaffProgramScope): Promise<Doc[]> {
  const [staff, program] = await Promise.all([recentStaffDocs(scope), recentProgramResources(scope)]);
  return [...staff, ...program.destinations, ...agencyDocs(), ...statePageDocs()];
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
    const originalIsExternal = /^https?:\/\//.test(hit.href);
    const [kind, id] = hit.id.split(":", 2);
    const destination = kind === "agency" ? agencyPageHref(id) : kind === "state-page" ? stateReadingHref(id) : hit.href;
    out.push({ id: hit.id, title: hit.title, href: destination, excerpt: hit.excerpt, area: originalIsExternal ? "state" : pageArea(href), external: /^https?:\/\//.test(destination) });
    if (out.length === limit) break;
  }
  return out;
}
