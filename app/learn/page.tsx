import { podcastMatchesTheme } from "@/lib/content/audio-organization";
import { COLLABORATION_FOCUSES, collaborationCourses, collaborationHref } from "@/lib/learning/collaboration-collection";
import collaborationStyles from "./collaboration/collaboration.module.css";
import { ResourceFormatLinks } from "@/components/resource-format-links";
import { ResourceThemeNav } from "@/components/resource-theme-nav";
import { ResourceThemePathway } from '@/components/resource-theme-pathway';
import { ResourceStartingPoints } from '@/components/resource-starting-points';
import { RESOURCE_THEMES, RESOURCE_LEGACY_THEME_LABELS, resourceLearningLevel } from '@/lib/content/resource-organization';
import { SELF_DIRECTED_COURSES, selfDirectedHref, selfDirectedItems } from "@/lib/content/self-directed";
import { CoreFifteen } from "@/components/core-fifteen";
import { Hub2More } from "@/components/hub2-choices";
import styles from "./learning-family.module.css";
import preview from "./learning-preview.module.css";
import { getLearningJourney } from "@/lib/content/learning-journey";
import { TRAINING_CREDIT_NOTICE } from "@/lib/program/learning-credit";
import { learningStageHref } from "@/lib/content/learning-journey";
import { DhsReferenceLink } from "@/components/dhs-reference-link";
import { publishedCourses, courseContentItem, courseSummary, courseHref } from "@/lib/content/courses/published";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthorityPill } from "@/components/ui";
import { PublishedPodcast } from "@/components/published-podcast";
import { PODCASTS, podcastMatches } from "@/lib/content/podcasts";
import { LearningTile } from "@/components/learning-tile";
import { ResourceRemove } from "@/components/resource-tools";
import { editingModeFromCookies } from "@/lib/auth/request";
import { getLearningTilePresentation } from "@/lib/content/learning-catalog";
import { selectHubItems } from "@/lib/content/learning-hub";
import { CONTENT_TYPE_LABEL, type ContentType } from "@/lib/content/types";
import { loadStaffContentSnapshot } from "@/lib/content/staff-publications";
import { GRADUATION_PATHS } from "@/lib/content/paths";
import { ProgramContextNote } from "@/components/program-context";
import { ParticipationNotice } from "@/components/participation-notice";
import { LEARNING_STAGES } from "@/lib/product";
import { requestedContentScope } from "@/lib/product/request-context";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";
import { EditableSurfaceRegion, prepareEditableSurface } from "@/components/editable-surface";
import { applyGraduationPathValues, graduationPathSurfaceId, learningStageFieldKey, linkListValue, stringListValue, stringValue } from "@/lib/content/staff-surface-registry";

export const metadata: Metadata = { title: "Learning and resources" };
export const dynamic = "force-dynamic";

function shortSummary(text: string, max = 160): string {
  if (text.length <= max) return text;
  const shortened = text.slice(0, max + 1);
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > max * 0.7 ? boundary : max).trimEnd()}…`;
}

export default async function LearnPage({ searchParams }: { searchParams?: Promise<{ q?: string | string[]; theme?: string | string[]; type?: string | string[]; level?: string | string[]; browse?: string | string[] }> }) {
  const rawQuery = await searchParams ?? {};
  const query = { q: typeof rawQuery.q === "string" ? rawQuery.q : "", theme: typeof rawQuery.theme === "string" ? rawQuery.theme : "", type: typeof rawQuery.type === "string" ? rawQuery.type : "", level: typeof rawQuery.level === "string" && ["foundation","foundations","intermediate","advanced"].includes(rawQuery.level.toLowerCase()) ? rawQuery.level.toLowerCase().replace(/^foundations$/,"foundation") : "" };
  const scope = await requestedContentScope();
  const owner = await editingModeFromCookies();
  const [{ items: baseItems }, surface, catalog, hub, toolkit, journey, culturalIntelligenceAvailable, podcastSurfaces, ...pathSurfaces] = await Promise.all([
    loadStaffContentSnapshot({ scope }),
    prepareEditableSurface("learn.page", { scope }),
    prepareEditableSurface("learn.catalog", { scope }),
    prepareEditableSurface("learn.hub", { scope }),
    prepareEditableSurface("equity-toolkit.home", { scope, includeOwner: false }),
    prepareEditableSurface("learn.intercultural", { scope, includeOwner: false }).catch(() => null),
    culturalIntelligenceHubAvailable(scope),
    Promise.all(PODCASTS.map(podcast => prepareEditableSurface(podcast.surfaceId, { scope }))),
    ...GRADUATION_PATHS.map((path) => prepareEditableSurface(graduationPathSurfaceId(path.id), { scope, includeOwner: false })),
  ]);
  const courses = await publishedCourses(scope);
  const collaborationCollection = collaborationCourses(courses.map(({ pack }) => pack));
  const courseById = new Map(courses.map(({pack})=>[`course-${pack.course.id}`,pack]));
  const items = [...baseItems, ...selfDirectedItems(),...courses.map(({pack})=>courseContentItem(pack, { includeLessonBody: Boolean(query.q.trim()) }))];
  const copy = surface.values;
  const stages = LEARNING_STAGES.map((stage) => ({
    ...stage,
    label: stringValue(copy, learningStageFieldKey(stage.id, "label")),
    purpose: stringValue(copy, learningStageFieldKey(stage.id, "purpose")),
    outcomes: stringListValue(copy, learningStageFieldKey(stage.id, "outcomes")),
  }));
  const graduationPaths = GRADUATION_PATHS.flatMap((path, index) => pathSurfaces[index].available ? [applyGraduationPathValues(path, pathSurfaces[index].values)] : []);
  const selected = selectHubItems(items, hub.values, query);
  const learning = selected.filter((c) => (c.type === "learning_module" || c.type === "scenario") && c.id !== "lm-how-this-program-works");
  const resources = selected.filter((c) => c.type !== "learning_module" && c.type !== "scenario");
  const selectedTheme = RESOURCE_THEMES.find((theme) => theme.id === query.theme);
  const legacyThemeTitle = RESOURCE_LEGACY_THEME_LABELS[query.theme];
  const podcasts = PODCASTS.flatMap((podcast, index) => {
    const published = podcastSurfaces[index];
    return !query.level && published.available && podcastMatchesTheme(podcast.id, query.theme) && podcastMatches(podcast, { ...query, theme: "" }, stringValue(published.values, "title"), stringValue(published.values, "intro")) ? [{ podcast, surface: published }] : [];
  });
  const totalFound = selected.length + podcasts.length;
  const podcastAvailable = podcastSurfaces.some(published => published.available);
  const types = [...new Set(items.map((item) => item.type))];
  const hubText = (key: string) => stringValue(hub.values, key);
  const filtered = Boolean(query.q || query.theme || query.type || query.level);
  const expanded = filtered || rawQuery.browse === "all";
  // Foundations come from the published, owner-editable intercultural journey.
  const foundations = journey ? getLearningJourney(journey.values)[0] : null;
  const startingIds = new Set(journey?.available && foundations ? foundations.resourceIds.slice(0, 2) : []);
  const startingLearning = learning.filter(item => startingIds.has(item.id));
  const remainingLearning = learning.filter(item => !startingIds.has(item.id));
  const accessResource = items.find(item => item.id === "ja-language-access-checklist");
  const topicFirst = resources.find(item => ["tool","checklist","job_aid"].includes(item.type)) ?? learning.find(item => resourceLearningLevel(item) === "foundation") ?? learning[0] ?? resources[0];
  const itemHref = (item: typeof items[number]) => selfDirectedHref(item.id) ?? (courseById.has(item.id) ? courseHref(courseById.get(item.id)!.course.id) : "/library/"+item.id);
  const renderLearning = (collection: typeof learning) => <ul className={styles.courseGrid}>{collection.map((item) => <li key={item.id}><LearningTile showLevel item={item} owner={owner} href={selfDirectedHref(item.id) ?? (courseById.has(item.id) ? courseHref(courseById.get(item.id)!.course.id) : undefined)} presentation={SELF_DIRECTED_COURSES.some(c => "self-directed-"+c.number===item.id) ? {imageSrc:SELF_DIRECTED_COURSES.find(c=>"self-directed-"+c.number===item.id)!.cover,imageAlt:item.title,summary:item.summary} : courseById.has(item.id) ? {imageSrc:courseById.get(item.id)!.course.coverImage,imageAlt:courseById.get(item.id)!.course.coverAlt,summary:shortSummary(courseSummary(courseById.get(item.id)!))} : catalog.available ? getLearningTilePresentation(item.id, catalog.values) : undefined} /></li>)}</ul>;
  const staffGuide = items.find((c) => c.id === "lm-how-this-program-works");
  const practice = items.filter((c) => c.type === "practice_note");
  return (
    <EditableSurfaceRegion surface={surface} className={`${styles.page} ${preview.page}`}>
      <header className={`${styles.hero} ${preview.hero}`}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>{stringValue(copy, "introKicker")}</p>
          <h1>{hub.available ? hubText("title") : stringValue(copy, "introTitle")}</h1>{owner ? <p className="m-0 mt-2"><Link href="/consultant/resources/new" className="btn btn--primary">+ Add a resource</Link></p> : null}
          <p className={styles.intro}>{hub.available ? hubText("intro") : stringValue(copy, "introLede")}</p>
          <div className={styles.heroLinks}><Link href={filtered && !selectedTheme ? "/learn#start-here" : "#start-here"}>Start here</Link><Link href="#catalog">Browse the collection</Link></div>
        </div>
      </header>
      <div className={styles.content}>
        <ResourceFormatLinks theme={selectedTheme?.id} current="learning" />
        <p className={preview.collectionLinks}><Link href="/learn?browse=all#catalog">Browse all learning and resources</Link><Link href="/library?browse=all">Search the complete library</Link><Link href="/practice">Go straight to guided practice</Link></p>
        {selectedTheme || legacyThemeTitle ? <section id="start-here" className={preview.startHere} aria-labelledby="topic-start-title">
          <p className={styles.eyebrow}>Explore a topic</p><h2 id="topic-start-title">{selectedTheme?.title ?? legacyThemeTitle}</h2><p>{selectedTheme?.description ?? "Explore learning and practical resources related to this topic."}</p>
          {topicFirst && !selectedTheme ? <div className={preview.topicFirst}><h3>A useful starting point</h3><Link href={itemHref(topicFirst)}>{topicFirst.title}</Link><p>{shortSummary(topicFirst.whyItMatters || topicFirst.summary, 220)}</p></div> : null}
          <p>Choose the learning or tool that fits your question. You can use a practical resource directly and return to the learning when it helps.</p>
        </section> : null}
        {selectedTheme && !query.q && !query.level && !query.type ? <ResourceThemePathway theme={selectedTheme.id} items={items} className={preview.startingPoints} /> : null}
        <h2 className={preview.collectionTitle}>Search the collection</h2>
        <div id="catalog" className={styles.catalog}>
          <EditableSurfaceRegion surface={hub}>
            <form key={`${query.q}:${query.theme}:${query.type}:${query.level}`} action="/learn" method="get" role="search" className={styles.search}>
              <label htmlFor="hub-q">{hubText("searchLabel")}</label>
              <div className={styles.query}><input id="hub-q" name="q" type="search" defaultValue={query.q ?? ""} /><button type="submit">{hubText("searchButton")}</button></div>
              <details className={preview.filterOptions} open={Boolean(query.theme || query.type || query.level)}>
                <summary>Choose a theme, learning level, or format</summary>
                <div className={styles.filters}>
                  <label>Theme<select name="theme" defaultValue={query.theme}><option value="">All themes</option>{legacyThemeTitle ? <option value={query.theme}>{legacyThemeTitle}</option> : null}{RESOURCE_THEMES.map((theme) => <option key={theme.id} value={theme.id}>{theme.title}</option>)}</select></label>
                  <label>Learning level<select name="level" defaultValue={query.level}><option value="">All levels and practical resources</option><option value="foundation">Foundation</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
                  <label>{hubText("formatLabel")}<select name="type" defaultValue={types.includes(query.type as ContentType) || (query.type === "podcast" && podcastAvailable) ? query.type : ""}><option value="">{hubText("allFormats")}</option>{types.map((type) => <option key={type} value={type}>{CONTENT_TYPE_LABEL[type]}</option>)}{podcastAvailable ? <option value="podcast">Podcast</option> : null}</select></label>
                </div>
              </details>
              {query.q || query.theme || query.type || query.level ? <Link className={preview.clearFilters} href="/learn">{hubText("clearLabel")}</Link> : null}
            </form>
            {query.theme === "structural" ? <aside className={styles.readingLinks}><h2>{hubText("readingTitle")}</h2><ul>{linkListValue(hub.values, "readingLinks").map((link) => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}</ul><p>{hubText("readingNote")}</p></aside> : null}
            {expanded ? <p role="status" className={styles.resultCount}>{totalFound} {hubText(totalFound === 1 ? "countSingular" : "countLabel")}</p> : null}
            {!totalFound ? <div><h2>{hubText("emptyTitle")}</h2><p>{hubText("emptyBody")}</p></div> : null}
          </EditableSurfaceRegion>
          <EditableSurfaceRegion surface={catalog}>{null}</EditableSurfaceRegion>
          {!filtered ? <section className={preview.startHere}><CoreFifteen /></section> : null}
          {!filtered ? <ResourceThemeNav basePath="/learn" className={preview.themeSection} gridClassName={preview.themeGrid} /> : null}
          {expanded && learning.length ? <section className={styles.section} aria-labelledby="modules-title">
            <div className={styles.sectionHeading}><h2 id="modules-title">{hub.available ? hubText("coursesTitle") : stringValue(copy, "modulesTitle")}</h2><span>{learning.length} to explore</span></div>
            {renderLearning(learning)}
          </section> : null}
          {!expanded && learning.length ? <p className={preview.browseAll}><Link href="/learn?browse=all#modules-title">Browse all {learning.length} courses and learning resources →</Link></p> : null}
          {expanded && hub.available && resources.length ? <section className={styles.section} aria-labelledby="hub-resources-title"><div className={styles.sectionHeading}><h2 id="hub-resources-title">{hubText("resourcesTitle")}</h2><span>{resources.length} resources</span></div><ul className={styles.resourceList}>{resources.map((item) => <li key={item.id} data-hub-resource={item.id}><span className={styles.resourceKind}>{CONTENT_TYPE_LABEL[item.type]}</span><h3><Link href={`/library/${item.id}`}>{item.title}</Link></h3><p>{shortSummary(item.summary)}</p><AuthorityPill authority={item.authority} />{owner ? <> <ResourceRemove contentItemId={item.id} title={item.title} compact /></> : null}</li>)}</ul></section> : null}
          {!expanded && hub.available && resources.length ? <p><Link href="/library?browse=all">Looking for a tool, a guide, or further reading? Browse all {resources.length} resources in the library →</Link></p> : null}
          {podcasts.length ? <Hub2More headingId="podcasts-title" title="Podcasts" open={filtered}><p>Listen in the audio library, where every episode comes with chapters and a full transcript.</p><ul className={styles.pathList}>{podcasts.map(({ podcast, surface: podcastSurface }) => <li key={podcast.id}><Link href={`/audio-library#podcast-${podcast.id}`}>{stringValue(podcastSurface.values, "title") || podcast.title}</Link></li>)}</ul></Hub2More> : null}
        </div>
        {!filtered ? <Hub2More headingId="series-title" title="Course series">
          <ul className={styles.pathList}>
            <li><Link href="/learn/collections">Collections</Link><p>All the learning on eight shelves named by subject, each opening with where to start. Leaders, supervisors, managers, and directors can start from <Link href="/leading">the decision in front of them</Link>.</p></li>
            {culturalIntelligenceAvailable && <li><Link href="/learn/cultural-intelligence">Cultural Intelligence collection</Link><p>Connect community context and intercultural learning with decisions in everyday work.</p></li>}
            <li><Link href="/learn/self-directed">One DSD Self-Directed Learning Series</Link><p>Seventy-two courses built around real service and workplace situations, with reflection and practice. Choose Foundation, Intermediate, or Advanced, and download editable slides to use with a team. Includes <Link href="/learn/self-directed?curriculum=policy">Equity in Policy and Legislative Practice</Link>.</p></li>
            <li><Link href="/learn/water-we-swim-in">The Water We Swim In</Link><p>Six short modules on Minnesota&apos;s mainstream culture: its strengths, its blind spots, and how it shapes our work.</p></li>
            <li><Link href="/learn/emotions-and-values">Emotions, Values, and Everyday Practice</Link><p>Four courses that connect emotional intelligence and cultural values with conversations, team decisions, and usable services.</p></li>
            <li><Link href="/learn/clas">National Culturally and Linguistically Appropriate Services Standards</Link><p>Explore cultural and language access learning, planning tools and supporting references together.</p></li>
            {collaborationCollection.length ? <li><Link href={collaborationHref()}>Teams and Cross-Collaboration</Link><p>Build trust within your team, connect work across the Disability Services Division and the Aging and Disability Services Administration, and strengthen relationships with partners.</p></li> : null}
            {courses.some(({pack}) => /^div-[fia]/.test(pack.course.id)) ? <li><Link href="/learn/diversity">Diversity courses</Link><p>Foundation, Intermediate, and Advanced courses on difference, assumptions, and belonging.</p></li> : null}
          </ul>
        </Hub2More> : null}
        {!filtered ? <Hub2More headingId="more-learning-title" title="Take it into your work">
          <p><Link href="/practice">Put learning into practice with the {graduationPaths.length} guided practices →</Link></p>
          {staffGuide ? <p><Link href={`/library/${staffGuide.id}`}>{staffGuide.title}</Link></p> : null}
        </Hub2More> : null}
        <div className={styles.context}><p><Link href="/learn/sources">Research and sources</Link> · <Link href="/ask">Ask</Link></p><details className={preview.disclosure}><summary>About these learning resources</summary><DhsReferenceLink /><ProgramContextNote /></details></div>
        {catalog.available ? <details className={styles.participation}><summary>{stringValue(catalog.values, "participationDetailsLabel")}</summary><ParticipationNotice surface="learning" /></details> : <ParticipationNotice surface="learning" />}
      </div>
    </EditableSurfaceRegion>
  );
}

