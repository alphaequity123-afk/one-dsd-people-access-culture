// The Library's own page. /resources redirects here (next.config.ts).
import { expandedLibraryQuery, matchesExpandedLibraryQuery, libraryDestinations, libraryPage } from "@/lib/content/library-discovery";
import { ResourceFormatLinks } from "@/components/resource-format-links";
import { ResourceThemeNav } from "@/components/resource-theme-nav";
import { ResourceThemePathway } from '@/components/resource-theme-pathway';
import { ResourceStartingPoints } from '@/components/resource-starting-points';
import { RESOURCE_THEMES, RESOURCE_LEGACY_THEME_LABELS } from '@/lib/content/resource-organization';
import { selfDirectedItems, selfDirectedHref } from "@/lib/content/self-directed";
import { resourceStudyHref } from "@/lib/client/resource-study-links";
import styles from "@/app/resources/resource-design.module.css";
import layout from "@/app/resources/library-layout.module.css";
import { Hub2More } from "@/components/hub2-choices";
import { matchesLibraryFacets, matchesPracticeGuideFilters, resourceDepthLabel } from "@/lib/content/library-facets";
import { normalizeWorkOrigin, withWorkOrigin } from "@/lib/product/work-origin";
import { WorkOriginLinks } from "@/components/work-origin-links";
import { publishedCourses, courseContentItem, courseHref } from "@/lib/content/courses/published";
import { DhsReferenceLink } from "@/components/dhs-reference-link";
import type { Metadata } from "next";
import { hasResourceMediaPreview, ResourceMediaPreview } from "@/components/multimedia/resource-media-preview";
import Link from "next/link";
import { editingModeFromCookies } from "@/lib/auth/request";
import { ResourceRemove } from "@/components/resource-tools";
import { AuthorityPill } from "@/components/ui";
import { PROGRAM } from "@/lib/constants";
import { loadStaffContentSnapshot } from "@/lib/content/staff-publications";
import { AUTHORITY, CONTENT_TYPE_LABEL, type ContentLayer, type AuthorityLabel, type ContentType } from "@/lib/content/types";
import { docsFromStaffContent, scoreDoc, tokens } from "@/lib/intelligence/retrieval/search";
import { practiceGuides } from "@/lib/program/dsd-practice-guides";
import { requestedContentScope } from "@/lib/product/request-context";
import { ProgramContextNote } from "@/components/program-context";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { DOMAINS, ROLE_FAMILY_LABEL } from "@/lib/domains";
import { applyDomainValues, domainSurfaceId } from "@/lib/domains/surfaces";
import { libraryHref, libraryQueryValue, LIBRARY_FILTER_KEYS, matchesLibraryFilters, normalizeLibraryFilters } from "@/lib/content/work-index";
import { loadPublishedEditableSurfaces } from "@/lib/content/editable-surfaces";
import { stringValue } from "@/lib/content/staff-surface-registry";

export const metadata: Metadata = { title: "Library" };
export const dynamic = "force-dynamic";

function resourceSummary(text: string, max = 170): string {
  if (text.length <= max) return text;
  const shortened = text.slice(0, max + 1);
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > max * 0.7 ? boundary : max).trimEnd()}…`;
}

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = libraryQueryValue(sp.q);
  const searchQuery = expandedLibraryQuery(q);
  const destinations = libraryDestinations(q);
  const filters = normalizeLibraryFilters(sp);
  const origin = normalizeWorkOrigin(sp);
  const scope = await requestedContentScope();
  const owner = await editingModeFromCookies();
  const [snapshot, surface, domainPublications, courses, toolkit] = await Promise.all([
    loadStaffContentSnapshot({ scope }),
    prepareEditableSurface("library.page", { scope }),
    loadPublishedEditableSurfaces(DOMAINS.map(domain=>domainSurfaceId(domain.id)), scope),
    publishedCourses(scope),
    prepareEditableSurface("equity-toolkit.home", { scope, includeOwner: false }),
  ]);
  const copy = surface.values;
  const domains = domainPublications.flatMap(row=>{const source=DOMAINS.find(domain=>domainSurfaceId(domain.id)===row.surfaceId);return source?[applyDomainValues(source,row.values)]:[];});
  // Browsing needs the course metadata; keyword search also needs every lesson's text.
  const published = [...snapshot.items, ...selfDirectedItems(), ...courses.map(({ pack }) => courseContentItem(pack, { includeLessonBody: false }))];
  const publishedById = new Map(published.map(item => [item.id, item]));
  const courseLinks = new Map(courses.map(({ pack }) => [`course-${pack.course.id}`, courseHref(pack.course.id)]));
  const items = published.filter(item => matchesLibraryFilters(item, filters) && matchesLibraryFacets(item, filters, domains));
  // Facets use stable subject metadata; expand lesson text only for retained courses.
  const nativePacks = new Map(courses.map(({ pack }) => [`course-${pack.course.id}`, pack]));
  const searchableItems = q ? items.map(item => { const pack = nativePacks.get(item.id); return pack ? courseContentItem(pack) : item; }) : items;
  // Static mode also adds briefs, so apply the selected filters after building its documents.
  const searchDocuments = q ? docsFromStaffContent({ ...snapshot, items: searchableItems }).filter(doc =>
    (!(filters.area || filters.task || filters.role || filters.topic || filters.theme || filters.level) || doc.kind === "content")
    && (!filters.type || doc.type === filters.type)
    && (!filters.authority || doc.authority === filters.authority),
  ).map(doc => ({ ...doc, href: selfDirectedHref(doc.id) ?? courseLinks.get(doc.id) ?? doc.href })) : [];
  // Library browsing retains actual keyword matches; ASK keeps its separate answer-confidence floor.
  const hits = q ? searchDocuments.map(doc => ({ ...doc, score: Math.max(scoreDoc(q, doc), searchQuery !== q && matchesExpandedLibraryQuery(q, doc.text) ? scoreDoc(searchQuery, doc) * 0.5 : 0), excerpt: resourceSummary(doc.summary || doc.text, 260) }))
    .filter(hit => hit.score > 0).sort((a, b) => b.score - a.score) : [];
  const selectedDomain = domains.find(domain=>domain.id===filters.area);
  const selectedTask = selectedDomain?.tasks.find(task => task.id === filters.task);
  const selectedTheme = RESOURCE_THEMES.find(theme => theme.id === filters.theme);
  const levelLabel = (level: string) => level.charAt(0).toUpperCase()+level.slice(1);
  const types = Array.from(new Set(published.map((c) => c.type))) as ContentType[];
  const authorities = (Array.from(new Set(published.map((c) => c.authority))) as AuthorityLabel[]).filter((a) => AUTHORITY[a].label);
  const hasActiveFilters = Object.keys(filters).some(key => key !== "originArea");
  const activeFilterKeys = LIBRARY_FILTER_KEYS.filter(key => key !== "originArea" && filters[key]);
  const guideTerms = tokens(q);
  const matchedGuides = practiceGuides.filter(guide => matchesPracticeGuideFilters(guide,filters,published)).map(guide => {
    const titleTerms = new Set(tokens([guide.title, guide.purpose, guide.summary].join(" ")));
    const bodyTerms = new Set(tokens([guide.introduction, guide.example, guide.review, ...guide.steps.flatMap(step => [step.title, step.body, step.question])].join(" ")));
    return { guide, score: guideTerms.reduce((sum, term) => sum + (titleTerms.has(term) ? 3 : bodyTerms.has(term) ? 1 : 0), 0) };
  }).filter(item => !q || item.score > 0).sort((a, b) => b.score - a.score).map(item => item.guide);
  const showAll = libraryQueryValue(sp.browse) === "all";
  const retainBrowse = (href: string) => showAll ? `${href}${href.includes("?") ? "&" : "?"}browse=all` : href;
  const clearSearchHref = retainBrowse(libraryHref(filters));
  const clearFiltersHref = retainBrowse(libraryHref({ originArea: filters.originArea }, q));
  const fullCatalogHref = `${libraryHref({ originArea: filters.originArea })}${filters.originArea ? "&" : "?"}browse=all`;
  // Keep the first screen scannable; the full result set remains available below.
  const paging = libraryPage(q ? hits.length : items.length, libraryQueryValue(sp.page), showAll);
  const visibleHits = hits.slice(paging.start, paging.end);
  const visibleItems = items.slice(paging.start, paging.end);
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    for (const key of LIBRARY_FILTER_KEYS) if (filters[key]) params.set(key, filters[key]!);
    params.set("page", String(page));
    return `/library?${params.toString()}#${q ? "results-title" : "all-title"}`;
  };
  const pagination = !showAll && paging.pages > 1 ? <nav aria-label="Resource result pages" className={styles.recoveryActions}>
    {paging.page > 1 ? <Link href={pageHref(paging.page - 1)} rel="prev">Previous resources</Link> : null}
    <span>Page {paging.page} of {paging.pages}</span>
    {paging.page < paging.pages ? <Link href={pageHref(paging.page + 1)} rel="next">Next resources</Link> : null}
  </nav> : null;
  const browseQuery = new URLSearchParams();
  if (q) browseQuery.set("q", q);
  for (const key of LIBRARY_FILTER_KEYS) if (filters[key]) browseQuery.set(key, filters[key]!);
  browseQuery.set("browse", "all");
  const browseAllHref = `/library?${browseQuery.toString()}#${q ? "results-title" : "all-title"}`;
  const noResultsBody = stringValue(copy, "noResultsBody") === stringValue(surface.definition.approvedValues, "noResultsBody")
    ? "No resources matched this search and the selected choices."
    : stringValue(copy, "noResultsBody");
  const recovery = <div className={styles.emptyState}>
    <p>{q ? noResultsBody : "No resources match these choices. Remove a filter to broaden the collection."}</p>
    {q ? <p>Try a shorter phrase or a resource title.{hasActiveFilters ? " You can also remove a filter while keeping your search." : ""}</p> : null}
    <div className={styles.recoveryActions}>
      {hasActiveFilters ? <Link href={clearFiltersHref}>{q ? "Search without filters" : "Clear all filters"}</Link> : null}
      {q ? <Link href={clearSearchHref} aria-label="Clear search and keep selected filters">Clear search</Link> : null}
      <Link href={fullCatalogHref}>Browse all resources</Link>
    </div>
  </div>;
  const renderHit = (h: (typeof hits)[number]) => {
    const depthLabel = resourceDepthLabel(h.kind === "content" ? publishedById.get(h.id) : undefined, h.layer as ContentLayer | undefined);
    return (
    <li key={h.id} className={styles.resultRow}>
      <p className={styles.rowMeta}>
        {h.kind === "brief" ? stringValue(copy, "briefTypeLabel") : CONTENT_TYPE_LABEL[h.type as ContentType]}{depthLabel ? ` · ${depthLabel}` : ""} · {h.scope === "dsd" ? PROGRAM.oneDsdProgramName : PROGRAM.fullName}
      </p>
      <div className={styles.rowTitle}><h3><Link href={withWorkOrigin(h.href,origin)}>{h.title}</Link></h3><AuthorityPill authority={h.authority} />{owner && h.kind !== "brief" ? <ResourceRemove contentItemId={h.id} title={h.title} compact /> : null}</div>
      <p className={styles.rowSummary}>{h.excerpt}</p>{searchQuery !== q && matchesExpandedLibraryQuery(q, h.text) ? <p className={styles.orderNote}>Includes the program name or its abbreviation.</p> : null}
      {process.env.GEMINI_API_KEY?.trim() && h.href.startsWith("/learning/self-directed/index.html?course=") ? <Link href={resourceStudyHref(h.href)} prefetch={false} className="text-sm font-semibold underline underline-offset-4" aria-label={`Study ${h.title}`}>Study this course</Link> : null}
      {hasResourceMediaPreview(h.id) ? <details className={styles.mediaDisclosure}><summary>Related example or recording</summary><ResourceMediaPreview resourceId={h.id} /></details> : null}
    </li>
    );
  };
  const renderItem = (c: (typeof items)[number]) => {
    const selfDirectedPath = selfDirectedHref(c.id);
    return (
    <li key={c.id} className={styles.directoryRow}>
      <p className={styles.rowMeta}>{CONTENT_TYPE_LABEL[c.type]} · {resourceDepthLabel(c)}</p>
      <div className={styles.rowTitle}><h3><Link href={withWorkOrigin(selfDirectedPath ?? courseLinks.get(c.id) ?? `/library/${c.id}`,origin)}>{c.title}</Link></h3><AuthorityPill authority={c.authority} />{owner ? <ResourceRemove contentItemId={c.id} title={c.title} compact /> : null}</div>
      <p className={styles.rowSummary}>{resourceSummary(c.summary, 140)}</p>
      {process.env.GEMINI_API_KEY?.trim() && selfDirectedPath ? <Link href={resourceStudyHref(selfDirectedPath)} prefetch={false} className="text-sm font-semibold underline underline-offset-4" aria-label={`Study ${c.title}`}>Study this course</Link> : null}
      {hasResourceMediaPreview(c.id) ? <details className={styles.mediaDisclosure}><summary>Related example or recording</summary><ResourceMediaPreview resourceId={c.id} /></details> : null}
    </li>
    );
  };

  return (
    <EditableSurfaceRegion surface={surface} className={`${styles.page} ${styles.directoryPage}`}>
      <header className={styles.hero}><div className={styles.heroInner}><p className={styles.eyebrow}>{stringValue(copy, "introKicker")}</p><h1>{stringValue(copy, "introTitle")}</h1><p className={styles.lede}>{stringValue(copy, "introLede").replace(/, and its review date\.?$/, ".")}</p><Link className={styles.back} href="/learn">Explore learning and resources</Link></div></header>
      <div className={styles.content}>
        <WorkOriginLinks origin={origin} domainAvailable={Boolean(selectedDomain)} />
        {selectedDomain && !origin.task ? <p><Link href={withWorkOrigin("/areas/" + selectedDomain.id + (selectedTask ? "#task-" + selectedTask.id : ""),origin)}>{selectedTask?.label ?? selectedDomain.title}</Link></p> : null}
        <form id="find-resource" key={retainBrowse(libraryHref(filters, q))} action="/library" method="get" className={`${styles.search} ${layout.search}`} role="search" aria-label="Find a resource">
          {LIBRARY_FILTER_KEYS.filter(key=>!["role","theme","level"].includes(key)).map(key => filters[key] ? <input key={key} type="hidden" name={key} value={filters[key]} /> : null)}
          {showAll ? <input type="hidden" name="browse" value="all" /> : null}
          <label htmlFor="q" className="block text-lg font-bold">
            {stringValue(copy, "searchLabel")}
          </label>
          <p id="resource-search-help" className={styles.searchHelp}>Search by topic, resource title, or a decision you are working on.</p>
          <div className={styles.searchBar}>
            <input id="q" name="q" type="search" defaultValue={q} aria-describedby="resource-search-help" placeholder={stringValue(copy, "searchPlaceholder")} />
            <button type="submit" className="btn btn--primary">
              {stringValue(copy, "searchButton")}
            </button>
            {q ? <Link className={styles.clearSearch} href={clearSearchHref} aria-label="Clear search">Clear search</Link> : null}
          </div>
          <details className={styles.filterDisclosure} open={hasActiveFilters}>
            <summary>Choose a theme, learning level, or role</summary>
            <p className="mt-3 text-sm">Role and work-area choices suggest useful connections to your work. They do not restrict participation. Clear your choices to explore the full library. Learning levels describe courses; choose all levels to include practical tools and references.</p>
            <div className={styles.filterFields}>
              <label>Role<select name="role" defaultValue={filters.role??""} className="block w-full"><option value="">All roles</option>{Object.entries(ROLE_FAMILY_LABEL).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
              <label>Theme<select name="theme" defaultValue={filters.theme??""} className="block w-full"><option value="">All themes</option>{filters.theme && !selectedTheme ? <option value={filters.theme}>{RESOURCE_LEGACY_THEME_LABELS[filters.theme] ?? filters.theme}</option> : null}{RESOURCE_THEMES.map(theme=><option key={theme.id} value={theme.id}>{theme.title}</option>)}</select></label>
              <label>Learning level<select name="level" defaultValue={filters.level??""} className="block w-full"><option value="">All levels and practical resources</option>{["foundation","intermediate","advanced"].map(level=><option key={level} value={level}>{levelLabel(level)}</option>)}</select></label>
            </div>
            <button className="btn btn--light mt-3" type="submit">Apply choices</button>
            <div className={styles.filters}>
              <span>
              {stringValue(copy, "typeFilterLabel")}:{" "}
              {types.map((t) => (
                <span key={t}>
                  <Link href={retainBrowse(libraryHref({ ...filters, type: t }, q))} aria-current={filters.type === t ? "page" : undefined}>{CONTENT_TYPE_LABEL[t]}</Link>{" "}
                </span>
              ))}
              </span>
              <span>
              {stringValue(copy, "authorityFilterLabel")}:{" "}
              {authorities.map((a) => (
                <span key={a}>
                  <Link href={retainBrowse(libraryHref({ ...filters, authority: a }, q))} aria-current={filters.authority === a ? "page" : undefined}>{AUTHORITY[a].label}</Link>{" "}
                </span>
              ))}
              </span>
            </div>
          </details>
          {hasActiveFilters ? <div className={styles.activeFilters} role="group" aria-label="Selected filters">
            <span className={styles.filterCount}>{activeFilterKeys.length} {activeFilterKeys.length === 1 ? "filter" : "filters"}</span>
            {activeFilterKeys.map(key=>{
              const retained={...filters}; delete retained[key]; if(key==="area")delete retained.task;
              const value=filters[key]!;
              const label=key==="type"?CONTENT_TYPE_LABEL[value as ContentType]:key==="authority"?AUTHORITY[value as AuthorityLabel].label:key==="role"?ROLE_FAMILY_LABEL[value as keyof typeof ROLE_FAMILY_LABEL]:key==="theme"?selectedTheme?.title ?? RESOURCE_LEGACY_THEME_LABELS[value]:key==="level"?levelLabel(value):key==="topic"?`Topic: ${value}`:key==="area"?selectedDomain?.title:key==="task"?selectedTask?.label:value;
              return <Link className={styles.filterChip} key={key} href={retainBrowse(libraryHref(retained,q))} aria-label={`Remove ${label ?? key} filter`}>{label??key}<span aria-hidden="true">×</span></Link>;
            })}
            <Link className={styles.clearFilters} href={clearFiltersHref}>{stringValue(copy, "clearFiltersLabel")}</Link>
          </div> : null}
        </form>
        <nav className={layout.jumpLinks} aria-label="On this page">
          <a href="#find-resource">Find a resource</a>
          {!q && !hasActiveFilters ? <a href="#resource-themes-title">Explore by theme</a> : null}
          {matchedGuides.length ? <a href="#practical-guides">Practical guides ({matchedGuides.length})</a> : null}
          <a href="#resource-formats">Reading and listening</a>
        </nav>

        {q && destinations.length ? <section className={styles.startingPoints} aria-labelledby="suggested-destinations"><h2 id="suggested-destinations">Go straight to the work</h2><p>These program pages may help alongside the Library results below.</p><ul>{destinations.map(link => <li key={link.href}><Link href={withWorkOrigin(link.href, origin)}>{link.label}</Link><p>{link.reason}</p></li>)}</ul></section> : null}
        {q ? (
          <section className={styles.collection} aria-labelledby="results-title">
            <div className={styles.collectionHeading}><div>
            <p className={styles.resultContext}>Search results for “{q}”</p>
            <h2 id="results-title" className="text-xl font-extrabold">
              {hits.length ? `${hits.length} ${hits.length === 1 ? stringValue(copy, "resultSingular") : stringValue(copy, "resultPlural")}` : matchedGuides.length ? "No matching library resources" : stringValue(copy, "noResultsTitle")}
            </h2>
            </div>{hits.length ? <p className={styles.orderNote}>Most relevant first</p> : null}</div>
            <p role="status" className="sr-only">{hits.length} {hits.length === 1 ? "result" : "results"} found.</p>
            {!hits.length ? recovery : null}
            {hits.length > visibleHits.length ? <p className={styles.moreResults}>Showing {paging.start + 1}–{paging.end} of {hits.length} results. <Link href={browseAllHref}>Browse all {hits.length} results</Link></p> : null}
            <ul className={styles.results}>{visibleHits.map(renderHit)}</ul>
            {pagination}
          </section>
        ) : null}

        {!q && !hasActiveFilters && !showAll ? <ResourceStartingPoints className={styles.startingPoints} items={published} toolkitAvailable={toolkit.available} /> : null}
        {selectedTheme && !q && !filters.level && !filters.type && !filters.role && !filters.area && !filters.topic && !filters.authority ? <ResourceThemePathway theme={selectedTheme.id} items={published} className={styles.startingPoints} /> : null}
        {!q && !hasActiveFilters ? <ResourceThemeNav basePath="/library" className={layout.explore} gridClassName={layout.themes} /> : null}

        {!q ? <section className={styles.collection} aria-labelledby="all-title">
          <div className={styles.collectionHeading}><div>
          <p className={styles.resultContext}>{hasActiveFilters ? "Your selected collection" : "Learning, tools, and guidance for your work"}</p>
          <h2 id="all-title" className="text-2xl font-extrabold">
            {filters.type ? CONTENT_TYPE_LABEL[filters.type as ContentType] : filters.authority ? AUTHORITY[filters.authority as AuthorityLabel]?.label : stringValue(copy, "allResourcesTitle")} ({items.length})
          </h2>
          </div></div>
          <p role="status" className="sr-only">{items.length} {items.length === 1 ? "resource" : "resources"} available.</p>
          {!items.length ? recovery : null}
          {items.length > visibleItems.length ? <p className={styles.moreResults}>Showing {paging.start + 1}–{paging.end} of {items.length} resources. <Link href={browseAllHref}>Browse all {items.length} resources</Link></p> : null}
          <ul className={styles.directory}>{visibleItems.map(renderItem)}</ul>
          {pagination}
        </section> : null}

        {matchedGuides.length ? <details id="practical-guides" className={`${styles.programGuides} ${layout.guides}`} open={Boolean(q)}>
          <summary>Practical guides <span>({matchedGuides.length})</span></summary>
          <p>Connect existing guidance with a practical task, then prepare a next step for your work.</p>
          <ul className={styles.guideList}>{matchedGuides.map(guide => <li key={guide.slug}>
            <p className={styles.guidePurpose}>{guide.purpose}</p>
            <h3><Link href={`/practice-guides/${guide.slug}`}>{guide.title}</Link></h3>
            <p>{guide.summary}</p>
          </li>)}</ul>
        </details> : null}


        <Hub2More headingId="resource-formats" title="More ways to explore">
          <p>Choose a course, a practical resource, something to read, or a recording to listen to.{selectedTheme ? " Your theme stays selected as you move between collections." : ""}</p>
          <ResourceFormatLinks theme={selectedTheme?.id} current="library" />
          <p className={styles.collectionLinks}><Link href="/library?browse=all">Browse the complete library</Link><Link href="/practice">Go straight to guided practice</Link></p>
        </Hub2More>
        <details className="course-more-item"><summary>About these resources</summary><div className={styles.context}><DhsReferenceLink /><ProgramContextNote /></div></details>
      </div>
    </EditableSurfaceRegion>
  );
}
