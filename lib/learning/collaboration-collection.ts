import type { CoursePack } from "@/lib/content/courses/source-types";
import plan from "@/lib/content/courses/authored/deia-catalog/plan.json";
import { EXCLUDED_CATALOG_TOPICS } from "@/lib/content/courses/authored/deia-catalog/exclusions";

export const COLLABORATION_FOCUSES = [
  { id: "teams", title: "Strengthen your team", description: "Build trust, make room for different perspectives, and work through everyday decisions together.", example: "Start here when a meeting leaves some voices unheard, a new colleague needs a welcome, or your team wants to work through a disagreement." },
  { id: "cross-unit", title: "Work across DSD and ADSA", description: "Connect responsibilities, improve handoffs, and work through priorities shared by more than one team.", example: "Start here when work moves between units, a policy change needs several teams, or it is unclear who carries the next step." },
  { id: "partners", title: "Collaborate with partners", description: "Build useful partnerships with agencies, counties, providers, and communities, with a clear purpose and meaningful participation.", example: "Start here when partners are shaping a decision, a joint group needs direction, or people need to hear how their contributions were used." },
] as const;

export const COLLABORATION_LEVELS = [
  { id: "foundation", title: "Foundation", description: "Build understanding and a shared language." },
  { id: "intermediate", title: "Intermediate", description: "Work through situations and practice a response." },
  { id: "advanced", title: "Advanced", description: "Explore shared decisions and more complex responsibilities." },
] as const;

export type CollaborationFocus = typeof COLLABORATION_FOCUSES[number]["id"];
export type CollaborationLevel = typeof COLLABORATION_LEVELS[number]["id"];
export type CollaborationFilters = { focus?: CollaborationFocus; level?: CollaborationLevel };
type QueryValue = string | string[] | undefined;

export function normalizeCollaborationFilters(query: { focus?: QueryValue; level?: QueryValue }): CollaborationFilters {
  const focus = typeof query.focus === "string" ? query.focus : "";
  const level = typeof query.level === "string" ? query.level.toLowerCase().replace(/^foundations$/, "foundation") : "";
  return {
    focus: COLLABORATION_FOCUSES.find(item => item.id === focus)?.id,
    level: COLLABORATION_LEVELS.find(item => item.id === level)?.id,
  };
}

export function collaborationHref(filters: CollaborationFilters = {}): string {
  const query = new URLSearchParams();
  if (filters.focus) query.set("focus", filters.focus);
  if (filters.level) query.set("level", filters.level);
  return `/learn/collaboration${query.size ? `?${query.toString()}` : ""}`;
}

const excludedTopics = new Set(EXCLUDED_CATALOG_TOPICS);
const collectionPlan = plan.filter(row => row.series === "Team and collaboration" && !excludedTopics.has(row.topicId));

export type CollaborationCourse = {
  pack: CoursePack;
  topicId: string;
  category: string;
  focus: CollaborationFocus;
  level: CollaborationLevel;
};

/** The supplied published packs are authoritative. The plan only organizes those destinations. */
export function collaborationCourses(published: readonly CoursePack[], filters: CollaborationFilters = {}): CollaborationCourse[] {
  const byId = new Map(published.map(pack => [pack.course.id, pack]));
  return collectionPlan.flatMap(row => {
    const pack = byId.get(row.id);
    if (!pack) return [];
    const number = Number(row.topicId.slice(1));
    const focus: CollaborationFocus = number >= 71 && number <= 80 ? "cross-unit" : number >= 81 && number <= 90 ? "partners" : "teams";
    const level = COLLABORATION_LEVELS.find(item => item.id === row.level.toLowerCase().replace(/^foundations$/, "foundation"))?.id;
    if (!level || (filters.focus && focus !== filters.focus) || (filters.level && level !== filters.level)) return [];
    return [{ pack, topicId: row.topicId, category: row.category, focus, level }];
  });
}
