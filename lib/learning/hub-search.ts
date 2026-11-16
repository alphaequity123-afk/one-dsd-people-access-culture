import "server-only";
import { podcastMatchesTheme } from "@/lib/content/audio-organization";
import { courseContentItem, courseHref, courseSummary, publishedCourses } from "@/lib/content/courses/published";
import { getLearningTilePresentation } from "@/lib/content/learning-catalog";
import { selectHubItems } from "@/lib/content/learning-hub";
import { PODCASTS, podcastMatches } from "@/lib/content/podcasts";
import { prepareEditableSurface } from "@/lib/content/prepare-editable-surface";
import { SELF_DIRECTED_COURSES, selfDirectedHref, selfDirectedItems } from "@/lib/content/self-directed";
import { loadStaffContentSnapshot, type StaffProgramScope } from "@/lib/content/staff-publications";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { CONTENT_TYPE_LABEL, type ContentItem } from "@/lib/content/types";
import { WATER_RESOURCE_COLLECTION_TITLE } from "@/lib/learning/water-resource-collection";

export type HubSearchChoices = { q: string; theme: string; type: string; level: string };
export type HubTileItem = Pick<ContentItem, "id" | "title" | "summary" | "authority" | "type" | "tags">;
export type HubTile = { item: HubTileItem; href?: string; presentation?: { imageSrc: string; imageAlt: string; summary: string } };
export type HubResourceRow = { id: string; kind: string; title: string; summary: string; authority: ContentItem["authority"] };
export type HubSearchResult = { learning: HubTile[]; resources: HubResourceRow[]; podcasts: { id: string; title: string }[]; waterMatch: boolean; total: number; studyAvailable: boolean };

export function shortSummary(text: string, max = 160): string {
  if (text.length <= max) return text;
  const shortened = text.slice(0, max + 1);
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > max * 0.7 ? boundary : max).trimEnd()}…`;
}

/** Normalizes the learning level the way the Learn page reads it from a link. */
export function hubLevel(value: unknown): string {
  return typeof value === "string" && ["foundation", "foundations", "intermediate", "advanced"].includes(value.toLowerCase()) ? value.toLowerCase().replace(/^foundations$/, "foundation") : "";
}

/**
 * The Learn catalog search, the same selection the Learn page makes for a search: matching courses and
 * learning (with their tiles), practical resources, podcasts and the Water collection. Typed words are
 * used only to select; nothing is stored or logged.
 */
export async function learnHubSearch(choices: HubSearchChoices, scope: StaffProgramScope): Promise<HubSearchResult> {
  const query = { q: choices.q.trim().slice(0, 200), theme: choices.theme, type: choices.type, level: hubLevel(choices.level) };
  const [{ items: baseItems }, catalog, hub, podcastSurfaces, courses] = await Promise.all([
    loadStaffContentSnapshot({ scope }),
    prepareEditableSurface("learn.catalog", { scope }),
    prepareEditableSurface("learn.hub", { scope }),
    Promise.all(PODCASTS.map(podcast => prepareEditableSurface(podcast.surfaceId, { scope }))),
    publishedCourses(scope),
  ]);
  const courseById = new Map(courses.map(({ pack }) => [`course-${pack.course.id}`, pack]));
  const items = [...baseItems, ...selfDirectedItems(), ...courses.map(({ pack }) => courseContentItem(pack, { includeLessonBody: Boolean(query.q) }))];
  const selected = selectHubItems(items, hub.values, query);
  const learning = selected.filter(c => (c.type === "learning_module" || c.type === "scenario") && c.id !== "lm-how-this-program-works");
  const resources = selected.filter(c => c.type !== "learning_module" && c.type !== "scenario");
  const podcasts = PODCASTS.flatMap((podcast, index) => {
    const published = podcastSurfaces[index];
    return !query.level && published.available && podcastMatchesTheme(podcast.id, query.theme) && podcastMatches(podcast, { ...query, theme: "" }, stringValue(published.values, "title"), stringValue(published.values, "intro"))
      ? [{ id: podcast.id, title: stringValue(published.values, "title") || podcast.title }] : [];
  });
  const terms = query.q.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const waterMatch = terms.length > 0 && !query.theme && !query.level && (!query.type || query.type === "learning_module")
    && terms.every(term => WATER_RESOURCE_COLLECTION_TITLE.toLocaleLowerCase().includes(term));
  const tile = (item: ContentItem): HubTile => {
    const selfDirected = SELF_DIRECTED_COURSES.find(c => "self-directed-" + c.number === item.id);
    const pack = courseById.get(item.id);
    return {
      item: { id: item.id, title: item.title, summary: item.summary, authority: item.authority, type: item.type, tags: item.tags },
      href: selfDirectedHref(item.id) ?? (pack ? courseHref(pack.course.id) : undefined),
      presentation: selfDirected ? { imageSrc: selfDirected.cover, imageAlt: item.title, summary: item.summary }
        : pack ? { imageSrc: pack.course.coverImage, imageAlt: pack.course.coverAlt, summary: shortSummary(courseSummary(pack)) }
        : catalog.available ? getLearningTilePresentation(item.id, catalog.values) : undefined,
    };
  };
  return {
    learning: learning.map(tile),
    resources: resources.map(item => ({ id: item.id, kind: CONTENT_TYPE_LABEL[item.type], title: item.title, summary: shortSummary(item.summary), authority: item.authority })),
    podcasts,
    waterMatch,
    total: selected.length + podcasts.length + Number(waterMatch),
    studyAvailable: Boolean(process.env.GEMINI_API_KEY?.trim()),
  };
}
