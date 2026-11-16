import "server-only";
import { hasResourceMediaPreview } from "@/components/multimedia/resource-media-preview";
import { resourceStudyHref } from "@/lib/client/resource-study-links";
import { PROGRAM } from "@/lib/constants";
import { courseContentItem, courseHref, publishedCourses } from "@/lib/content/courses/published";
import { loadPublishedEditableSurfaces } from "@/lib/content/editable-surfaces";
import { expandedLibraryQuery, libraryDestinations, matchesExpandedLibraryQuery } from "@/lib/content/library-discovery";
import { matchesLibraryFacets, matchesPracticeGuideFilters, resourceDepthLabel } from "@/lib/content/library-facets";
import { prepareEditableSurface } from "@/lib/content/prepare-editable-surface";
import { selfDirectedHref, selfDirectedItems } from "@/lib/content/self-directed";
import { loadStaffContentSnapshot, type StaffProgramScope } from "@/lib/content/staff-publications";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { CONTENT_TYPE_LABEL, type AuthorityLabel, type ContentLayer, type ContentType } from "@/lib/content/types";
import { matchesLibraryFilters, type LibraryFilters } from "@/lib/content/work-index";
import { DOMAINS } from "@/lib/domains";
import { applyDomainValues, domainSurfaceId } from "@/lib/domains/surfaces";
import { docsFromStaffContent, scoreDoc, tokens } from "@/lib/intelligence/retrieval/search";
import { withWorkOrigin, type WorkOrigin } from "@/lib/product/work-origin";
import { practiceGuides } from "@/lib/program/dsd-practice-guides";

export type LibraryHit = { id: string; href: string; title: string; meta: string; authority: AuthorityLabel; excerpt: string; expandedNote: boolean; studyHref?: string; media: boolean; removable: boolean };
export type LibraryGuide = { slug: string; title: string; purpose: string; summary: string };
export type LibrarySearchResult = { hits: LibraryHit[]; guides: LibraryGuide[]; destinations: { href: string; label: string; reason: string }[] };

export function resourceSummary(text: string, max = 170): string {
  if (text.length <= max) return text;
  const shortened = text.slice(0, max + 1);
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > max * 0.7 ? boundary : max).trimEnd()}…`;
}

/**
 * The Library keyword search, the same ranking the Library page uses: matching resources, practical guides and
 * suggested program pages. Typed words are used only to rank; nothing is stored or logged.
 */
export async function librarySearch(q: string, filters: LibraryFilters, origin: WorkOrigin, scope: StaffProgramScope): Promise<LibrarySearchResult> {
  const searchQuery = expandedLibraryQuery(q);
  const [snapshot, surface, domainPublications, courses] = await Promise.all([
    loadStaffContentSnapshot({ scope }),
    prepareEditableSurface("library.page", { scope }),
    loadPublishedEditableSurfaces(DOMAINS.map(domain => domainSurfaceId(domain.id)), scope),
    publishedCourses(scope),
  ]);
  const domains = domainPublications.flatMap(row => { const source = DOMAINS.find(domain => domainSurfaceId(domain.id) === row.surfaceId); return source ? [applyDomainValues(source, row.values)] : []; });
  const published = [...snapshot.items, ...selfDirectedItems(), ...courses.map(({ pack }) => courseContentItem(pack, { includeLessonBody: false }))];
  const publishedById = new Map(published.map(item => [item.id, item]));
  const courseLinks = new Map(courses.map(({ pack }) => [`course-${pack.course.id}`, courseHref(pack.course.id)]));
  const items = published.filter(item => matchesLibraryFilters(item, filters) && matchesLibraryFacets(item, filters, domains));
  const nativePacks = new Map(courses.map(({ pack }) => [`course-${pack.course.id}`, pack]));
  const searchableItems = items.map(item => { const pack = nativePacks.get(item.id); return pack ? courseContentItem(pack) : item; });
  const searchDocuments = docsFromStaffContent({ ...snapshot, items: searchableItems }).filter(doc =>
    (!(filters.area || filters.task || filters.role || filters.topic || filters.theme || filters.level) || doc.kind === "content")
    && (!filters.type || doc.type === filters.type)
    && (!filters.authority || doc.authority === filters.authority),
  ).map(doc => ({ ...doc, href: selfDirectedHref(doc.id) ?? courseLinks.get(doc.id) ?? doc.href }));
  const studyAvailable = Boolean(process.env.GEMINI_API_KEY?.trim());
  const briefLabel = stringValue(surface.values, "briefTypeLabel");
  const hits = searchDocuments
    .map(doc => ({ doc, score: Math.max(scoreDoc(q, doc), searchQuery !== q && matchesExpandedLibraryQuery(q, doc.text) ? scoreDoc(searchQuery, doc) * 0.5 : 0) }))
    .filter(hit => hit.score > 0).sort((a, b) => b.score - a.score)
    .map(({ doc }): LibraryHit => {
      const depthLabel = resourceDepthLabel(doc.kind === "content" ? publishedById.get(doc.id) : undefined, doc.layer as ContentLayer | undefined);
      return {
        id: doc.id,
        href: withWorkOrigin(doc.href, origin),
        title: doc.title,
        meta: `${doc.kind === "brief" ? briefLabel : CONTENT_TYPE_LABEL[doc.type as ContentType]}${depthLabel ? ` · ${depthLabel}` : ""} · ${doc.scope === "dsd" ? PROGRAM.oneDsdProgramName : PROGRAM.fullName}`,
        authority: doc.authority,
        excerpt: resourceSummary(doc.summary || doc.text, 260),
        expandedNote: searchQuery !== q && matchesExpandedLibraryQuery(q, doc.text),
        ...(studyAvailable && doc.href.startsWith("/learning/self-directed/index.html?course=") ? { studyHref: resourceStudyHref(doc.href) } : {}),
        media: hasResourceMediaPreview(doc.id),
        removable: doc.kind !== "brief",
      };
    });
  const guideTerms = tokens(q);
  const guides = practiceGuides.filter(guide => matchesPracticeGuideFilters(guide, filters, published)).map(guide => {
    const titleTerms = new Set(tokens([guide.title, guide.purpose, guide.summary].join(" ")));
    const bodyTerms = new Set(tokens([guide.introduction, guide.example, guide.review, ...guide.steps.flatMap(step => [step.title, step.body, step.question])].join(" ")));
    return { guide, score: guideTerms.reduce((sum, term) => sum + (titleTerms.has(term) ? 3 : bodyTerms.has(term) ? 1 : 0), 0) };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score)
    .map(({ guide }) => ({ slug: guide.slug, title: guide.title, purpose: guide.purpose, summary: guide.summary }));
  return { hits, guides, destinations: libraryDestinations(q).map(link => ({ ...link, href: withWorkOrigin(link.href, origin) })) };
}
