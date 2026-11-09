import type { CoursePack } from "./source-types";
import plan from "./authored/deia-catalog/plan.json";
import { catalogDisplayLabel } from "./authored/deia-catalog/display-labels";

/** Learning levels from the DSD People, Access and Culture Role Pathways and Learning Levels map; a description of depth, never a learner assessment or access gate. */
export const DEIA_CATALOG_LEVELS = [
  { id: "foundations", level: "Foundations", title: "Foundations", description: "Builds shared language, awareness, and basic practices. Nothing needs to come first; anyone can start here." },
  { id: "intermediate", level: "Intermediate", title: "Intermediate", description: "Applies concepts to real DSD situations through practice, tools, and scenarios. Builds on Foundations in the same area." },
  { id: "advanced", level: "Advanced", title: "Advanced", description: "Leads, designs, coaches, or changes systems and practices. Builds on Intermediate skills in the same area." },
] as const;

/** The four catalogs the topics come from, in catalog order. */
export const DEIA_CATALOG_SERIES = [
  { id: "leader", series: "Leader DEIA", title: "Leadership" },
  { id: "staff", series: "Staff DEIA", title: "For all staff" },
  { id: "team", series: "Team and collaboration", title: "Teams and collaboration" },
  { id: "intercultural", series: "Intercultural", title: "Intercultural learning" },
] as const;

const PLAN_BY_ID = new Map(plan.map(row => [row.id, row]));

export function isDeiaCatalogCourse(id: string): boolean {
  return PLAN_BY_ID.has(id);
}

/** Published People, Access and Culture catalog courses grouped by level, then source series, then topic group, in plan order. */
export function groupDeiaCatalogCourses(published: readonly CoursePack[]) {
  const catalog = published.filter(pack => PLAN_BY_ID.has(pack.course.id)).sort((a, b) => a.course.indexNumber - b.course.indexNumber);
  return DEIA_CATALOG_LEVELS.map(level => {
    const courses = catalog.filter(pack => PLAN_BY_ID.get(pack.course.id)?.level === level.level);
    return {
      ...level,
      courses,
      series: DEIA_CATALOG_SERIES.map(series => {
        const seriesCourses = courses.filter(pack => PLAN_BY_ID.get(pack.course.id)?.series === series.series);
        const categories = [...new Set(seriesCourses.map(pack => PLAN_BY_ID.get(pack.course.id)!.category))];
        return { ...series, courses: seriesCourses, categories: categories.map(category => ({ category: catalogDisplayLabel(category), courses: seriesCourses.filter(pack => PLAN_BY_ID.get(pack.course.id)?.category === category) })) };
      }).filter(series => series.courses.length),
    };
  });
}
