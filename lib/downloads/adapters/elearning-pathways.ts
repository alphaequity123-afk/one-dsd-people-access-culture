import "server-only";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { WATER_COURSE_TITLE, WATER_ESSAY, WATER_MODULES, WATER_SUPPORT } from "@/lib/content/water-we-swim-in";
import { parseResearchMarkdown, type ResearchBlock } from "@/lib/content/research-markdown";
import {
  CAPSTONE, COMMON_SCENARIO, CONDUCIVE_GROUPS, CONDUCIVE_SUMMARY, FOUNDATIONS, LEADERSHIP_PATHWAY_PAGES, LEADERSHIP_PATHWAY_TITLE,
  LEADERSHIP_SCENARIO_FAMILIES, LEADERSHIP_STYLE_LESSONS, LIFECYCLE, PATHWAY_BOUNDARY, PATHWAY_INTRO, PATHWAY_PROCESSES, PATHWAY_SOURCES,
  RACE_SECTION, RUBRIC, STYLE_GROUP_LABEL, leadershipStyle,
} from "@/lib/content/leadership-styles-pathway";
import { readingById, readings, readingSections } from "@/lib/content/reading-collection";
import { readingPathways } from "@/lib/content/reading-pathways";
import connections from "@/lib/content/reading-connections.json";
import type { DownloadKind } from "../catalog";
import {
  bullets, callout, compactSections, heading, numbered, paragraph, quote, section, table,
  type DocumentBlock, type DocumentSection, type InlineRun, type ResourceDocument,
} from "../model";
import { kicker, programName } from "./shared";

/** Leadership pathway pages besides the sixteen approach lessons. */
const LEADERSHIP_PAGE_IDS = ["home", "scenarios", "race-and-leadership", "conflict-lifecycle", "capstone"] as const;

export async function pathwayDownloadDocument(kind: DownloadKind, id: string, scope: StaffProgramScope): Promise<ResourceDocument | null> {
  switch (kind) {
    case "water-we-swim-in":
      return waterDocument(id, scope);
    case "leadership-styles":
      return leadershipDocument(id, scope);
    case "reading":
      return id === "pathways" ? readingPathwaysDocument(scope) : readingDocument(id, scope);
    default:
      return null;
  }
}

export async function pathwayDownloadIds(scope: StaffProgramScope): Promise<{ kind: DownloadKind; id: string }[]> {
  void scope;
  return [
    { kind: "water-we-swim-in", id: "home" },
    { kind: "water-we-swim-in", id: "essay" },
    ...WATER_MODULES.map((module) => ({ kind: "water-we-swim-in" as const, id: module.slug })),
    ...LEADERSHIP_PAGE_IDS.map((id) => ({ kind: "leadership-styles" as const, id })),
    ...LEADERSHIP_STYLE_LESSONS.map((lesson) => ({ kind: "leadership-styles" as const, id: lesson.slug })),
    { kind: "reading", id: "pathways" },
    ...readings.map((reading) => ({ kind: "reading" as const, id: reading.id })),
  ];
}

/* ---------- Research text written in the small Markdown the research files use ---------- */

const INLINE = /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)|\*\*(.+?)\*\*|(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g;

/** Markdown inline text as document runs: link labels keep their address, emphasis keeps its weight. */
function inlineRuns(text: string, style: { bold?: boolean; italic?: boolean } = {}): InlineRun[] {
  const result: InlineRun[] = [];
  const push = (value: string, extra: { bold?: boolean; italic?: boolean } = {}) => {
    if (!value) return;
    const bold = style.bold || extra.bold;
    const italic = style.italic || extra.italic;
    result.push({ text: value, ...(bold ? { bold: true } : {}), ...(italic ? { italic: true } : {}) });
  };
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    push(text.slice(last, match.index));
    if (match[1]) {
      result.push(...inlineRuns(match[1], style));
      push(` (${match[2].startsWith("/") ? `program page ${match[2]}` : match[2]})`);
    } else if (match[3]) result.push(...inlineRuns(match[3], { ...style, bold: true }));
    else if (match[4]) result.push(...inlineRuns(match[4], { ...style, italic: true }));
    last = match.index + match[0].length;
  }
  push(text.slice(last));
  return result;
}

function plain(text: string): string {
  return inlineRuns(text).map((run) => run.text).join("").trim();
}

function blocksText(blocks: ResearchBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
        case "paragraph":
        case "note":
          return plain(block.text);
        case "list":
        case "reflect":
          return block.items.map(plain).join("; ");
        case "table":
          return block.rows.map((row) => row.map(plain).join(", ")).join("; ");
        case "voice":
        case "fact":
        case "takeaway":
          return blocksText(block.blocks);
        case "scenario":
          return [block.label, blocksText(block.blocks), block.question].filter(Boolean).map(plain).join(" ");
      }
    })
    .filter(Boolean)
    .join(" ");
}

function researchBlocks(blocks: ResearchBlock[]): DocumentBlock[] {
  return blocks.flatMap((block): DocumentBlock[] => {
    switch (block.type) {
      case "heading":
        return [heading(plain(block.text), 3)];
      case "paragraph":
        return [paragraph(inlineRuns(block.text))];
      case "list":
        return [bullets(block.items.map((item) => inlineRuns(item)), block.ordered)];
      case "table":
        return [table(block.header.map(plain), block.rows.map((row) => row.map(plain)))];
      case "note":
        return [callout(plain(block.text), "Content note")];
      case "voice":
        return [quote(blocksText(block.blocks))];
      case "fact":
        return [callout(blocksText(block.blocks))];
      case "takeaway":
        return [callout(blocksText(block.blocks), "Practice this week")];
      case "reflect":
        return [heading("For your own reflection", 3), numbered(block.items.map((item) => inlineRuns(item)))];
      case "scenario":
        return [
          heading(block.label ? plain(block.label) : "Practice scenario", 3),
          ...researchBlocks(block.blocks),
          paragraph(inlineRuns(block.question, { bold: true })),
          bullets(block.options.map((option) => [...inlineRuns(option.choice, { bold: true }), { text: " — " }, ...inlineRuns(option.feedback)])),
        ];
    }
  });
}

/** Markdown split into document sections at each second-level heading. */
function markdownSections(markdown: string, leading?: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  let current: DocumentSection = { heading: leading, blocks: [] };
  for (const block of parseResearchMarkdown(markdown)) {
    if (block.type === "heading" && block.level === 3) {
      sections.push(current);
      current = { heading: plain(block.text), blocks: [] };
      continue;
    }
    current.blocks.push(...researchBlocks([block]));
  }
  sections.push(current);
  return sections;
}

/* ---------- The Water We Swim In ---------- */

const WATER_INTRO =
  "A voluntary course on Minnesota's mainstream culture: its real strengths, its blind spots, and how it shapes our work with Minnesotans of other cultures and with disabled people and their families.";

function waterDocument(id: string, scope: StaffProgramScope): ResourceDocument | null {
  if (id === "home") {
    return {
      kicker: kicker(scope, "Course"),
      title: WATER_COURSE_TITLE,
      subtitle: WATER_INTRO,
      meta: [{ label: "Modules", value: String(WATER_MODULES.length) }],
      sections: compactSections([
        section(undefined, [paragraph("There are six modules of about 20 minutes each. You can take them in any order, and nothing is collected or graded.")]),
        section("Modules", [
          numbered(WATER_MODULES.map((module) => [{ text: module.title, bold: true }, { text: ` — ${module.goal} About ${module.minutes} minutes.` }])),
        ]),
        ...WATER_MODULES.flatMap((module) => [
          section(`Module ${module.number}: ${module.title}`, [callout(module.goal, "Goal")]),
          ...markdownSections(module.body),
        ]),
        section("Support", [paragraph(WATER_SUPPORT)]),
      ]),
      attribution: programName(scope),
    };
  }
  if (id === "essay") {
    return {
      kicker: kicker(scope, `${WATER_COURSE_TITLE} · Essay`),
      title: "Minnesota culture: the water we swim in",
      subtitle: "The full essay behind the course, with every source the course draws on.",
      meta: [],
      sections: compactSections([
        ...WATER_ESSAY.sections.flatMap((entry) => markdownSections(entry.body, entry.heading)),
        ...(WATER_ESSAY.limits ? markdownSections(WATER_ESSAY.limits, "What the sources could not establish") : []),
        ...(WATER_ESSAY.sources ? markdownSections(WATER_ESSAY.sources, "Sources") : []),
      ]),
      attribution: programName(scope),
    };
  }
  const module = WATER_MODULES.find((item) => item.slug === id);
  if (!module) return null;
  return {
    kicker: kicker(scope, `${WATER_COURSE_TITLE} · Module ${module.number} of ${WATER_MODULES.length}`),
    title: module.title,
    subtitle: module.goal,
    meta: [{ label: "Time", value: `About ${module.minutes} minutes` }],
    sections: compactSections([...markdownSections(module.body), section("Support", [paragraph(WATER_SUPPORT)])]),
    attribution: programName(scope),
  };
}

/* ---------- Leadership styles, conflict and equity ---------- */

function leadershipBase(scope: StaffProgramScope, noun: string, title: string, subtitle: string, sections: DocumentSection[]): ResourceDocument {
  return {
    kicker: kicker(scope, `${LEADERSHIP_PATHWAY_TITLE} · ${noun}`),
    title,
    subtitle,
    meta: [],
    sections: compactSections([...sections, section("Before you practice", [callout(PATHWAY_BOUNDARY)])]),
    sources: PATHWAY_SOURCES.map((source) => ({ title: source.title, href: source.href })),
    attribution: programName(scope),
  };
}

const styleName = (slug: string) => leadershipStyle(slug)?.name ?? slug;

function commonScenarioSection(): DocumentSection {
  return section(`The common scenario: “${COMMON_SCENARIO.title}”`, [
    paragraph(`${COMMON_SCENARIO.intro} This situation is fictional.`),
    ...COMMON_SCENARIO.situation.map((entry) => paragraph(entry)),
    heading("What the leader must address", 3),
    bullets(COMMON_SCENARIO.matters),
    paragraph(COMMON_SCENARIO.note),
  ]);
}

function leadershipDocument(id: string, scope: StaffProgramScope): ResourceDocument | null {
  switch (id) {
    case "home":
      return leadershipBase(scope, "Overview", LEADERSHIP_PATHWAY_TITLE, PATHWAY_INTRO[0], [
        section("About this pathway", [
          ...PATHWAY_INTRO.slice(1).map((entry) => paragraph(entry)),
          paragraph("Each lesson gives a working definition and its limits, a stronger and a harmful response to the same scenario, a second conflict example, an analysis of how the approach can promote or undermine equity and inclusion, including racial equity, strengths, weaknesses, opportunities and threats, when to use it and when not to, approaches that complement it, a practice exercise and review questions."),
          heading("When a formal process applies", 3),
          paragraph(PATHWAY_PROCESSES),
        ]),
        section("Foundations: what leadership development must distinguish", [
          heading(FOUNDATIONS.styleVsConflict.title, 3),
          ...FOUNDATIONS.styleVsConflict.body.map((entry) => paragraph(entry)),
          paragraph("So each lesson asks two questions:"),
          numbered(FOUNDATIONS.styleVsConflict.questions),
          heading(FOUNDATIONS.situations.title, 3),
          paragraph(FOUNDATIONS.situations.intro),
          table(["Situation", "Main leadership responsibility"], FOUNDATIONS.situations.rows.map((row) => [row.situation, row.responsibility])),
          paragraph(FOUNDATIONS.situations.closing),
          heading(FOUNDATIONS.equityInclusion.title, 3),
          ...FOUNDATIONS.equityInclusion.body.map((entry) => paragraph(entry)),
        ]),
        commonScenarioSection(),
        section("Sixteen leadership approaches", [
          paragraph("The approaches are grouped by a curriculum judgment about equity. The groups describe patterns of behavior, not people. Anyone can use several approaches, and the same person may lead differently in different situations."),
          ...CONDUCIVE_GROUPS.flatMap((group) => [
            heading(group.title, 3),
            paragraph(group.body),
            bullets(LEADERSHIP_STYLE_LESSONS.filter((lesson) => lesson.group === group.id).map((lesson) => [{ text: lesson.name, bold: true }, { text: ` — ${lesson.tagline}` }])),
          ]),
        ]),
        section("Which approaches are most conducive to equity?", [
          ...CONDUCIVE_SUMMARY.map((entry) => paragraph(entry)),
          bullets(CONDUCIVE_GROUPS.map((group) => [{ text: `${group.title}: `, bold: true }, { text: group.body }])),
        ]),
        section("Go deeper", [
          bullets([
            [{ text: LEADERSHIP_PATHWAY_PAGES.scenarios.title, bold: true }, { text: " — Seven fictional situations, from accessible meetings to a leader's own mistake, with several styles responding to each." }],
            [{ text: LEADERSHIP_PATHWAY_PAGES.race.title, bold: true }, { text: " — How race shapes the way leadership is recognized, limited and evaluated, without stereotyping anyone." }],
            [{ text: LEADERSHIP_PATHWAY_PAGES.lifecycle.title, bold: true }, { text: " — A worked example that combines approaches from the first response to lasting change." }],
            [{ text: LEADERSHIP_PATHWAY_PAGES.capstone.title, bold: true }, { text: " — Rewrite a weak response and check it against the eight-point practice rubric." }],
          ]),
          paragraph("Research from one setting does not prove an outcome in another. Use the sources for reflection and discussion alongside applicable policies and responsibilities."),
        ]),
      ]);
    case "scenarios":
      return leadershipBase(
        scope,
        "Scenarios",
        LEADERSHIP_PATHWAY_PAGES.scenarios.title,
        "Each situation below is fictional, and every line of dialogue is original. For each one, several leadership approaches respond, some in a stronger way and some in a harmful way. Then comes a combined response and questions to discuss.",
        [
          section(undefined, [paragraph("Responses illustrate tendencies and choices. They are not scripts that predict how anyone who uses a style would act, and no response is a judgment about a real person. Check your own response against the eight-point practice rubric in the capstone.")]),
          ...LEADERSHIP_SCENARIO_FAMILIES.map((family) =>
            section(family.title, [
              paragraph([{ text: family.family, italic: true }]),
              ...family.situation.map((entry) => paragraph(entry)),
              heading("Separate matters the leader must address", 3),
              bullets(family.matters),
              heading("What goes through an authorized process", 3),
              paragraph(family.formal),
              heading("How different approaches might respond", 3),
              ...family.responses.flatMap((response) => [
                paragraph([{ text: `${response.kind === "stronger" ? "A stronger response" : "A harmful response"}: ${styleName(response.slug)}`, bold: true }]),
                quote(response.quote),
                paragraph(response.analysis),
              ]),
              heading("A combined response", 3),
              numbered(family.combination),
              heading("To discuss", 3),
              bullets(family.discuss),
            ]),
          ),
        ],
      );
    case "race-and-leadership":
      return leadershipBase(scope, "Race and leadership", `${LEADERSHIP_PATHWAY_PAGES.race.title}, not a leadership stereotype`, RACE_SECTION.intro[0], [
        section(undefined, [paragraph(`${RACE_SECTION.intro[1]} The examples are fictional.`)]),
        ...RACE_SECTION.parts.map((part, index) =>
          section(`${String.fromCharCode(65 + index)}. ${part.title}`, [
            paragraph([{ text: part.question, bold: true }]),
            bullets(part.checks),
            heading("What it can look like", 3),
            callout(part.example),
            heading("What an institution can do", 3),
            paragraph(part.institution),
          ]),
        ),
      ]);
    case "conflict-lifecycle":
      return leadershipBase(scope, "Conflict lifecycle", LEADERSHIP_PATHWAY_PAGES.lifecycle.title, LIFECYCLE.intro, [
        section("The eight stages", [
          paragraph("Each stage needs a different behavior. The useful contribution names approaches that help at that stage."),
          table(["Stage", "Needed behavior", "Useful contribution"], LIFECYCLE.stages.map((stage) => [stage.stage, stage.behavior, stage.contribution])),
        ]),
        commonScenarioSection(),
        section(`Worked example: “${COMMON_SCENARIO.title}”`, [
          ...LIFECYCLE.stages.flatMap((stage, index) => [
            heading(`Stage ${index + 1}: ${stage.stage}`, 3),
            paragraph([{ text: "Needed behavior: ", bold: true }, { text: stage.behavior }]),
            paragraph([{ text: "What the supervisor does: ", bold: true }, { text: stage.example }]),
            paragraph([{ text: "Approaches that help: ", bold: true }, { text: stage.styles.map(styleName).join(", ") }]),
          ]),
          paragraph("Notice what stays the same at every stage: the employee is treated with dignity, access is protected, the process is fair, and someone is accountable for each step."),
        ]),
      ]);
    case "capstone":
      return leadershipBase(scope, "Capstone", LEADERSHIP_PATHWAY_PAGES.capstone.title, "Bring the pathway together by rewriting one weak response into a strong one. Then check your rewrite against the practice rubric.", [
        section("The statement to rewrite", [
          paragraph(`A supervisor says this to the employee in the common scenario, “${COMMON_SCENARIO.title}”`),
          callout(CAPSTONE.statement),
          heading("Your tasks", 3),
          numbered(CAPSTONE.tasks),
          paragraph("Write your answers in your own notes."),
        ]),
        commonScenarioSection(),
        section("Worked analysis", [
          paragraph("Try the tasks first. Then compare your thinking with this analysis."),
          { kind: "fields", rows: CAPSTONE.analysis.map((item) => ({ label: item.title, value: item.body })) },
        ]),
        section("A stronger response", [
          quote(CAPSTONE.stronger),
          paragraph(`It uses ethical behavior (a fair response and protected reporting), inclusive behavior (naming both concerns and access), directive behavior (the supervisor commits to act), and participative behavior (clarifying requirements and support together). ${CAPSTONE.outcome}`),
        ]),
        section("The eight-point practice rubric", [
          paragraph(RUBRIC.intro),
          table(["The response", "Ask", "Stronger sign", "Weaker sign"], RUBRIC.criteria.map((criterion, index) => [`${index + 1}. ${criterion.title}`, criterion.question, criterion.strong, criterion.weak])),
          callout(RUBRIC.limits),
        ]),
      ]);
  }
  const index = LEADERSHIP_STYLE_LESSONS.findIndex((lesson) => lesson.slug === id);
  if (index < 0) return null;
  const lesson = LEADERSHIP_STYLE_LESSONS[index];
  return leadershipBase(scope, `Lesson ${index + 1} of ${LEADERSHIP_STYLE_LESSONS.length}`, lesson.name, `${lesson.tagline}. ${STYLE_GROUP_LABEL[lesson.group]}.`, [
    section("Working definition and boundaries", [...lesson.definition.map((entry) => paragraph(entry)), heading("What it is not", 3), bullets(lesson.isNot)]),
    section(`The common scenario: “${COMMON_SCENARIO.title}”`, [
      ...COMMON_SCENARIO.situation.map((entry) => paragraph(entry)),
      paragraph("Here is how this approach might respond. These responses illustrate tendencies and choices, not scripts that predict how anyone would act."),
      heading("A stronger version", 3),
      quote(lesson.stronger.quote),
      paragraph(lesson.stronger.why),
      heading("A harmful version", 3),
      quote(lesson.harmful.quote),
      paragraph(lesson.harmful.why),
    ]),
    section(`How it resolves another conflict: ${lesson.conflict.title}`, [
      callout(lesson.conflict.situation),
      heading("How this approach tends to handle it", 3),
      paragraph(lesson.conflict.tendency),
      heading("A stronger resolution", 3),
      paragraph(lesson.conflict.stronger),
    ]),
    section("How it can promote or undermine equity and inclusion", [
      heading("Where it can promote equity and inclusion", 3),
      bullets(lesson.promotes),
      heading("Where it can undermine them", 3),
      bullets(lesson.undermines),
      heading("Racial equity", 3),
      paragraph(lesson.race),
      heading("Equity assessment", 3),
      paragraph([{ text: lesson.assessment.label, bold: true }]),
      paragraph(`${lesson.assessment.text} This is a curriculum judgment about a pattern of behavior, not a rating of any person.`),
    ]),
    section("Strengths, weaknesses, opportunities and threats", [
      table(
        ["Strengths", "Weaknesses", "Opportunities", "Threats"],
        Array.from({ length: Math.max(lesson.swot.strengths.length, lesson.swot.weaknesses.length, lesson.swot.opportunities.length, lesson.swot.threats.length) }, (_, row) => [
          lesson.swot.strengths[row] ?? "",
          lesson.swot.weaknesses[row] ?? "",
          lesson.swot.opportunities[row] ?? "",
          lesson.swot.threats[row] ?? "",
        ]),
      ),
    ]),
    section("When to use it, and when not to", [heading("Conditions where it helps", 3), bullets(lesson.helpsWhen), heading("Conditions where it should not be used", 3), bullets(lesson.avoidWhen)]),
    section("Complementary approaches and safeguards", [
      bullets(lesson.complements.map((item) => [{ text: `${styleName(item.slug)}: `, bold: true }, { text: item.why }])),
      heading("Safeguards", 3),
      bullets(lesson.safeguards),
    ]),
    section("Practice exercise and review", [
      callout(lesson.practice.situation),
      numbered(lesson.practice.steps),
      heading("Review prompts", 3),
      bullets(lesson.review),
      paragraph("Check a written response against the eight-point practice rubric in the capstone. The rubric looks at responses, never at people."),
    ]),
  ]);
}

/* ---------- Books and ideas for your work ---------- */

type ReadingConnection = { book: number; course: string; reason: string; practice: string };

function readingDocument(id: string, scope: StaffProgramScope): ResourceDocument | null {
  const book = readingById(id);
  if (!book) return null;
  const linkRun = (link: { label: string; href: string }): InlineRun[] => [{ text: link.label, bold: true }, { text: ` — ${link.href.startsWith("/") ? `program page ${link.href}` : link.href}` }];
  const practice = (connections as ReadingConnection[]).filter((item) => item.book === book.number);
  return {
    kicker: kicker(scope, readingSections[book.section - 1] ?? "Reading"),
    title: book.title,
    subtitle: book.authors,
    meta: [],
    sections: compactSections([
      section(undefined, [
        book.citation ? paragraph(book.citation) : null,
        book.bookLinks?.length ? bullets(book.bookLinks.map(linkRun)) : null,
        book.bookAccess ? paragraph(book.bookAccess) : null,
        book.trademarkNote ? paragraph(book.trademarkNote) : null,
      ]),
      section("About this book", book.overview.map((entry) => paragraph(entry))),
      section("Key ideas", [
        paragraph("These reading notes present the author's arguments for reflection and discussion. They are not statements of Department of Human Services policy."),
        bullets(book.mainPoints),
      ]),
      section("Full summary", book.summary.map((entry) => paragraph(entry))),
      section("Chapter guide", [
        book.chapterGuideIntro ? paragraph(book.chapterGuideIntro) : null,
        ...(book.chapterGuide ?? []).flatMap((item): DocumentBlock[] => [
          heading(`${item.chapter}: ${item.title}`, 3),
          paragraph([{ text: `${item.part}, about pages ${item.pages}`, italic: true }]),
          paragraph(item.about),
          bullets(item.ideas),
          paragraph([{ text: "What these applications add or do differently. ", bold: true }, { text: item.ours }]),
          paragraph([{ text: "To discuss", bold: true }]),
          numbered(item.discuss),
          ...(item.related ? [paragraph(linkRun(item.related))] : []),
        ]),
      ]),
      section("Connections to your work", book.relevance.map((entry) => paragraph(entry))),
      section("Reflect or discuss with your team", [
        numbered(book.questions),
        paragraph("Choose one question that matters to your work. You can reflect privately, use a practice example or discuss the ideas with colleagues."),
      ]),
      ...practice.map((item) =>
        section("Put an idea into practice", [
          paragraph(item.reason),
          paragraph(item.practice),
          paragraph(`This activity is a learning suggestion inspired by the reading. Continue with the related course at program page /courses/${item.course}.`),
          paragraph("Return to your reflection after trying the idea. What evidence would help you judge whether it made a difference?"),
        ]),
      ),
      section("About these reading notes", [
        paragraph("These notes summarize and discuss the book; they do not reproduce the full text. Ideas attributed to the author are perspectives for consideration, not statements of Department of Human Services policy. Consult the book for its complete argument and the applicable guidance for decisions in your work."),
        book.editionNote ? paragraph(book.editionNote) : null,
      ]),
    ]),
    sources: book.sourceUrl ? [{ title: book.title, href: book.sourceUrl, note: "Find the original book and available editions." }] : undefined,
    attribution: programName(scope),
  };
}

function readingPathwaysDocument(scope: StaffProgramScope): ResourceDocument {
  return {
    kicker: kicker(scope, "Choose a question that matters to you"),
    title: "Put a reading to work",
    subtitle: "Start with a situation, explore a few perspectives and try a thoughtful next step. There is no required reading order.",
    meta: [],
    sections: compactSections([
      section(undefined, [
        paragraph("Directors, managers, supervisors and staff can use these suggestions individually or with colleagues. Choose by the work you are doing, not by your job title. Use practice examples or information appropriate to share."),
      ]),
      ...readingPathways.map((path) =>
        section(path.title, [
          paragraph([{ text: readingSections[path.section - 1] ?? "", italic: true }]),
          paragraph([{ text: path.question, bold: true }]),
          paragraph(path.tryIt),
          heading("Check your thinking", 3),
          paragraph(path.check),
          heading("Go further", 3),
          bullets([
            [{ text: path.courseTitle, bold: true }, { text: ` — program page /courses/${path.course}` }],
            [{ text: path.toolTitle, bold: true }, { text: ` — program page ${path.tool}` }],
            [{ text: "Choose readings from this collection", bold: true }, { text: ` — program page /learn/readings?section=${path.section}` }],
          ]),
        ]),
      ),
      section("Return to what you tried", [
        paragraph("Before reopening your notes, explain the idea in your own words. After trying it, write down what happened, what remains uncertain and one adjustment you would make. Revisit the question after your next relevant task or team conversation."),
        paragraph("These activities are suggestions written for this program. They do not replace the authors’ arguments, official guidance or the perspectives of people affected by a decision."),
      ]),
    ]),
    attribution: programName(scope),
  };
}
