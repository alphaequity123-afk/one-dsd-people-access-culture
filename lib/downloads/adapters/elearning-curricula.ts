import "server-only";
import clasCurriculum from "@/lib/content/clas-curriculum.json";
import { loadClasLessonPageData } from "@/lib/content/clas-curriculum-page-data";
import type { Decision, JobAid, Ordering, PracticeOption, RecallQuestion } from "@/lib/content/clas-curriculum-practice";
import type { Curriculum as ToolkitCurriculum, Lesson as ToolkitLesson, Resource } from "@/lib/content/equity-decisions-model";
import equityDecisions from "@/lib/content/equity-everyday-decisions.json";
import interculturalConnections from "@/lib/content/intercultural-community-connections.json";
import { getAvailableInterculturalCommunities } from "@/lib/content/intercultural-community-list";
import interculturalCurriculum from "@/lib/content/intercultural-curriculum.json";
import interculturalSources from "@/lib/content/intercultural-curriculum-sources.json";
import { getAvailableInterculturalResources } from "@/lib/content/intercultural-resource-resolver";
import { prepareEditableSurface } from "@/lib/content/prepare-editable-surface";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { DownloadKind } from "../catalog";
import {
  bullets,
  callout,
  compactSections,
  heading,
  numbered,
  paragraph,
  section,
  type DocumentBlock,
  type DocumentSection,
  type DocumentSource,
  type InlineRun,
  type ResourceDocument,
} from "../model";
import { kicker, programName } from "./shared";

type ElearningId = { kind: DownloadKind; id: string };
type ChoiceOption = { text: string; feedback: string; correct?: boolean };
type TextSection = { title: string; paragraphs: string[] };

const OVERVIEW_ID = "curriculum";

/* ---------- Shared building blocks ---------- */

function partLabel(id: string, title: string): string {
  return `Part ${Number(id)}: ${title}`;
}

function textSections(sections: readonly TextSection[]): DocumentBlock[] {
  return sections.flatMap((entry) => [heading(entry.title), ...entry.paragraphs.map((text) => paragraph(text))]);
}

/** Every response with its guidance; the supported answer is marked in words, not color. */
function choiceList(options: readonly ChoiceOption[]): DocumentBlock {
  return bullets(
    options.map((option): InlineRun[] => [
      { text: option.text, bold: option.correct === true },
      ...(option.correct ? [{ text: " (supported answer)", bold: true }] : []),
      ...(option.feedback ? [{ text: ` — ${option.feedback}` }] : []),
    ]),
  );
}

function choiceBlocks(title: string, question: string, options: readonly ChoiceOption[], scenario?: string): DocumentBlock[] {
  return [heading(title), scenario ? paragraph(scenario) : null, paragraph([{ text: question, bold: true }]), choiceList(options)].filter(
    (block): block is DocumentBlock => Boolean(block),
  );
}

function resourceList(resources: readonly Resource[] | readonly { title: string; href: string; note?: string }[]): DocumentBlock | null {
  if (resources.length === 0) return null;
  return bullets(
    resources.map((resource): InlineRun[] => {
      const note = "description" in resource ? resource.description : "note" in resource ? resource.note : undefined;
      const destination = resource.href.startsWith("/") ? `program page ${resource.href}` : resource.href;
      return [{ text: resource.title, bold: true }, { text: ` — ${destination}` }, ...(note ? [{ text: `. ${note}` }] : [])];
    }),
  );
}

function sourcesFrom(resources: readonly { title: string; href: string; description?: string; note?: string }[]): DocumentSource[] {
  return resources.map((resource) => ({ title: resource.title, href: resource.href, note: resource.description ?? resource.note }));
}

/** Wrap one lesson's sections as a single section of a whole-curriculum document. */
function asPart(title: string, sections: DocumentSection[]): DocumentSection {
  return section(title, sections.flatMap((entry) => [entry.heading ? heading(entry.heading) : null, ...entry.blocks]));
}

/* ---------- Culturally and Linguistically Appropriate Services curriculum ---------- */

type ClasModule = (typeof clasCurriculum.modules)[number];

const CLAS_SOURCES: DocumentSource[] = [
  { title: "National Culturally and Linguistically Appropriate Services Standards", href: "https://thinkculturalhealth.hhs.gov/clas/standards", note: "The current standards from the federal Office of Minority Health." },
  { title: "National Culturally and Linguistically Appropriate Services Standards, revised June 2025", href: "https://thinkculturalhealth.hhs.gov/assets/pdfs/EnhancedNationalCLASStandards_Revised_June2025.pdf" },
  { title: "Minnesota Department of Human Services language and disability assistance policy", href: "https://mn.gov/dhs/assets/language-disability-assistance_tcm1053-646948.pdf" },
];

const CLAS_KICKER = "Culturally and Linguistically Appropriate Services learning";

function standardsLabel(standards: readonly number[]): string {
  return `Standard${standards.length === 1 ? "" : "s"} ${standards.join(", ")}`;
}

function recallBlocks(questions: readonly RecallQuestion[], previousTitle: string): DocumentBlock[] {
  if (questions.length === 0) return [];
  return [
    paragraph(`Recall from the previous part, “${previousTitle}”.`),
    ...questions.flatMap((question, index) => choiceBlocks(`Recall question ${index + 1}`, question.question, question.options)),
  ];
}

function decisionBlocks(decisions: readonly Decision[]): DocumentBlock[] {
  return decisions.flatMap((decision, index) => choiceBlocks(`Decision ${index + 1}`, decision.question, decision.options as PracticeOption[], decision.scenario));
}

function orderingBlocks(ordering: Ordering | null): DocumentBlock[] {
  if (!ordering) return [];
  return [
    heading("What would you check first?"),
    ordering.scenario ? paragraph(ordering.scenario) : null,
    paragraph([{ text: ordering.prompt, bold: true }]),
    paragraph("Suggested order:"),
    numbered(ordering.correctOrder.map((step) => ordering.steps[step] ?? "")),
    ordering.feedback ? paragraph(ordering.feedback) : null,
  ].filter((block): block is DocumentBlock => Boolean(block));
}

function jobAidBlocks(aid: JobAid, standards: readonly number[]): DocumentBlock[] {
  return [
    heading(aid.title),
    aid.useWhen ? paragraph([{ text: "Use when: ", bold: true }, { text: aid.useWhen }]) : null,
    ...aid.sections.flatMap((entry) => [paragraph([{ text: entry.heading, bold: true }]), bullets(entry.items)]),
    aid.remember.length ? paragraph([{ text: "Remember", bold: true }]) : null,
    aid.remember.length ? bullets(aid.remember) : null,
    aid.askWho.length ? paragraph([{ text: "Who to ask", bold: true }]) : null,
    aid.askWho.length ? bullets(aid.askWho) : null,
    paragraph(
      `Culturally and Linguistically Appropriate Services ${standardsLabel(standards).toLowerCase()}. Use the current procedures applicable to your role and program when taking action. Leave names, case details and other private information out of your notes.`,
    ),
  ].filter((block): block is DocumentBlock => Boolean(block));
}

function clasLessonSections(module: ClasModule, index: number): DocumentSection[] {
  const data = loadClasLessonPageData(module.id);
  const practice = data.practice;
  const previous = clasCurriculum.modules[index - 1];
  return compactSections([
    section(undefined, [
      paragraph(`Part ${index + 1} of ${clasCurriculum.modules.length} · Culturally and Linguistically Appropriate Services ${standardsLabel(module.standards).toLowerCase()}`),
      practice?.outcome ? callout(practice.outcome, "What you will be able to do") : null,
      paragraph([{ text: "What you will produce: ", bold: true }, { text: module.deliverable }]),
    ]),
    section("Check what you remember", previous ? recallBlocks(data.recall, previous.title) : []),
    section(
      "Key points",
      (practice?.keyPoints ?? []).flatMap((entry) => [heading(entry.chapter), bullets(entry.points)]),
    ),
    section(module.example.title, [
      paragraph(module.example.situation),
      paragraph([{ text: "Work through the example: ", bold: true }, { text: module.example.response }]),
      paragraph(module.example.reason),
    ]),
    section("Practice with guidance", [
      ...choiceBlocks("Guided question", module.practice.question, module.practice.options),
      ...decisionBlocks(practice?.decisions ?? []),
      ...orderingBlocks(practice?.ordering ?? null),
    ]),
    section("Bring it into your work", [
      paragraph(module.practice.reflection),
      module.practice.artifact ? paragraph([{ text: "Take forward: ", bold: true }, { text: module.practice.artifact }]) : null,
      paragraph("Keep any working notes in your own document. Leave names, case details and other private information out of learning notes."),
    ]),
    section("Read the full lesson", textSections(module.sections)),
    section("One-page job aid", practice?.jobAid ? jobAidBlocks(practice.jobAid, module.standards) : []),
    section("Sources and further guidance", [
      bullets(CLAS_SOURCES.map((source) => [{ text: source.title, bold: true }, { text: ` — ${source.href}` }])),
      paragraph("Use the current procedures applicable to your role and program when taking action."),
    ]),
  ]);
}

function clasLessonDocument(id: string, scope: StaffProgramScope): ResourceDocument | null {
  const index = clasCurriculum.modules.findIndex((module) => module.id === id);
  const module = clasCurriculum.modules[index];
  if (!module) return null;
  return {
    kicker: kicker(scope, CLAS_KICKER),
    title: module.title,
    subtitle: `Part ${index + 1} of ${clasCurriculum.modules.length} in ${clasCurriculum.title}`,
    meta: [
      { label: "Curriculum", value: clasCurriculum.title },
      { label: "Standards", value: module.standards.join(", ") },
    ],
    sections: clasLessonSections(module, index),
    sources: CLAS_SOURCES,
    attribution: programName(scope),
  };
}

function clasCurriculumDocument(scope: StaffProgramScope): ResourceDocument {
  return {
    kicker: kicker(scope, CLAS_KICKER),
    title: clasCurriculum.title,
    subtitle: "Follow one work example from understanding a barrier to planning and reviewing an improvement.",
    meta: [{ label: "Parts", value: String(clasCurriculum.modules.length) }],
    sections: compactSections([
      section("A connected path you can use at your own pace", [
        paragraph(
          "Begin with the person’s experience, then explore communication, responsibility, participation and improvement. Every part includes recorded guidance, a transcript, decisions to practice, a working note that builds into your own plan and a one-page job aid.",
        ),
        paragraph(
          "You do not need a group. You can pause, revisit a lesson or use the sample service notice. Leave names, case details and other private information out of learning notes.",
        ),
      ]),
      section("The parts", [
        numbered(
          clasCurriculum.modules.map((module): InlineRun[] => [
            { text: module.title, bold: true },
            { text: ` — ${module.deliverable} (${standardsLabel(module.standards).toLowerCase()})` },
          ]),
        ),
      ]),
      section("Where the standards fit", [
        paragraph("These brief descriptions help you find the relevant part. Read the original standards for their complete wording."),
        numbered(clasCurriculum.standards.map((standard) => `${standard.focus} (Part ${Number(standard.lesson)})`)),
      ]),
      section("Use the standards alongside current guidance", [
        paragraph(
          "This curriculum connects the National Culturally and Linguistically Appropriate Services Standards to individual work. It does not replace agency requirements, specialist guidance or approval processes. Identify what you can change and where coordination is needed.",
        ),
      ]),
      ...clasCurriculum.modules.map((module, index) => asPart(partLabel(module.id, module.title), clasLessonSections(module, index).filter((entry) => entry.heading !== "Sources and further guidance"))),
    ]),
    sources: CLAS_SOURCES,
    attribution: programName(scope),
  };
}

/* ---------- Equity in everyday decisions (toolkit curriculum) ---------- */

const toolkit = equityDecisions as unknown as ToolkitCurriculum;
const TOOLKIT_KICKER = "Equity in everyday decisions";

async function toolkitAvailable(scope: StaffProgramScope): Promise<boolean> {
  try {
    const surface = await prepareEditableSurface("equity-toolkit.home", { scope, includeOwner: false });
    return surface.available === true;
  } catch {
    return false;
  }
}

function toolkitLessonSections(lesson: ToolkitLesson, index: number): DocumentSection[] {
  return compactSections([
    section(undefined, [
      paragraph(`Part ${index + 1} of ${toolkit.modules.length}`),
      paragraph([{ text: "What you will produce: ", bold: true }, { text: lesson.deliverable }]),
    ]),
    section(lesson.example.title, [
      paragraph(lesson.example.situation),
      paragraph([{ text: "Work through the example: ", bold: true }, { text: lesson.example.response }]),
      paragraph(lesson.example.reason),
    ]),
    section("Try a decision", choiceBlocks("Decision", lesson.practice.question, lesson.practice.options)),
    section("Bring it into your work", [
      lesson.practice.artifact ? paragraph([{ text: "Take forward: ", bold: true }, { text: lesson.practice.artifact }]) : null,
      paragraph(lesson.practice.reflection),
      paragraph("Keep any working notes in your own document. Do not include names, case details, health or personnel information, or other confidential information."),
    ]),
    section("Resources for this part", [resourceList(lesson.resources ?? [])]),
    section("Read the full lesson", textSections(lesson.sections)),
  ]);
}

async function toolkitLessonDocument(id: string, scope: StaffProgramScope): Promise<ResourceDocument | null> {
  const index = toolkit.modules.findIndex((module) => module.id === id);
  const lesson = toolkit.modules[index];
  if (!lesson || !(await toolkitAvailable(scope))) return null;
  return {
    kicker: kicker(scope, TOOLKIT_KICKER),
    title: lesson.title,
    subtitle: `Part ${index + 1} of ${toolkit.modules.length} in ${toolkit.title}`,
    meta: [
      { label: "Curriculum", value: toolkit.title },
    ],
    sections: compactSections([...toolkitLessonSections(lesson, index), section("Sources and further guidance", [resourceList(toolkit.sources ?? [])])]),
    sources: sourcesFrom(toolkit.sources ?? []),
    attribution: programName(scope),
  };
}

async function toolkitCurriculumDocument(scope: StaffProgramScope): Promise<ResourceDocument | null> {
  if (!(await toolkitAvailable(scope))) return null;
  return {
    kicker: kicker(scope, TOOLKIT_KICKER),
    title: toolkit.title,
    subtitle: "Follow one decision from the first question through a practical next step and a plan to learn what happened.",
    meta: [{ label: "Parts", value: String(toolkit.modules.length) }],
    sections: compactSections([
      section("A connected path at your own pace", [
        paragraph("Use a work example that matters to you, or follow the example in the lessons. Each part offers guidance, a transcript, an individual decision to practice, and a prompt for your own work."),
        paragraph("You do not need a group. Leave names, case details, and other confidential information out of learning notes."),
        paragraph("The learning supports your work. Follow applicable policy and review requirements, and consult the responsible people when a decision needs their approval. A quick check does not replace a full analysis when one is required."),
      ]),
      section("The parts", [numbered(toolkit.modules.map((lesson): InlineRun[] => [{ text: lesson.title, bold: true }, { text: ` — ${lesson.deliverable}` }]))]),
      section("Use this learning with the tools", [
        paragraph("Start with the decision and use the resources that fit your work. Check current requirements and carry open questions to the person or area responsible."),
        resourceList(toolkit.sources ?? []),
      ]),
      ...toolkit.modules.map((lesson, index) => asPart(partLabel(lesson.id, lesson.title), toolkitLessonSections(lesson, index))),
    ]),
    sources: sourcesFrom(toolkit.sources ?? []),
    attribution: programName(scope),
  };
}

/* ---------- Intercultural understanding in everyday work ---------- */

type InterculturalModule = (typeof interculturalCurriculum.modules)[number];
type Connection = { lesson: number; prompt: string };
type CommunityEntry = { id: string; title: string; href: string; standingTribalDeference: boolean; prompt: string; lesson: number };
const INTERCULTURAL_KICKER = "Intercultural learning";
const TRIBAL_DEFERENCE = "We defer to the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations and consultation.";

async function interculturalAvailable(scope: StaffProgramScope): Promise<boolean> {
  try {
    const surface = await prepareEditableSurface("learn.intercultural", { scope, includeOwner: false });
    return surface.available === true;
  } catch {
    return false;
  }
}

async function interculturalCommunities(scope: StaffProgramScope): Promise<CommunityEntry[]> {
  const available = await getAvailableInterculturalCommunities(scope);
  const connections = interculturalConnections as Record<string, Connection>;
  return available.flatMap((item) => {
    const connection = connections[item.id];
    return connection ? [{ ...item, ...connection }] : [];
  });
}

function communityBlocks(items: readonly CommunityEntry[]): DocumentBlock[] {
  if (items.length === 0) return [];
  return [
    paragraph("Choose what is useful for your work. A brief can help you prepare questions; it cannot tell you what a person needs or prefers."),
    bullets(
      items.map((item): InlineRun[] => [
        { text: item.title, bold: true },
        { text: ` — program page ${item.href}. ${item.prompt}` },
        ...(item.standingTribalDeference ? [{ text: ` ${TRIBAL_DEFERENCE}` }] : []),
      ]),
    ),
  ];
}

function interculturalLessonSections(module: InterculturalModule, index: number, communities: readonly CommunityEntry[], resources: readonly { title: string; href: string; note?: string }[]): DocumentSection[] {
  return compactSections([
    section(undefined, [paragraph(`Part ${index + 1} of ${interculturalCurriculum.modules.length}`), paragraph("Bring curiosity, care and practical questions to the work in front of you.")]),
    section("Read and reflect", textSections(module.sections)),
    section("Try a decision", choiceBlocks("Decision", module.practice.question, module.practice.options)),
    section("Bring it into your work", [
      paragraph(module.practice.reflection),
      paragraph(module.practice.artifact),
      paragraph("Keep any working notes in your own document. Do not include names, case details or other private information."),
    ]),
    section("Explore community and place briefs", communityBlocks(communities.filter((item) => item.lesson === Number(module.id)))),
    section("Continue learning", [resourceList(resources)]),
  ]);
}

async function interculturalResources(scope: StaffProgramScope, id: string) {
  return getAvailableInterculturalResources(scope, (interculturalSources as Record<string, { title: string; href: string; note: string }[]>)[id] ?? []);
}

async function interculturalLessonDocument(id: string, scope: StaffProgramScope): Promise<ResourceDocument | null> {
  const index = interculturalCurriculum.modules.findIndex((module) => module.id === id);
  const module = interculturalCurriculum.modules[index];
  if (!module || !(await interculturalAvailable(scope))) return null;
  const [communities, resources] = await Promise.all([interculturalCommunities(scope), interculturalResources(scope, id)]);
  return {
    kicker: kicker(scope, INTERCULTURAL_KICKER),
    title: module.title,
    subtitle: `Part ${index + 1} of ${interculturalCurriculum.modules.length} in ${interculturalCurriculum.title}`,
    meta: [
      { label: "Curriculum", value: interculturalCurriculum.title },
    ],
    sections: interculturalLessonSections(module, index, communities, resources),
    sources: resources.length ? sourcesFrom(resources) : undefined,
    attribution: programName(scope),
  };
}

async function interculturalCurriculumDocument(scope: StaffProgramScope): Promise<ResourceDocument | null> {
  if (!(await interculturalAvailable(scope))) return null;
  const [communities, resourceLists] = await Promise.all([
    interculturalCommunities(scope),
    Promise.all(interculturalCurriculum.modules.map((module) => interculturalResources(scope, module.id))),
  ]);
  const allResources = resourceLists.flat().filter((item, index, list) => list.findIndex((other) => other.href === item.href) === index);
  return {
    kicker: kicker(scope, INTERCULTURAL_KICKER),
    title: interculturalCurriculum.title,
    subtitle: "Bring curiosity, care and practical questions to the work in front of you.",
    meta: [{ label: "Parts", value: String(interculturalCurriculum.modules.length) }],
    sections: compactSections([
      section("A connected path, at your own pace", [
        paragraph("Follow one work example through seven parts, from noticing an assumption to listening and learning from a change. Choose the parts and resources that support your work."),
        paragraph("You can pause and revisit a section. Leave names, case details and other private information out of learning notes."),
      ]),
      section("The parts", [numbered(interculturalCurriculum.modules.map((module) => module.title))]),
      ...interculturalCurriculum.modules.map((module, index) =>
        asPart(partLabel(module.id, module.title), interculturalLessonSections(module, index, communities, resourceLists[index] ?? [])),
      ),
    ]),
    sources: allResources.length ? sourcesFrom(allResources) : undefined,
    attribution: programName(scope),
  };
}

/* ---------- Entry points ---------- */

export async function curriculumDownloadDocument(kind: DownloadKind, id: string, scope: StaffProgramScope): Promise<ResourceDocument | null> {
  switch (kind) {
    case "clas-curriculum":
      return id === OVERVIEW_ID ? clasCurriculumDocument(scope) : null;
    case "clas-lesson":
      return clasLessonDocument(id, scope);
    case "toolkit-curriculum":
      return id === OVERVIEW_ID ? toolkitCurriculumDocument(scope) : null;
    case "toolkit-lesson":
      return toolkitLessonDocument(id, scope);
    case "intercultural-curriculum":
      return id === OVERVIEW_ID ? interculturalCurriculumDocument(scope) : null;
    case "intercultural-lesson":
      return interculturalLessonDocument(id, scope);
    default:
      return null;
  }
}

export async function curriculumDownloadIds(scope: StaffProgramScope): Promise<ElearningId[]> {
  const [toolkitOpen, interculturalOpen] = await Promise.all([toolkitAvailable(scope), interculturalAvailable(scope)]);
  return [
    { kind: "clas-curriculum", id: OVERVIEW_ID },
    ...clasCurriculum.modules.map((module): ElearningId => ({ kind: "clas-lesson", id: module.id })),
    ...(toolkitOpen ? [{ kind: "toolkit-curriculum", id: OVERVIEW_ID } as ElearningId, ...toolkit.modules.map((lesson): ElearningId => ({ kind: "toolkit-lesson", id: lesson.id }))] : []),
    ...(interculturalOpen
      ? [{ kind: "intercultural-curriculum", id: OVERVIEW_ID } as ElearningId, ...interculturalCurriculum.modules.map((module): ElearningId => ({ kind: "intercultural-lesson", id: module.id }))]
      : []),
  ];
}
