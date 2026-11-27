import "server-only";
/**
 * Site-wide search: the same published program content Ask draws on, plus the State of Minnesota agencies,
 * boards and councils and the public state pages indexed for Ask. One index, so search and Ask always agree.
 * Nothing here records what anyone searches for.
 */
import { recentStaffDocs, recentProgramResources } from "@/lib/intelligence/retrieval/ask-library";
import { searchDocs, searchExcerpt, type Doc } from "@/lib/intelligence/retrieval/search";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { PUBLIC_BODIES, agencyDisplayName, agencyNodeId, agencyPageHref } from "@/lib/content/state-agencies";
import { pageArea, type PageArea } from "@/lib/program/page-purpose";
import { statePageDocs, stateReadingHref } from "@/lib/search/state-pages";
import { externalReadingHref, externalSourceHref, unavailableExternalUrl } from "@/lib/content/external-readings";
import { facetValue } from "@/lib/graph/facets";
import { publishedResourceSupplements } from "@/lib/intelligence/retrieval/published-resource-supplements";
import { availableSourceDocs } from "@/lib/intelligence/retrieval/available-source-docs";
import { htmlToText } from "@/lib/downloads/html-text";

export type SiteSearchResult = { id: string; title: string; href: string; excerpt: string; area: PageArea | "state"; external: boolean };
export type SearchTiming = (stage: "library" | "supplements" | "ranking", milliseconds: number) => void;

/** The agencies as documents. Ask leaves out link-only agencies (Tribal matters): it points to them but never answers from them. */
const agencyDocsByUse = new Map<boolean, Doc[]>();
const agencyAliases: Record<string, string[]> = {
  "labor-and-industry-department-of": ["DLI"],
  "employment-and-economic-development-department": ["DEED"],
  "minnesota-management-and-budget": ["MMB"],
  "administration-department-of": ["Admin"],
};
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
  return PUBLIC_BODIES.filter(agency => !(forAnswers && agency.linkOnly) && !unavailableExternalUrl(agency.href)).map(agency => ({
    kind: "content", id: agencyNodeId(agency), title: agencyDisplayName(agency.name), href: externalSourceHref(agency.href)!,
    authority: "external_verify", type: "agency", status: "published", reviewDate: "", scope: "public",
    summary: agency.description, text: agency.description, tags: [...agency.topics.split(/\s+/).filter(Boolean), ...(agencyAliases[agency.id] ?? [])], intents: [],
    // Reuse the published directory's topical connections. These suggest related
    // material; they do not assert that an agency owns or endorses it.
    graphRelated: agency.linkOnly ? [] : ["/minnesota-agencies", ...(facetValue("community", `agency-${agency.id}`)?.items ?? [])
      .filter(item => item.id !== agencyNodeId(agency)).map(item => item.href)],
  }));
}

async function allDocs(scope: StaffProgramScope, timing?: SearchTiming): Promise<Doc[]> {
  const started = performance.now();
  const [staff, program] = await Promise.all([recentStaffDocs(scope), recentProgramResources(scope)]);
  const base = availableSourceDocs([...staff, ...program.destinations, ...agencyDocs(), ...statePageDocs()]);
  const loaded = performance.now();
  timing?.("library", loaded - started);
  const supplements = await publishedResourceSupplements(scope, base);
  timing?.("supplements", performance.now() - loaded);
  return [...new Map([...base, ...supplements].map(doc => [`${doc.kind}:${doc.id}:${doc.href}`, doc])).values()];
}

export async function siteSearch(query: string, scope: StaffProgramScope, limit = 20, timing?: SearchTiming): Promise<SiteSearchResult[]> {
  const q = query.trim().slice(0, 200);
  if (q.length < 2) return [];
  const docs = await allDocs(scope, timing);
  const ranked = performance.now();
  const byIdentity = new Map(docs.map(doc => [`${doc.kind}:${doc.id}:${doc.href}`, doc]));
  // Program material leads; State of Minnesota pages follow close behind, weighted a little lower.
  const hits = searchDocs(q, docs, { limit: limit * 3, rankOnly: true })
    .map(hit => ({ ...hit, score: /^https?:\/\//.test(hit.href) ? hit.score * 0.7 : hit.score }))
    .sort((a, b) => b.score - a.score);
  const seen = new Set<string>(), out: SiteSearchResult[] = [];
  for (const hit of hits) {
    if (unavailableExternalUrl(hit.href)) continue;
    const href = hit.href.split("#")[0];
    if (seen.has(href)) continue;
    seen.add(href);
    const originalIsExternal = /^https?:\/\//.test(hit.href);
    const [kind, id] = hit.id.split(":", 2);
    const destination = kind === "agency" ? agencyPageHref(id) : kind === "state-page" ? stateReadingHref(id) : externalReadingHref(hit.href) ?? externalSourceHref(hit.href) ?? hit.href;
    const doc = byIdentity.get(`${hit.kind}:${hit.id}:${hit.href}`);
    const sourceText = doc?.text || doc?.summary || "";
    // Strip authored HTML before selecting the display window: a window cut
    // inside a long link attribute cannot be cleaned safely afterwards. Ranking
    // and evidence continue to use the unchanged source document.
    const excerpt = /<\/?[a-z][^>]*>/i.test(sourceText)
      ? searchExcerpt(htmlToText(sourceText), q, hit.title) : searchExcerpt(sourceText, q, hit.title);
    out.push({ id: hit.id, title: hit.title, href: destination, excerpt, area: originalIsExternal ? "state" : pageArea(href), external: /^https?:\/\//.test(destination) });
    if (out.length === limit) break;
  }
  timing?.("ranking", performance.now() - ranked);
  return out;
}
