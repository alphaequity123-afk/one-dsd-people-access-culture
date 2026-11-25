import "server-only";
import completedPodcasts from "@/lib/content/courses/completed-podcasts.json";
import { CoursePackSchema } from "@/lib/content/courses/contract";
import { withCourseCover } from "@/lib/content/courses/cover-overrides";
import { lessonImageOverrides } from "@/lib/content/courses/lesson-image-overrides";
import { courseLink, courseSummary, courseText, lessonObjectives, publishedCourses, sanitizedLesson } from "@/lib/content/courses/published";
import type { Block, CoursePack, Lesson } from "@/lib/content/courses/source-types";
import { prepareEditableSurface } from "@/lib/content/prepare-editable-surface";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { getEditableSurfaceDefinition } from "@/lib/content/staff-surface-registry";
import { REFERRAL_ONLY_COURSE_IDS, isRetiredCulturalWorkshop } from "@/lib/program/retired-features";
import { TRAINING_CREDIT_NOTICE } from "@/lib/program/learning-credit";
import type { DownloadKind } from "../catalog";
import { decodeEntities, htmlToBlocks } from "../html-text";
import {
  bullets,
  callout,
  compactSections,
  fields,
  heading,
  paragraph,
  quote,
  section,
  table,
  type DocumentBlock,
  type DocumentSection,
  type InlineRun,
  type ResourceDocument,
} from "../model";
import { kicker, programName } from "./shared";

/** Lesson download ids join the course and lesson ids with this separator. */
export const LESSON_ID_SEPARATOR = "~";

export function lessonDownloadId(courseId: string, lessonId: string): string {
  return `${courseId}${LESSON_ID_SEPARATOR}${lessonId}`;
}

type Podcast = { src: string; transcript: string; seconds: number };

/** The same course pack the course page shows, or null when it is not published, retired or referral only. */
async function loadCoursePack(courseId: string, scope: StaffProgramScope): Promise<CoursePack | null> {
  if (!courseId || REFERRAL_ONLY_COURSE_IDS.has(courseId)) return null;
  const surfaceId = `course.${courseId}`;
  if (!getEditableSurfaceDefinition(surfaceId)) return null;
  const surface = await prepareEditableSurface(surfaceId, { scope, includeOwner: false });
  if (!surface.available) return null;
  const parsed = CoursePackSchema.safeParse(surface.values.pack);
  if (!parsed.success) return null;
  const pack = withCourseCover(parsed.data);
  if (REFERRAL_ONLY_COURSE_IDS.has(pack.course.id) || isRetiredCulturalWorkshop(pack.course)) return null;
  const podcast = (completedPodcasts as Record<string, Podcast>)[pack.course.id];
  return podcast ? { ...pack, course: { ...pack.course, introAudio: podcast.src, introTranscript: podcast.transcript } } : pack;
}

/** Authored lesson HTML as document blocks, with headings kept below the section heading. */
function rich(value: string | undefined): DocumentBlock[] {
  if (!value) return [];
  return htmlToBlocks(value).map((block) => (block.kind === "heading" ? { ...block, level: 3 as const } : block));
}

/** Authored HTML as one line of text runs, for list items and table cells. */
function inline(value: string | undefined): InlineRun[] {
  if (!value) return [];
  const blocks = htmlToBlocks(value);
  if (blocks.length === 1 && blocks[0].kind === "paragraph") return blocks[0].runs;
  const text = plain(value);
  return text ? [{ text }] : [];
}

function plain(value: string | undefined): string {
  return value ? decodeEntities(courseText(value)).replace(/\s+/g, " ").trim() : "";
}

function labelled(label: string, value: string | undefined): DocumentBlock[] {
  const blocks = rich(value);
  if (blocks.length === 0) return [];
  const [first, ...rest] = blocks;
  if (first.kind === "paragraph") return [paragraph([{ text: `${label}: `, bold: true }, ...first.runs]), ...rest];
  return [paragraph([{ text: label, bold: true }]), ...blocks];
}

function lessonBlock(block: Block): DocumentBlock[] {
  switch (block.type) {
    case "text":
      return [block.heading ? heading(plain(block.heading)) : null, ...rich(block.body)].filter((item): item is DocumentBlock => Boolean(item));
    case "image": {
      const caption = lessonImageOverrides[block.src]?.caption ?? block.caption;
      return caption && plain(caption) ? [paragraph([{ text: plain(caption), italic: true }])] : [];
    }
    case "video":
    case "audio":
      return block.transcript ? [heading("Transcript"), ...block.transcript.split(/\r?\n\s*\r?\n/).map((part) => paragraph(part))] : [];
    case "statement":
      return plain(block.body) ? [callout(plain(block.body))] : [];
    case "quote":
      return plain(block.text) ? [quote(plain(block.text), block.cite ? plain(block.cite) : undefined)] : [];
    case "list":
      return [block.heading ? heading(plain(block.heading)) : null, bullets(block.items.map(inline), Boolean(block.ordered))].filter((item): item is DocumentBlock => Boolean(item));
    case "leaderMove":
      return [
        heading(plain(block.heading) || "Put it into practice"),
        ...labelled("What you can change", block.control),
        ...labelled("What to watch for", block.failure),
        ...labelled("Your next step", block.next),
      ];
    case "artifact":
      return [
        heading(plain(block.title)),
        ...rich(block.summary),
        fields(block.fields.map((field) => ({ label: plain(field.label), value: plain(field.value) }))),
        ...rich(block.action),
      ];
    case "flashcards":
      return [
        heading(plain(block.heading) || "Flashcards"),
        table(["Card", "On the back"], block.cards.map((card) => [plain(card.front), plain(card.back)])),
      ];
    case "accordion":
      return [
        block.heading ? heading(plain(block.heading)) : null,
        ...block.items.flatMap((item) => labelled(plain(item.title), item.body)),
      ].filter((item): item is DocumentBlock => Boolean(item));
    case "tabs":
      return [
        block.heading ? heading(plain(block.heading)) : null,
        ...block.tabs.flatMap((tab) => labelled(plain(tab.label), tab.body)),
      ].filter((item): item is DocumentBlock => Boolean(item));
    case "timeline":
      return [
        block.heading ? heading(plain(block.heading)) : null,
        table(["When", "What happened", "Details"], block.events.map((event) => [plain(event.year), plain(event.title), plain(event.body)])),
      ].filter((item): item is DocumentBlock => Boolean(item));
    case "knowledgeCheck":
      return [
        heading("Check your understanding"),
        paragraph([{ text: plain(block.question), bold: true }]),
        bullets(block.options.map((option) => (option.correct ? [...inline(option.text), { text: " (supported answer)", bold: true }] : inline(option.text)))),
        ...labelled("Why", block.feedbackCorrect),
      ];
    case "sorting":
      return [
        heading(plain(block.heading) || "Match each example"),
        paragraph(`Categories: ${block.categories.map(plain).join("; ")}.`),
        table(["Example", "Category it fits"], block.items.map((item) => [plain(item.text), plain(item.category)])),
      ];
  }
}

/** Everything the lesson page teaches, in page order. No answers, notes or progress from any learner. */
function lessonSections(source: Lesson): DocumentSection[] {
  const lesson = sanitizedLesson(source);
  const objectives = lessonObjectives(source).map(plain).filter(Boolean);
  const scenario = lesson.scenario;
  const learning = lesson.learning;
  return compactSections([
    section("What you’ll be able to do", [bullets(objectives)]),
    section("Lesson", lesson.blocks.flatMap(lessonBlock)),
    section(
      scenario ? "Try a situation" : undefined,
      scenario
        ? [
            ...rich(scenario.context),
            paragraph([{ text: plain(scenario.prompt), bold: true }]),
            ...scenario.options.flatMap((option, index) => [
              paragraph([
                { text: `Response ${index + 1}${option.recommended ? " (suggested response)" : ""}: `, bold: true },
                ...inline(option.label),
              ]),
              ...rich(option.response),
            ]),
          ]
        : [],
    ),
    section(
      learning?.takeaways.length ? "Carry this forward" : undefined,
      learning?.takeaways.length ? [bullets(learning.takeaways.map(inline)), ...rich(learning.evidence), ...rich(learning.appliedNextStep)] : [],
    ),
    section(lesson.transfer ? "Your next step" : undefined, lesson.transfer ? [...rich(lesson.transfer.prompt), bullets(lesson.transfer.options.map(inline))] : []),
  ]);
}

/** Lesson sections folded into one section for the whole-course copy. */
function lessonAsOneSection(lesson: Lesson, index: number): DocumentSection {
  const blocks: DocumentBlock[] = [];
  if (plain(lesson.summary)) blocks.push(paragraph([{ text: plain(lesson.summary), italic: true }]));
  for (const part of lessonSections(lesson)) {
    if (part.heading) blocks.push(heading(part.heading));
    blocks.push(...part.blocks);
  }
  return section(`Lesson ${index + 1}: ${plain(lesson.title)}`, blocks);
}

function jobAidSection(pack: CoursePack): DocumentSection {
  const aid = pack.jobAid;
  return section(plain(aid.title) || "Job aid", [
    plain(aid.subtitle) ? paragraph([{ text: plain(aid.subtitle), italic: true }]) : null,
    aid.quote && plain(aid.quote) ? quote(plain(aid.quote)) : null,
    aid.use ? paragraph(plain(aid.use.purpose)) : null,
    aid.use ? bullets(aid.use.remember.map(plain)) : null,
    aid.use ? paragraph(plain(aid.use.doNext)) : null,
    ...aid.sections.flatMap((part) => [heading(plain(part.heading)), bullets(part.items.map(plain))]),
  ]);
}

function courseSources(pack: CoursePack) {
  return pack.sources.map((source) => ({ title: plain(source.title), href: courseLink(source.href), note: plain(source.note) || undefined }));
}

function courseDocument(pack: CoursePack, scope: StaffProgramScope): ResourceDocument {
  const course = pack.course;
  const transcript = course.introTranscript?.trim();
  const conversation = Boolean((completedPodcasts as Record<string, Podcast>)[course.id]) || /^(ei-|cv-|cw-)/.test(course.id);
  return {
    kicker: kicker(scope, plain(course.seriesLabel) || "Course"),
    title: plain(course.title),
    subtitle: courseSummary(pack),
    meta: [
      { label: "Length", value: plain(course.duration) },
      { label: "Lessons", value: String(course.lessons.length) },
      { label: "Participation", value: "Voluntary learning" },
    ].filter((row) => row.value),
    sections: compactSections([
      section(
        transcript ? (conversation ? "The conversation" : "Introduction") : undefined,
        transcript ? transcript.split(/\r?\n\s*\r?\n/).map((part) => paragraph(part.replace(/\s+/g, " "))) : [],
      ),
      section(
        course.learning ? "Put this learning to use" : undefined,
        course.learning
          ? [
              paragraph(plain(course.learning.appliedNextStep)),
              heading("What you’ll be able to do"),
              bullets(course.learning.objectives.map(plain)),
              heading("What you’ll practice and prepare"),
              bullets(course.learning.evidence.map(plain)),
            ]
          : [],
      ),
      section(course.scope && /^sm-/.test(course.id) ? "About this course" : undefined, course.scope && /^sm-/.test(course.id) ? [paragraph(plain(course.scope))] : []),
      section("Course outline", [
        table(
          ["Lesson", "Title", "Summary", "Time"],
          course.lessons.map((lesson, index) => [String(index + 1), plain(lesson.title), plain(lesson.summary), lesson.minutes > 0 ? `${lesson.minutes} minutes` : ""]),
        ),
      ]),
      ...course.lessons.map(lessonAsOneSection),
      jobAidSection(pack),
      section(undefined, [paragraph(TRAINING_CREDIT_NOTICE)]),
    ]),
    sources: courseSources(pack),
    attribution: programName(scope),
  };
}

function lessonDocument(pack: CoursePack, lessonIndex: number, scope: StaffProgramScope): ResourceDocument {
  const course = pack.course;
  const lesson = course.lessons[lessonIndex];
  return {
    kicker: kicker(scope, `${plain(course.title)} · Lesson ${lessonIndex + 1} of ${course.lessons.length}`),
    title: plain(lesson.title),
    subtitle: plain(lesson.summary),
    meta: [
      { label: "Course", value: plain(course.title) },
      { label: "Time", value: lesson.minutes > 0 ? `${lesson.minutes} minutes` : "" },
    ].filter((row) => row.value),
    sections: compactSections([...lessonSections(lesson), section(undefined, [paragraph(TRAINING_CREDIT_NOTICE)])]),
    attribution: programName(scope),
  };
}

export async function courseDownloadDocument(kind: DownloadKind, id: string, scope: StaffProgramScope): Promise<ResourceDocument | null> {
  if (kind === "course") {
    const pack = await loadCoursePack(id, scope);
    return pack ? courseDocument(pack, scope) : null;
  }
  if (kind === "lesson") {
    const separator = id.indexOf(LESSON_ID_SEPARATOR);
    if (separator <= 0) return null;
    const courseId = id.slice(0, separator);
    const lessonId = id.slice(separator + LESSON_ID_SEPARATOR.length);
    const pack = await loadCoursePack(courseId, scope);
    if (!pack) return null;
    const index = pack.course.lessons.findIndex((lesson) => lesson.id === lessonId);
    return index >= 0 ? lessonDocument(pack, index, scope) : null;
  }
  return null;
}

/** Every published course and lesson in this program view. Referral-only and retired courses are never listed. */
export async function courseDownloadIds(scope: StaffProgramScope): Promise<{ kind: DownloadKind; id: string }[]> {
  const courses = await publishedCourses(scope);
  return courses
    .filter(({ pack }) => !REFERRAL_ONLY_COURSE_IDS.has(pack.course.id))
    .flatMap(({ pack }) => [
      { kind: "course" as const, id: pack.course.id },
      ...pack.course.lessons.map((lesson) => ({ kind: "lesson" as const, id: lessonDownloadId(pack.course.id, lesson.id) })),
    ]);
}
