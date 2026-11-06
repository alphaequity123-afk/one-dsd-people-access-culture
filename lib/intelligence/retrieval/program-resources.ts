import { withReviewedHistoricalSurface } from "@/lib/content/courses/historical-course-editorial";
import historicalEditorialData from "@/lib/content/courses/historical-course-editorial.json";
import readingCollection from "@/lib/content/reading-collection.json";
import "server-only";
import type { CoursePack } from "@/lib/content/courses/source-types";
import { createHash } from "node:crypto";
import { communityDesignEntries, communityReading } from "@/lib/content/community-design";
import { loadPublishedEditableSurfaces } from "@/lib/content/editable-surfaces";
import { EDITABLE_SURFACE_REGISTRY, getEditableSurfaceDefinition } from "@/lib/content/staff-surface-registry";
import { loadStaffContentSnapshot, type StaffProgramScope } from "@/lib/content/staff-publications";
import { MEASUREMENT_RESOURCE_ID } from "@/lib/content/measurement-practice";
import type { Doc } from "./search";
import { searchDocs, tokens } from "./search";
import { communityProfileDocs, communityResearchDocs, culturalCalendarDocs, curriculumDocs, selfDirectedCurriculumDocs, waterCourseDocs } from "./brain-content";
import { publishedPodcastReadings } from "./podcast-reading";
import { developmentModel, journeyHref } from "@/lib/program/development";
import equityGoals from "@/lib/program/equity-goals.json";
import { CULTURAL_INTELLIGENCE_SURFACE_ID } from "@/lib/content/cultural-intelligence-hub";
import { dynamicPublicRouteDocs } from "./dynamic-public-route-docs";
import { practicePathSearchValues } from "./public-practice-path-search";
import { publicRouteDocs } from "./public-route-docs";
import { publicCourseMediaDocs } from "./public-course-media-docs";
import { publicExplainerMediaDocs } from "./public-explainer-media-docs";
import { publicPracticeDocs } from "./public-practice-docs";
import { directorToolkitDocs } from "./director-toolkit-docs";
import { leadershipStylesPathwayDocs } from "./leadership-styles-pathway-docs";
import { equityDataDocs } from "./equity-data-docs";
import { countyAgencyDocs, officialProviderDocs, organizationDocs, policyDocs, sourcingDocs, systemConnectionDocs } from "./organization-docs";
import { culturalIntelligenceSearchValues, leadershipLearningDocs, learningNavigationDocs, publishedLeadershipVideoDocs, themeCollectionDocs, programFrameworkDocs, additionalPublicRouteDocs } from "./public-learning-docs";

/** Public page definitions only. No owner workspace, draft, intake, or source archive. */
export function programResourceDefinitions() {
  const readings = communityDesignEntries().flatMap(entry => {
    const definition = getEditableSurfaceDefinition(`community-reading.${entry.id}`);
    return definition ? [definition] : [];
  });
  return [...EDITABLE_SURFACE_REGISTRY, ...readings].filter(definition =>
    definition.route.startsWith("/") && !definition.route.includes("[") &&
    !definition.route.startsWith("/consultant") &&
    !definition.route.startsWith("/contribute") &&
    !["/support/request", "/support/track"].includes(definition.route) &&
    !["site.header", "site.context", "ask.page"].includes(definition.surfaceId));
}

function visibleText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(visibleText).join(" ");
  if (value && typeof value === "object") return Object.entries(value)
    .filter(([key]) => !["href", "type", "level"].includes(key)).map(([, child]) => visibleText(child)).join(" ");
  return "";
}

/** Stable opaque IDs for newer public projections. The durable audit schema
 * already permits asset IDs; no audit allowlist or privacy filter is widened. */
export function publicProjectionAuditId(id: string): string {
  // Never conceal a profile-like ID behind a hash; the existing audit boundary rejects it.
  if (/(?:employee|worker|personnel)[-_]?\d{1,12}.*(?:belief|ideolog|equity|readiness|bias|inclusion|participation|engagement)|(?:belief|ideolog|equity|readiness|bias|inclusion|participation|engagement).*(?:employee|worker|personnel)[-_]?\d{1,12}/i.test(id)) return id;
  if (!/^(?:program-learning-|program-charter-|program-model-stage-|program-action-|leadership-|collection-|collections-|staff-collection-|operationalizing-|toolkit-example-|public-|learning-lesson-)/.test(id)) return id;
  return `asset-${createHash("sha256").update(`public-projection:${id}`).digest("hex").slice(0, 32)}`;
}

type ProgramIndex = { communityDocs: Doc[]; destinations: Doc[] };
const currentIndexes = new Map<StaffProgramScope, { key: string; index: ProgramIndex }>();

export async function indexedProgramResources(scope: StaffProgramScope): Promise<ProgramIndex> {
  const definitions = programResourceDefinitions();
  const sourcePublications = await loadPublishedEditableSurfaces(definitions.map(d => d.surfaceId), scope);
  // The practice shell has a parameterized route and is intentionally absent
  // from destination documents, but its publication still gates path media.
  const pathShellPublications = await loadPublishedEditableSurfaces(["practice.path-shell"], scope);
  const editorialFingerprint = createHash("sha256").update(JSON.stringify(historicalEditorialData)).digest("hex");
  const publications = sourcePublications.map(row => {
    const reviewed = withReviewedHistoricalSurface(row.surfaceId, row.values);
    // The public page hides retired fields and replaces old book-centered copy.
    // Search must index exactly that visible projection, not the stored legacy
    // publication, which remains preserved for owner/editor compatibility.
    const values = row.surfaceId === CULTURAL_INTELLIGENCE_SURFACE_ID
      ? culturalIntelligenceSearchValues(reviewed)
      : practicePathSearchValues(row.surfaceId, reviewed) ?? reviewed;
    const evidence = [{ sourceId: row.surfaceId, revisionId: row.revisionId, payloadHash: createHash("sha256").update(JSON.stringify(row.document)).digest("hex"), scope: row.sourceScope }];
    // Keep the stored source revision and separately identify the exact authored presentation.
    // No stored publication is rewritten or presented as the sole source of revised wording.
    if (JSON.stringify(values) !== JSON.stringify(row.values)) evidence.push({ sourceId: `authored-review-20261024:${row.surfaceId}`, revisionId: null, payloadHash: createHash("sha256").update(JSON.stringify({ editorialFingerprint, values })).digest("hex"), scope: row.sourceScope });
    return { ...row, values, editorialEvidence: evidence, renderedFingerprint: createHash("sha256").update(JSON.stringify(values)).digest("hex") };
  });
  const podcastReadings = publishedPodcastReadings(publications);
  const measurementAvailable = publications.some(row => row.surfaceId === "practice.measurement")
    && (await loadStaffContentSnapshot({ scope })).items.some(item => item.id === MEASUREMENT_RESOURCE_ID);
  const publishedIds = new Set([...publications, ...pathShellPublications].map(p => p.surfaceId));
  // Published public video transcripts can change on the volume between app
  // deployments. Read their current verified manifest state before cache reuse.
  const leadershipVideos = await publishedLeadershipVideoDocs(scope, publishedIds);
  // Always check current scoped publications first. Reuse text processing only while
  // the same immutable revisions remain published; withdrawals change this key.
  const key = publications.map(p => `${p.surfaceId}:${p.source}:${p.sourceScope}:${p.revisionId}`).sort().join("|") + "|measurement-source:" + measurementAvailable + "|podcast-readings:" + [...podcastReadings.values()].map(reading => reading.fingerprint).sort().join("|") + "|development:" + createHash("sha256").update(JSON.stringify(developmentModel)).digest("hex");
  const scopedKey = key + "|path-shell:" + createHash("sha256").update(JSON.stringify(pathShellPublications)).digest("hex") + "|reviewed-editorial:" + editorialFingerprint + "|rendered-publications:" + publications.map(row => `${row.surfaceId}:${row.renderedFingerprint}`).sort().join("|") + "|equity-goals:" + createHash("sha256").update(JSON.stringify(equityGoals)).digest("hex") + "|leadership-videos:" + createHash("sha256").update(JSON.stringify(leadershipVideos)).digest("hex");
  const cached = currentIndexes.get(scope);
  if (cached?.key === scopedKey) return cached.index;
  const grouped = new Map<string, typeof publications>();
  for (const publication of publications) {
    const definition = getEditableSurfaceDefinition(publication.surfaceId)!;
    // About owns this anchor: the child publication cannot keep a withdrawn page link alive.
    if (publication.surfaceId === "equity.practice" && !publishedIds.has("about.page")) continue;
    if (publication.surfaceId === "practice.measurement" && (!measurementAvailable || !publishedIds.has("practice.page"))) continue;
    // Community pages require BOTH the brief and recovered reading where defined.
    if (definition.route.startsWith("/minnesota-communities/")) {
      const id = definition.route.split("/").pop()!;
      if (communityReading(id) && !publishedIds.has(`community-reading.${id}`)) continue;
      if (getEditableSurfaceDefinition(`community-brief.${id}`) && !publishedIds.has(`community-brief.${id}`)) continue;
    }
    grouped.set(definition.route, [...(grouped.get(definition.route) ?? []), publication]);
  }
  const destinations: Doc[] = [...grouped].map(([href, rows]) => {
    const first = rows.find(row => typeof row.values.title === "string") ?? rows[0];
    const definition = getEditableSurfaceDefinition(first.surfaceId)!;
    const community = href.startsWith("/minnesota-communities/");
    const coursePack = first.surfaceId.startsWith("course.") ? (first.values.pack as CoursePack) : undefined;
    const title = String(coursePack?.course.title ?? first.values.title ?? first.values.heading ?? definition.label);
    const summary = coursePack?.course.subtitle || rows.map(row => visibleText(row.values.intro ?? row.values.lede ?? row.values.summary ?? "")).filter(Boolean).join(" ") || title;
    // Lessons are separately searchable; avoid indexing the same full course twice.
    const text = coursePack ? visibleText({ ...coursePack, course: { ...coursePack.course, lessons: coursePack.course.lessons.map(lesson => ({ title: lesson.title, summary: lesson.summary })) } }) : rows.map(row => visibleText(row.values)).join(" ");
    const readingSupport = rows.flatMap(row => { const reading = podcastReadings.get(row.surfaceId); return reading ? [reading] : []; });
    const goalSupport = rows.some(row => row.surfaceId === "equity-toolkit.home")
      ? ["Six ADSA equity goals. Manager and supervisor three-goal work plan. One DSD Team. Staff apply the required policy and toolkit themselves with equity professional support.", ...equityGoals.goals.map(goal => [goal.title, goal.summary, goal.example, goal.antiRacism, ...goal.questions].join(" "))].join("\n") : "";
    return {
      kind: community ? "brief" : "content", id: community ? `asset-community-${href.split("/").pop()!}` : `asset-program-${createHash("sha256").update(href).digest("hex").slice(0, 24)}`,
      title, href, authority: coursePack ? "learning" : community ? "community_brief" : "practice_note", type: community ? "community_brief" : "program_destination",
      status: "approved", reviewDate: "", scope: scope === "dsd" ? "dsd" : "agencywide",
      evidenceRevisions: [...rows.flatMap(row => row.editorialEvidence), ...readingSupport.map(reading => reading.evidence)],
      graphRelated: href.startsWith("/one-dsd/programs/") || href.startsWith("/one-dsd/scenarios/") ? ["/one-dsd"] : ["/one-dsd/amplify/ideas", "/one-dsd/amplify/materials", "/one-dsd/amplify/gatherings", "/one-dsd/amplify/co-leads"].includes(href) ? ["/one-dsd/amplify"] : href === "/learn/sources" || href === "/my-work/explore" ? ["/learn"] : /^\/areas\/[^/]+$/.test(href) ? ["/areas"] : [],
      summary: [summary, ...readingSupport.map(reading => reading.summary)].join(" "), text: [`${title} ${text}`, goalSupport, ...readingSupport.map(reading => reading.text)].join("\n"), tags: [title, href.replaceAll("/", " "), ...readingSupport.flatMap(reading => reading.tags)], intents: community ? ["intercultural", "access_barriers"] : [],
    };
  });
  const lessonDocs: Doc[] = publications.flatMap(row => {
    if (!row.surfaceId.startsWith("course.")) return [];
    const pack = row.values.pack as CoursePack;
    return pack.course.lessons.map(lesson => ({
      kind:"content" as const,id:`asset-lesson-${createHash("sha256").update(pack.course.id+":"+lesson.id).digest("hex").slice(0,24)}`,
      title:`${pack.course.title}: ${lesson.title}`,href:`/courses/${pack.course.id}/${lesson.id}`,authority:"learning" as const,type:"course_lesson",
      evidenceRevisions:row.editorialEvidence,
      status:"approved",reviewDate:"",scope:scope === "dsd" ? "dsd":"agencywide",summary:lesson.summary,text:visibleText(lesson),tags:[pack.course.title,lesson.title],intents:[],
    }));
  });
  destinations.push(...lessonDocs);
  // These owner-approved public routes are code-defined and contain no participant data.
  destinations.push(...developmentModel.journeys.map(journey => ({
    kind: "content" as const, id: `program-development-${journey.id}`,
    title: journey.title, href: journeyHref(journey.id), authority: "learning" as const,
    type: "program_destination", status: "approved", reviewDate: "",
    scope: scope === "dsd" ? "dsd" : "agencywide", summary: journey.summary,
    text: [journey.title, journey.summary, journey.question, journey.assumption, journey.practice, journey.application, journey.reflection, journey.social].join("\n"),
    graphRelated: ["/learn/paths"], tags: ["guided pathway", "equity in practice", ...journey.themes], intents: ["practice_method" as const, "next_actions" as const],
    // Code-defined content has no stored revision; the payload hash pins the exact journey text.
    evidenceRevisions: [{ sourceId: `program-development-${journey.id}`, revisionId: null, payloadHash: createHash("sha256").update(JSON.stringify(journey)).digest("hex"), scope }],
  })));
  destinations.push({ kind: "content", id: "program-learning-paths-hub", title: "Learning paths", href: "/learn/paths",
    authority: "learning", type: "learning_navigation", status: "approved", reviewDate: "", scope: scope === "dsd" ? "dsd" : "agencywide",
    summary: developmentModel.direction, text: [developmentModel.direction, ...developmentModel.journeys.map(journey => `${journey.title}: ${journey.question}`)].join("\n"),
    tags: ["learning", "guided pathway"], intents: [], graphRelated: developmentModel.journeys.map(journey => journeyHref(journey.id)),
    evidenceRevisions: [{ sourceId: "program-learning-paths-hub", revisionId: null, payloadHash: createHash("sha256").update(JSON.stringify(developmentModel.journeys)).digest("hex"), scope }] });
  // The reading collection: published books whose notes connect to the program's work. Code-defined, no participant data.
  destinations.push(...readingCollection.map(book => ({
    kind: "content" as const, id: `program-reading-${book.id}`,
    title: book.title, href: `/learn/readings/${book.id}`, authority: "learning" as const,
    type: "reading", status: "approved", reviewDate: "",
    scope: scope === "dsd" ? "dsd" : "agencywide", summary: book.overview[0] ?? book.title,
    text: [book.title, book.authors, ...book.overview, ...book.mainPoints, ...book.relevance, ...book.questions].join("\n"),
    tags: ["book", "reading notes", ...book.themes], intents: [],
    evidenceRevisions: [{ sourceId: `program-reading-${book.id}`, revisionId: null, payloadHash: createHash("sha256").update(JSON.stringify(book)).digest("hex"), scope }],
  })));
  // Public code-defined additions are indexed only while their parent surface
  // is published. Theme descriptions are public and context links are gated.
  destinations.push(...leadershipLearningDocs(scope, publishedIds), ...leadershipVideos, ...themeCollectionDocs(scope, publishedIds), ...learningNavigationDocs(scope, publishedIds), ...programFrameworkDocs(scope), ...publicPracticeDocs(scope), ...publicRouteDocs(scope), ...additionalPublicRouteDocs(scope, publishedIds), ...dynamicPublicRouteDocs(scope, publications));
  // Code-defined public pages: the Equity Director toolkit and the leadership styles pathway, one document per anchored passage.
  // Aggregate equity baseline figures, one document per measure and year, citing the leaders dashboard.
  destinations.push(...directorToolkitDocs(scope), ...leadershipStylesPathwayDocs(scope), ...equityDataDocs(scope), ...organizationDocs(scope), ...countyAgencyDocs(scope), ...sourcingDocs(scope), ...systemConnectionDocs(scope), ...officialProviderDocs(scope), ...policyDocs(scope));
  const communityDocs = destinations.filter(d => d.kind === "brief");
  // Everything readable on the site belongs in the search. A failure here is visible and leaves the rest working.
  try {
    const currentCourses = publications.flatMap(row => {
      if (!row.surfaceId.startsWith("course.")) return [];
      const pack = row.values.pack as CoursePack;
      if (!pack?.course || !Array.isArray(pack.course.lessons)) return [];
      return [{ id: pack.course.id, title: pack.course.title, lessons: pack.course.lessons.map(lesson => ({ id: lesson.id, blockCount: lesson.blocks.length, hasScenario: Boolean(lesson.scenario) })) }];
    });
    const activeSelfDirected = new Set(selfDirectedCurriculumDocs(scope).flatMap(doc => {
      const id = new URL(doc.href, "https://local.invalid").searchParams.get("course");
      return id ? [id] : [];
    }));
    destinations.push(...communityResearchDocs(scope, communityDocs), ...communityProfileDocs(scope, communityDocs), ...culturalCalendarDocs(scope, communityDocs), ...waterCourseDocs(scope), ...curriculumDocs(scope, publishedIds), ...publicCourseMediaDocs(scope, currentCourses, activeSelfDirected), ...publicExplainerMediaDocs(scope, publishedIds));
  } catch (error) {
    console.error("ask_brain_content_unavailable", error instanceof Error ? error.message : "unknown");
  }
  const index = { communityDocs, destinations: destinations.map(doc => ({ ...doc, id: publicProjectionAuditId(doc.id) })) };
  currentIndexes.set(scope, { key: scopedKey, index });
  return index;
}

/** Exact named resources must not get crowded out by broad topical matches. */
export function programResourceLinks(question: string, docs: Doc[], limit = 5): Array<{ label: string; href: string }> {
  const query = new Set(tokens(question));
  const seen = new Set<string>();
  const unique = docs.filter(doc => {
    if (seen.has(doc.href)) return false;
    seen.add(doc.href);
    return true;
  });
  const ranked = searchDocs(question, unique, { limit: unique.length });
  ranked.sort((a, b) => {
    const named = (title: string, href: string) => { const words = tokens(title); const slug = href.startsWith("/minnesota-communities/") ? tokens(href.split("/").pop()!.replaceAll("-", " ")) : []; return (words.length > 0 && words.every(word => query.has(word))) || (slug.length > 0 && slug.every(word => query.has(word))) ? 1 : 0; };
    return named(b.title, b.href) - named(a.title, a.href) || b.score - a.score;
  });
  return ranked.slice(0, limit).map(hit => ({ label: `Open ${hit.title}`, href: hit.href }));
}

