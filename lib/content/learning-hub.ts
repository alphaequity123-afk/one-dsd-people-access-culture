import { matchesResourceTheme, matchesResourceLevel } from './resource-organization';
import courseMemberships from "./courses/theme-memberships.json";
import { defineEditableSurface, type EditableSurfaceFieldDefinition, type EditableSurfaceValues } from "./editable-surface-contract";
import type { ContentItem } from "./types";

export const HUB_THEMES = [
  { id: "culture", title: "Workplace culture and well-being", intro: "Participation, psychological safety, and the everyday conditions that help people thrive at work.", ids: ["podcast.anti-racism-public-service", "lm-workplace-climate", "ja-climate-action-plan", "pn-when-to-escalate"], noteTitle: "Amplify Equity", note: "A voluntary space for conversation, cultural celebrations, and shared experiences. Topics can include equity, workplace stress, and well-being. Staff perspectives can help the Equity and Inclusion Operations Consultant understand what needs attention." },
  { id: "intercultural", title: "Intercultural practice", intro: "Understanding differences without making assumptions about the person in front of us.", ids: ["lm-interpreter", "pn-intercultural-method", "ext-clas", "ja-language-access-checklist"], noteTitle: "A moment to consider", note: "What might you learn by asking someone how they prefer to communicate, rather than assuming that a familiar approach will work for them?" },
  { id: "access", title: "Accessibility and responsive services", intro: "Language, communication, and service design that make participation possible.", ids: ["lm-interpreter", "ext-clas", "ext-ada", "ext-title-vi-lep", "ext-mn-accessibility", "ja-language-access-checklist", "ja-plain-language", "ja-access-checks", "ja-process-burden", "ja-form-notice-change"], noteTitle: "Consider the experience", note: "A form may be accurate and still be difficult to use. What would help someone understand it, complete it, and get the service they need?" },
  { id: "structural", title: "Fair access and how systems work", intro: "History, institutional practices, and the decisions that shape access and opportunity.", ids: ["podcast.equity-toolkit", "podcast.anti-racism-public-service", "ext-dhs-equity-toolkit", "pn-equity-in-practice", "ja-equity-impact-questions", "ja-process-burden", "pn-embed-early", "ja-launch-embed-checklist"], noteTitle: "From understanding to change", note: "A rule can be applied consistently and still place a greater burden on some people. What evidence would help us understand its effects, and what could change?" },
  { id: "partnership", title: "Community partnership and planning", intro: "Shared decisions, lived experience, and relationships that shape better services.", ids: ["podcast.equity-toolkit", "pn-partnership-spine", "ja-stakeholder-map", "pn-embed-early", "ext-dhs-equity-toolkit", "pn-intercultural-method", "pn-self-check"], noteTitle: "Whose perspective is missing?", note: "People affected by a decision may notice barriers that are easy to miss from inside an organization. Their involvement can change both the question and the solution." },
  { id: "facilitation", title: "Learning together", intro: "Accessible conversations and learning experiences that carry into everyday practice.", ids: ["lm-facilitation-application", "ja-facilitation-session-plan", "ja-access-checks", "lm-workplace-climate"], noteTitle: "Beyond the session", note: "After a lunch and learn, what would help people use an idea in their work? Time to practice and a later conversation can help learning continue." },
] as const;

const wording = {
  title: "Learn", intro: "Courses, readings, and recordings that build the knowledge behind fair, accessible services and inclusive workplaces. Start with the Core 15, follow a series, or search the whole collection.",
  searchLabel: "Search learning and resources", searchButton: "Search", themeLabel: "Explore by theme", allLabel: "All themes", formatLabel: "Format", allFormats: "All formats", clearLabel: "Clear filters", coursesTitle: "Learning modules", resourcesTitle: "Tools, guidance, and further reading", emptyTitle: "No matching resources", emptyBody: "Try another word or explore all themes.", countLabel: "resources found", countSingular: "resource found", readingTitle: "Watch and read", readingNote: "The PBS conversation includes captions and a transcript.",
};
const fields: EditableSurfaceFieldDefinition[] = Object.keys(wording).map((key) => ({ key, label: key.replace(/([A-Z])/g, " $1"), kind: "long", required: true, maxLength: 1000 }));
const approvedValues: EditableSurfaceValues = { ...wording, readingLinks: [
  { label: "Tim Wise — Minds That Matter on PBS", href: "https://www.pbs.org/video/minds-that-matter-tim-wise-myglub/" },
  { label: "White Fragility by Robin DiAngelo — about the book", href: "https://www.beacon.org/White-Fragility-P1672.aspx" },
] };
fields.push({ key: "readingLinks", label: "Reading and video links", kind: "link-list", required: false });
for (const theme of HUB_THEMES) {
  for (const [suffix, value] of Object.entries({ Title: theme.title, Intro: theme.intro, NoteTitle: theme.noteTitle, Note: theme.note, Ids: [...theme.ids, ...courseMemberships[theme.id]] })) {
    const key = `${theme.id}${suffix}`;
    fields.push({ key, label: `${theme.title}: ${suffix}`, kind: suffix === "Ids" ? "string-list" : "long", required: suffix === "Title", maxItems: 500 });
    approvedValues[key] = value;
  }
}
export const LEARNING_HUB_SURFACE = defineEditableSurface({ surfaceId: "learn.hub", label: "Learning and resource themes", route: "/learn", scopePolicy: "inheritable", fields, approvedValues });

/** Resolve many-to-many membership against the caller's scoped, published collection. */
export function selectHubItems(items: readonly ContentItem[], values: EditableSurfaceValues, options: { theme?: string; level?: string; q?: string; type?: string } = {}): ContentItem[] {
  // Published curator additions remain discoverable alongside the reviewed taxonomy.
  // Old workplace-culture choices belong under workforce; old intercultural choices
  // belong under identity. Legacy URLs continue to use their own saved membership.
  const membershipKeys = options.theme === "identity" ? ["identity", "intercultural"] : options.theme === "workforce" ? ["workforce", "culture"] : [options.theme ?? ""];
  const curatedIds = new Set(membershipKeys.flatMap(key => Array.isArray(values[key+"Ids"]) ? (values[key+"Ids"] as unknown[]).filter((id): id is string => typeof id === "string") : []));
  const terms = (options.q ?? "").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = items.filter((item) => {
    if (item.status !== "approved") return false;
    if (options.theme && !matchesResourceTheme(item, options.theme) && !curatedIds.has(item.id)) return false;
    if (options.level && !matchesResourceLevel(item, options.level)) return false;
    if (options.type && item.type !== options.type) return false;
    const text = [item.title, item.summary, ...item.body, ...item.tags].join(" ").toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
  const phrase = (options.q ?? "").trim().toLocaleLowerCase();
  const titleRank = (item: ContentItem) => { const title = item.title.toLocaleLowerCase(); return title === phrase ? 3 : title.startsWith(phrase) ? 2 : title.includes(phrase) ? 1 : 0; };
  return phrase ? matches.sort((a,b) => titleRank(b)-titleRank(a)) : matches;
}
