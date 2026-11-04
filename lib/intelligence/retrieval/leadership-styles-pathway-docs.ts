import "server-only";
import { createHash } from "node:crypto";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import {
  CAPSTONE, COMMON_SCENARIO, CONDUCIVE_GROUPS, CONDUCIVE_SUMMARY, FOUNDATIONS, LEADERSHIP_PATHWAY_HREF, LEADERSHIP_PATHWAY_PAGES,
  LEADERSHIP_PATHWAY_TITLE, LEADERSHIP_SCENARIO_FAMILIES, LEADERSHIP_STYLE_LESSONS, LIFECYCLE, PATHWAY_AUTHORITY, PATHWAY_BOUNDARY,
  PATHWAY_INTRO, RACE_SECTION, RUBRIC, STYLE_GROUP_LABEL, leadershipStyle, leadershipStyleHref, type StyleLesson,
} from "@/lib/content/leadership-styles-pathway";
import type { Doc } from "./search";

/**
 * Ask documents for the leadership-styles pathway. Public, code-defined teaching
 * content only. Each document points at its own page section (a distinct href
 * with an anchor), so an answer cites the passage it came from. Ids start with
 * "leadership-" so the public projection maps them to opaque audit ids.
 */
const PAGES = [LEADERSHIP_PATHWAY_HREF, ...Object.values(LEADERSHIP_PATHWAY_PAGES).map(page => page.href)];
const name = (slug: string) => leadershipStyle(slug)?.name ?? slug;

export function leadershipStylesPathwayDocs(scope: StaffProgramScope): Doc[] {
  const make = (id: string, title: string, href: string, summary: string, lines: readonly string[], tags: readonly string[], related: readonly string[] = PAGES): Doc => {
    const text = lines.filter(Boolean).join("\n");
    return {
      kind: "content", id, title, href, authority: "learning", type: "leadership_pathway", status: "approved", reviewDate: "",
      scope: scope === "dsd" ? "dsd" : "agencywide", summary, text,
      tags: ["leadership", "leadership styles", "conflict", "equity", "inclusion", ...tags], intents: [],
      graphRelated: [...new Set(related.filter(page => page !== href.split("#")[0]))],
      evidenceRevisions: [{ sourceId: id, revisionId: null, payloadHash: createHash("sha256").update(JSON.stringify({ title, href, text })).digest("hex"), scope }],
    };
  };

  const docs: Doc[] = [
    make("leadership-pathway-overview", LEADERSHIP_PATHWAY_TITLE, `${LEADERSHIP_PATHWAY_HREF}#about`, PATHWAY_INTRO[0],
      [LEADERSHIP_PATHWAY_TITLE, ...PATHWAY_INTRO, ...PATHWAY_AUTHORITY.map(item => `${item.label}: ${item.body}`), PATHWAY_BOUNDARY,
        `The pathway has ${LEADERSHIP_STYLE_LESSONS.length} lessons: ${LEADERSHIP_STYLE_LESSONS.map(lesson => lesson.name).join(", ")}.`],
      ["leadership development", "pathway"]),
    make("leadership-pathway-foundations", "Foundations: leadership style, conflict response, equity and inclusion", `${LEADERSHIP_PATHWAY_HREF}#foundations`, FOUNDATIONS.styleVsConflict.body[0],
      [FOUNDATIONS.styleVsConflict.title, ...FOUNDATIONS.styleVsConflict.body, ...FOUNDATIONS.styleVsConflict.questions,
        FOUNDATIONS.situations.title, FOUNDATIONS.situations.intro, ...FOUNDATIONS.situations.rows.map(row => `${row.situation}: ${row.responsibility}`), FOUNDATIONS.situations.closing,
        FOUNDATIONS.equityInclusion.title, ...FOUNDATIONS.equityInclusion.body],
      ["conflict response", "mediation", "formal process", "discrimination", "retaliation", "accessibility"]),
    make("leadership-pathway-common-scenario", `Common leadership scenario: ${COMMON_SCENARIO.title}`, `${LEADERSHIP_PATHWAY_HREF}#common-scenario`, COMMON_SCENARIO.situation[0],
      [COMMON_SCENARIO.title, COMMON_SCENARIO.intro, ...COMMON_SCENARIO.situation, "What the leader must address:", ...COMMON_SCENARIO.matters, COMMON_SCENARIO.note],
      ["visible work", "assignments", "opportunity"]),
    make("leadership-pathway-conducive", "Which leadership approaches are most conducive to equity?", `${LEADERSHIP_PATHWAY_HREF}#conducive`, CONDUCIVE_SUMMARY[0],
      [...CONDUCIVE_SUMMARY, ...CONDUCIVE_GROUPS.map(group => `${group.title}: ${group.body} Lessons: ${LEADERSHIP_STYLE_LESSONS.filter(lesson => lesson.group === group.id).map(lesson => lesson.name).join(", ")}.`)],
      ["most equitable leadership style", "comparison"]),
  ];

  for (const lesson of LEADERSHIP_STYLE_LESSONS) docs.push(...styleDocs(lesson, make));

  for (const family of LEADERSHIP_SCENARIO_FAMILIES) {
    docs.push(make(`leadership-pathway-scenario-${family.id}`, `Leadership scenario: ${family.title} (${family.family})`, `${LEADERSHIP_PATHWAY_PAGES.scenarios.href}#scenario-${family.id}`, family.situation[0],
      [family.family, family.title, ...family.situation, "Separate matters:", ...family.matters, `Authorized process: ${family.formal}`,
        ...family.responses.map(response => `${name(response.slug)} (${response.kind === "stronger" ? "a stronger response" : "a harmful response"}): ${response.quote} ${response.analysis}`),
        "A combined response:", ...family.combination, "To discuss:", ...family.discuss],
      ["scenario", family.family], [...PAGES, ...family.responses.map(response => leadershipStyleHref(response.slug))]));
  }

  for (const part of RACE_SECTION.parts) {
    docs.push(make(`leadership-pathway-race-${part.id}`, `Race and leadership: ${part.title}`, `${LEADERSHIP_PATHWAY_PAGES.race.href}#${part.id}`, part.question,
      [...RACE_SECTION.intro, part.title, part.question, ...part.checks, `Example: ${part.example}`, `What an institution can do: ${part.institution}`],
      ["race", "racial equity", part.title]));
  }

  docs.push(make("leadership-pathway-conflict-lifecycle", LEADERSHIP_PATHWAY_PAGES.lifecycle.title, `${LEADERSHIP_PATHWAY_PAGES.lifecycle.href}#lifecycle-table`, LIFECYCLE.intro,
    [LIFECYCLE.intro, ...LIFECYCLE.stages.map((stage, n) => `Stage ${n + 1}, ${stage.stage}. Needed behavior: ${stage.behavior} Useful contribution: ${stage.contribution}. Worked example: ${stage.example}`)],
    ["conflict lifecycle", "combining approaches"]));
  docs.push(make("leadership-pathway-rubric", "Leadership practice rubric: eight points for a response", `${LEADERSHIP_PATHWAY_PAGES.capstone.href}#rubric`, RUBRIC.intro,
    [RUBRIC.intro, ...RUBRIC.criteria.map((criterion, n) => `${n + 1}. ${criterion.title}. Ask: ${criterion.question} Stronger sign: ${criterion.strong} Weaker sign: ${criterion.weak}`), RUBRIC.limits],
    ["rubric", "practice", "assessment of responses"]));
  docs.push(make("leadership-pathway-capstone", LEADERSHIP_PATHWAY_PAGES.capstone.title, `${LEADERSHIP_PATHWAY_PAGES.capstone.href}#capstone`, `Rewrite this statement: ${CAPSTONE.statement}`,
    [`Statement to rewrite: ${CAPSTONE.statement}`, "Tasks:", ...CAPSTONE.tasks, ...CAPSTONE.analysis.map(item => `${item.title}: ${item.body}`), `A stronger response: ${CAPSTONE.stronger}`, CAPSTONE.outcome],
    ["capstone", "rewrite the response"]));
  return docs;
}

type Make = (id: string, title: string, href: string, summary: string, lines: readonly string[], tags: readonly string[], related?: readonly string[]) => Doc;

/** Four documents per lesson, one per section group, each landing on its own anchor. */
function styleDocs(lesson: StyleLesson, make: Make): Doc[] {
  const href = leadershipStyleHref(lesson.slug);
  const related = [...PAGES, ...lesson.complements.map(item => leadershipStyleHref(item.slug))];
  const tags = [lesson.name, lesson.tagline];
  return [
    make(`leadership-pathway-style-${lesson.slug}`, `${lesson.name}: ${lesson.tagline}`, `${href}#how-it-works`, lesson.definition[0],
      [lesson.name, lesson.tagline, `Pathway group: ${STYLE_GROUP_LABEL[lesson.group]}.`, ...lesson.definition, "What it is not:", ...lesson.isNot,
        `In the common scenario “${COMMON_SCENARIO.title},” a stronger version: ${lesson.stronger.quote} ${lesson.stronger.why}`,
        `A harmful version: ${lesson.harmful.quote} ${lesson.harmful.why}`],
      tags, related),
    make(`leadership-pathway-style-${lesson.slug}-conflict`, `How ${lesson.name.toLowerCase()} resolves a conflict: ${lesson.conflict.title}`, `${href}#conflict`, lesson.conflict.situation,
      [lesson.conflict.title, lesson.conflict.situation, `How this approach tends to handle it: ${lesson.conflict.tendency}`, `A stronger resolution: ${lesson.conflict.stronger}`],
      [...tags, "conflict resolution"], related),
    make(`leadership-pathway-style-${lesson.slug}-equity`, `${lesson.name}: equity, inclusion, strengths and risks`, `${href}#equity`, `${lesson.assessment.label}. ${lesson.assessment.text}`,
      ["Where it can promote equity and inclusion:", ...lesson.promotes, "Where it can undermine them:", ...lesson.undermines, `Racial equity: ${lesson.race}`,
        `Equity assessment: ${lesson.assessment.label}. ${lesson.assessment.text}`,
        `Strengths: ${lesson.swot.strengths.join(" ")}`, `Weaknesses: ${lesson.swot.weaknesses.join(" ")}`,
        `Opportunities: ${lesson.swot.opportunities.join(" ")}`, `Threats: ${lesson.swot.threats.join(" ")}`],
      [...tags, "SWOT", "racial equity"], related),
    make(`leadership-pathway-style-${lesson.slug}-practice`, `${lesson.name}: when to use it, complements and practice`, `${href}#when-to-use`, lesson.helpsWhen[0],
      ["Conditions where it helps:", ...lesson.helpsWhen, "Conditions where it should not be used:", ...lesson.avoidWhen,
        "Complementary approaches:", ...lesson.complements.map(item => `${name(item.slug)}: ${item.why}`), "Safeguards:", ...lesson.safeguards,
        `Practice exercise: ${lesson.practice.situation}`, ...lesson.practice.steps, "Review prompts:", ...lesson.review],
      [...tags, "practice exercise", "when to use"], related),
  ];
}
