/**
 * Grounding for guided practice in the leadership-styles pathway: the practice
 * rubric, the capstone analysis or the scenario families, and short summaries of
 * the style lessons they draw on. Titles and short text only, capped like the
 * curriculum grounding. Nothing here is about a person.
 */
import {
  CAPSTONE, COMMON_SCENARIO, LEADERSHIP_PATHWAY_HREF, LEADERSHIP_PATHWAY_PAGES, LEADERSHIP_SCENARIO_FAMILIES,
  LEADERSHIP_STYLE_LESSONS, RUBRIC, leadershipStyleHref,
} from "@/lib/content/leadership-styles-pathway";
import { LEADERSHIP_CAPSTONE_LESSON_ID, LEADERSHIP_SCENARIO_LESSON_ID } from "./leadership-items";

type Link = { title: string; href: string };
type Section = { title: string; body: string };

function words(text: string): number { return text.split(/\s+/).filter(Boolean).length; }
function clip(text: string, max: number): string {
  const parts = text.split(/\s+/).filter(Boolean);
  return parts.length <= max ? parts.join(" ") : parts.slice(0, max).join(" ") + " …";
}

export function leadershipGrounding(lessonId: string, cap: number): { text: string; links: Link[] } | null {
  if (lessonId !== LEADERSHIP_CAPSTONE_LESSON_ID && lessonId !== LEADERSHIP_SCENARIO_LESSON_ID) return null;
  const rubric: Section = {
    title: "Practice rubric (scores responses, never people)",
    body: RUBRIC.criteria.map((c, n) => `${n + 1}. ${c.title}. Stronger: ${c.strong} Weaker: ${c.weak}`).join(" "),
  };
  const sections: Section[] = [rubric];
  const links: Link[] = [{ title: "The eight-point practice rubric", href: `${LEADERSHIP_PATHWAY_PAGES.capstone.href}#rubric` }];
  if (lessonId === LEADERSHIP_CAPSTONE_LESSON_ID) {
    sections.push({ title: `Common scenario: ${COMMON_SCENARIO.title}`, body: [...COMMON_SCENARIO.situation, "The leader must address:", ...COMMON_SCENARIO.matters].join(" ") });
    sections.push({ title: "Capstone worked analysis", body: CAPSTONE.analysis.map(item => `${item.title}: ${item.body}`).join(" ") });
    links.push({ title: "Capstone: rewrite the response", href: `${LEADERSHIP_PATHWAY_PAGES.capstone.href}#worked-analysis` });
    links.push({ title: "The common scenario", href: `${LEADERSHIP_PATHWAY_HREF}#common-scenario` });
    for (const slug of ["ethical", "inclusive", "directive", "participative"]) {
      const lesson = LEADERSHIP_STYLE_LESSONS.find(entry => entry.slug === slug)!;
      sections.push({ title: `Lesson: ${lesson.name}`, body: `${lesson.definition.join(" ")} Stronger response: ${lesson.stronger.why}` });
      links.push({ title: lesson.name, href: leadershipStyleHref(slug) });
    }
  } else {
    for (const family of LEADERSHIP_SCENARIO_FAMILIES) {
      sections.push({ title: `Scenario: ${family.title} (${family.family})`, body: [family.formal, "A combined response:", ...family.combination].join(" ") });
      links.push({ title: `Scenario: ${family.title}`, href: `${LEADERSHIP_PATHWAY_PAGES.scenarios.href}#scenario-${family.id}` });
    }
  }
  const out: string[] = [];
  let used = 0;
  for (const section of sections) {
    const remaining = cap - used;
    if (remaining <= 20) break;
    const block = `## ${section.title}\n${clip(section.body, remaining - words(section.title))}`;
    out.push(block);
    used += words(block);
  }
  return { text: out.join("\n\n"), links };
}
