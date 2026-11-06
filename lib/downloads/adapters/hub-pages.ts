import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import reference from "@/data/organization/minnesota-dhs.json";
import { PROGRAM } from "@/lib/constants";
import { prepareEditableSurface } from "@/lib/content/prepare-editable-surface";
import { PODCASTS } from "@/lib/content/podcasts";
import { PODCAST_SUPPLEMENTS } from "@/lib/content/podcast-supplements";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { linkListValue, stringListValue, stringValue } from "@/lib/content/staff-surface-registry";
import { ADSA_IMPLEMENTATION_GOALS } from "@/lib/program/adsa-implementation";
import { logicStages } from "@/lib/program/dsd-logic-model";
import { practiceGuides } from "@/lib/program/dsd-practice-guides";
import { ADMINISTRATION_NAVIGATION, DIVISION_BRANCH_TOPICS, ORGANIZATION_DIRECTORY_URL, ORGANIZATION_NAVIGATION_SOURCE_NOTE, administrationNavigation, organizationTopics } from "@/lib/product/organization-navigation";
import { bullets, callout, compactSections, heading, paragraph, section, table, type DocumentBlock, type DocumentSource, type ResourceDocument } from "../model";
import { dateText } from "./hub-outreach";
import { kicker, linkList, programName } from "./shared";

// Other public pages with substantial content and no download of their own. Ids are
// "<page>~<id>" so one kind can carry several page families.

function pageDocument(scope: StaffProgramScope, noun: string, rest: Omit<ResourceDocument, "kicker" | "attribution">): ResourceDocument {
  return { kicker: kicker(scope, noun), attribution: programName(scope), ...rest };
}

function practiceGuideDocument(slug: string, scope: StaffProgramScope): ResourceDocument | null {
  const guide = practiceGuides.find(item => item.slug === slug);
  if (!guide) return null;
  return pageDocument(scope, "Practice guide", {
    title: guide.title,
    subtitle: guide.introduction,
    meta: [
      { label: "When to use it", value: guide.purpose },
      { label: "Page", value: `program page /practice-guides/${guide.slug}` },
    ],
    sections: compactSections([
      section(undefined, [paragraph(guide.summary)]),
      section("Steps", guide.steps.flatMap((step, index): DocumentBlock[] => [heading(`${index + 1}. ${step.title}`), paragraph(step.body), paragraph([{ text: step.question, italic: true }])])),
      section("What this could look like", [paragraph(guide.example)]),
      section("Bring it back to your work", [
        paragraph(guide.review),
        paragraph("After the appropriate decision and use of an approach, record an observation and its limits (program page /program/reflection). Bring what you learn back to the people who contributed and to the next review."),
      ]),
      section("Keep the guidance close", [
        paragraph("Use these resources to prepare for the task in front of you. It supports preparation and reflection; it does not replace policy or required approval."),
        table(["Resource", "What it helps with", "Page"], guide.resources.map(resource => [resource.title, resource.purpose, resource.href])),
      ]),
    ]),
  });
}

function programStageDocument(slug: string, scope: StaffProgramScope): ResourceDocument | null {
  const stage = logicStages.find(item => item.slug === slug);
  if (!stage) return null;
  return pageDocument(scope, "How the program connects learning with work", {
    title: stage.label,
    subtitle: stage.introduction,
    meta: [
      { label: "Question", value: stage.question },
      { label: "Page", value: `program page /program/${stage.slug}` },
    ],
    sections: compactSections([
      section("Explore this area", [table(["Resource", "What it offers", "Page"], stage.resources.map(resource => [resource.title, resource.description, resource.href]))]),
      section("Bring it into your work", [paragraph(stage.explanation), heading("A question for reflection"), paragraph(stage.reflection)]),
    ]),
  });
}

function implementationDocument(scope: StaffProgramScope): ResourceDocument {
  return pageDocument(scope, "How the program connects learning with work", {
    title: "From equity goals to implementation",
    subtitle: "Connect an action step from the Aging and Disability Services Administration Equity and Inclusion Implementation Plan with the work, knowledge, participation and evidence needed to carry it forward.",
    meta: [
      { label: "Goals", value: String(ADSA_IMPLEMENTATION_GOALS.length) },
      { label: "Action steps", value: String(ADSA_IMPLEMENTATION_GOALS.reduce((sum, goal) => sum + goal.actions.length, 0)) },
    ],
    sections: compactSections([
      section("One connected piece of work", [
        paragraph("The Aging and Disability Services Administration Equity and Inclusion Implementation Plan sets out six goals and twenty-eight action steps for administration and division work. The supporting tools help people prepare, review, implement and learn from that work."),
        paragraph("Begin with an actual question, responsibility or desired outcome. Where an action step applies, connect it to that work. Choose a useful work product, involve the people whose knowledge is needed, and seek the responsible decision. Revisit the work to examine implementation, barriers and results."),
        callout("The action steps below keep the wording of the supplied plan. Divisions choose approaches suited to their work while staying aligned with the plan and applicable requirements. The suggested work products, questions and resource connections can be adapted; they are not a prescribed sequence or an additional set of mandates."),
      ]),
      ...ADSA_IMPLEMENTATION_GOALS.map(goal =>
        section(`Goal ${goal.number}: ${goal.title}`, goal.actions.flatMap((action): DocumentBlock[] => [
          heading(action.sourceText),
          paragraph([{ text: "A useful work product: ", bold: true }, { text: action.workProduct }]),
          paragraph([{ text: "How consultant expertise supports the work", bold: true }]),
          bullets(action.capabilities.map(capability => capability.label.replaceAll("DEIA", "equity, inclusion and accessibility"))),
          paragraph([{ text: "Questions for implementation and review", bold: true }]),
          bullets(action.evidenceQuestions),
          ...(action.dependencies.length ? [paragraph([{ text: "References or decisions still needed", bold: true }]), bullets(action.dependencies)] : []),
          paragraph([{ text: "Tools: ", bold: true }, { text: action.tools.map(tool => tool.href).join(", ") }]),
        ])),
      ),
      section("Carry the work forward", [
        paragraph("Keep the selected action step with the analysis or plan, its source references, open questions, responsible roles and agreed next action. A completed worksheet records preparation. An implementation record describes what was actually done. Evidence of results explains what changed, for whom, and what remains uncertain."),
      ]),
    ]),
  });
}

type ReferenceSource = { id: string; title: string; url: string; checkedOn?: string };

function topicSections(ids: readonly string[]): { blocks: DocumentBlock[]; sources: DocumentSource[] } {
  const sources = reference.sources as ReferenceSource[];
  const topics = organizationTopics(ids).filter(Boolean);
  const used = new Map<string, ReferenceSource>();
  const blocks = topics.flatMap((topic): DocumentBlock[] => {
    const own = topic.sourceIds.map(id => sources.find(source => source.id === id)).filter((source): source is ReferenceSource => Boolean(source));
    own.forEach(source => used.set(source.id, source));
    return [
      heading(topic.title),
      paragraph(topic.facts),
      paragraph(`Sources: ${own.map(source => `${source.title} (${source.url}), checked ${dateText(source.checkedOn)}`).join("; ")}`),
      paragraph(`More on this topic — program page /understanding-dhs#${topic.id.replace(/^ext-dhs-org-/, "")}`),
    ];
  });
  return { blocks, sources: [...used.values()].map(source => ({ title: source.title, href: source.url, note: `Checked ${dateText(source.checkedOn)}` })) };
}

function administrationDocument(id: string, scope: StaffProgramScope): ResourceDocument | null {
  const division = id === "dsd";
  const area = division ? undefined : administrationNavigation(id);
  if (!division && !area) return null;
  const topics = topicSections(division ? DIVISION_BRANCH_TOPICS : area!.topics);
  return pageDocument(scope, division ? "Aging and Disability Services Administration" : "Organizational context", {
    title: division ? "Disability Services Division" : area!.name,
    subtitle: division ? "The Disability Services Division brings together service knowledge, workplace practice and practical equity resources in the standalone One DSD program." : area!.description,
    meta: [{ label: "Page", value: division ? "program page /administrations/adsa/divisions/dsd" : `program page /administrations/${area!.id}` }],
    sections: compactSections([
      section(division ? "Disability services context" : "Services and working relationships", topics.blocks),
      section("Current organization and contacts", [paragraph(`${ORGANIZATION_NAVIGATION_SOURCE_NOTE} ${ORGANIZATION_DIRECTORY_URL}`)]),
    ]),
    sources: [...topics.sources, { title: "Department of Human Services agencywide directory", href: ORGANIZATION_DIRECTORY_URL }],
  });
}

function clock(seconds: number): string {
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}

async function transcriptSegments(url: string | undefined): Promise<Array<{ start: number; text: string }> | null> {
  if (!url) return null;
  try {
    const file = path.join(process.cwd(), "public", url.split("?")[0].replace(/^\/+/, ""));
    const data = JSON.parse(await readFile(file, "utf8")) as { segments?: Array<{ start: number; text: string }> };
    return Array.isArray(data.segments) ? data.segments : null;
  } catch {
    return null;
  }
}

async function podcastDocument(id: string, scope: StaffProgramScope): Promise<ResourceDocument | null> {
  const podcast = PODCASTS.find(item => item.id === id);
  if (!podcast) return null;
  const surface = await prepareEditableSurface(podcast.surfaceId, { scope, includeOwner: false });
  if (!surface.available) return null;
  const support = PODCAST_SUPPLEMENTS[podcast.id];
  const chapters = support?.chapters ?? [];
  const segments = await transcriptSegments(support?.transcriptUrl);
  const transcript: DocumentBlock[] = [];
  if (segments?.length) {
    const starts = chapters.length ? chapters : [{ start: 0, title: "Transcript" }];
    starts.forEach((chapter, index) => {
      const end = starts[index + 1]?.start ?? Number.POSITIVE_INFINITY;
      const text = segments.filter(segment => segment.start >= chapter.start && segment.start < end).map(segment => segment.text.trim()).filter(Boolean).join(" ");
      if (text) transcript.push(heading(`${clock(chapter.start)} ${chapter.title}`), paragraph(text));
    });
  }
  return pageDocument(scope, "Podcast", {
    title: stringValue(surface.values, "title"),
    subtitle: stringValue(surface.values, "intro"),
    meta: [
      { label: "Length", value: podcast.duration },
      { label: "Page", value: `program page /podcasts/${podcast.id}` },
    ],
    sections: compactSections([
      section("Chapters", [chapters.length ? table(["Starts at", "Topic"], chapters.map(chapter => [clock(chapter.start), chapter.title])) : null]),
      section("Transcript", transcript.length ? [callout("This transcript was made automatically from the recording. Listen to the recording to check a passage before you quote it."), ...transcript] : []),
    ]),
    sources: [{ title: `Recording: ${stringValue(surface.values, "title")}`, href: podcast.src, note: podcast.duration }],
  });
}

async function aboutDocument(scope: StaffProgramScope): Promise<ResourceDocument | null> {
  const surface = await prepareEditableSurface("about.page", { scope, includeOwner: false });
  if (!surface.available) return null;
  const copy = surface.values;
  const text = (key: string) => stringValue(copy, key);
  return pageDocument(scope, text("introKicker") || "About", {
    title: text("introTitle"),
    subtitle: text("introLede"),
    meta: [{ label: "Page", value: "program page /about" }],
    sections: compactSections([
      section(text("purposeTitle"), [paragraph(text("purposeBody")), paragraph(PROGRAM.leadershipStatement), paragraph(text("purposeBoundary"))]),
      section(text("federationTitle"), [paragraph(text("federationBody")), paragraph(text("federationBoundary"))]),
      section(text("participationTitle"), [heading(text("voluntaryTitle")), paragraph(text("voluntaryBody")), heading(text("requiredTitle")), paragraph(text("requiredBody"))]),
      section(text("sourcesTitle"), [paragraph(text("sourcesBody").replace(/\b(?:its\s+)?review date,\s*/gi, "")), paragraph(text("sourcesBoundary"))]),
      section(text("boundariesTitle"), [bullets(stringListValue(copy, "boundaries"))]),
      section(text("supportTitle"), [paragraph(text("supportBody")), linkList(linkListValue(copy, "supportLinks"))]),
    ]),
  });
}

/** Ids for the other public pages, for tests and page wiring. */
export function extraPageIds(): string[] {
  return [
    ...practiceGuides.map(guide => `practice-guide~${guide.slug}`),
    ...logicStages.map(stage => `program-stage~${stage.slug}`),
    "program-implementation",
    ...ADMINISTRATION_NAVIGATION.map(area => `administration~${area.id}`),
    "administration~dsd",
    ...PODCASTS.map(podcast => `podcast~${podcast.id}`),
    "about",
  ];
}

export async function extraPageDocument(id: string, scope: StaffProgramScope): Promise<ResourceDocument | null> {
  if (id === "program-implementation") return implementationDocument(scope);
  if (id === "about") return aboutDocument(scope);
  const [family, key] = id.split("~");
  if (!key) return null;
  switch (family) {
    case "practice-guide":
      return practiceGuideDocument(key, scope);
    case "program-stage":
      return programStageDocument(key, scope);
    case "administration":
      return administrationDocument(key, scope);
    case "podcast":
      return podcastDocument(key, scope);
    default:
      return null;
  }
}
