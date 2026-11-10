import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { TRAINING_CREDIT_NOTICE } from "@/lib/program/learning-credit";
import {
  bullets,
  compactSections,
  heading,
  paragraph,
  section,
  type DocumentBlock,
  type DocumentSection,
  type DocumentSource,
  type ResourceDocument,
} from "../model";
import { kicker, programName } from "./shared";

/** A self-directed course number: Foundation, Intermediate or Advanced, 01 to 24. */
export const SELF_DIRECTED_COURSE_NUMBER = /^[FIA](?:0[1-9]|1[0-9]|2[0-4])$/;

type SlideLink = { name: string; text: string; target: number };
type Slide = { number: number; hidden: boolean; text: string; narration: string; links: SlideLink[] };
type CourseEntry = { number: string; title: string; dataFile: string; curriculum: boolean };
type CourseData = { number: string; title: string; level: string; audience: string; outcomes: string[]; sources: { title: string; url: string }[]; slides: Slide[] };

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function playerFolder(publicRoot: string): string {
  return path.join(publicRoot, "learning", "self-directed");
}

/** The course list the self-directed page itself embeds, so a download always matches the page. */
async function courseEntries(publicRoot: string): Promise<CourseEntry[]> {
  try {
    const html = await readFile(path.join(playerFolder(publicRoot), "index.html"), "utf8");
    const source = html.match(/<script\b[^>]*\bid=["']course-data["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
    const list: unknown = source ? JSON.parse(source) : [];
    if (!Array.isArray(list)) return [];
    return list.flatMap((item: Record<string, unknown>): CourseEntry[] => {
      const number = text(item?.number);
      const dataFile = text(item?.dataFile);
      if (!SELF_DIRECTED_COURSE_NUMBER.test(number) || !new RegExp(`^data/${number}-[a-f0-9]{12}\\.json$`).test(dataFile)) return [];
      return [{ number, title: text(item.title), dataFile, curriculum: item.curriculum === true }];
    });
  } catch {
    return [];
  }
}

function slides(value: unknown): Slide[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((slide: Record<string, unknown>): Slide[] => {
    if (!slide || !Number.isInteger(slide.number)) return [];
    const links = Array.isArray(slide.links)
      ? slide.links.flatMap((link: Record<string, unknown>): SlideLink[] => (link && Number.isInteger(link.target) ? [{ name: text(link.name), text: text(link.text), target: link.target as number }] : []))
      : [];
    return [{ number: slide.number as number, hidden: slide.hidden === true, text: text(slide.text), narration: text(slide.narration), links }];
  });
}

async function courseData(entry: CourseEntry, publicRoot: string): Promise<CourseData | null> {
  try {
    const raw = JSON.parse(await readFile(path.join(playerFolder(publicRoot), entry.dataFile), "utf8")) as Record<string, unknown>;
    const list = slides(raw.slides);
    if (raw.number !== entry.number || list.length === 0) return null;
    return {
      number: entry.number,
      title: text(raw.title) || entry.title,
      level: text(raw.level),
      audience: text(raw.audience),
      outcomes: Array.isArray(raw.outcomes) ? raw.outcomes.map(text).filter(Boolean) : [],
      sources: Array.isArray(raw.sources) ? raw.sources.flatMap((source: Record<string, unknown>) => (text(source?.title) ? [{ title: text(source.title), url: text(source.url) }] : [])) : [],
      slides: list,
    };
  } catch {
    return null;
  }
}

/** A page's own wording: its first line is the page title; button labels and slide-show instructions are left out. */
function pageText(slide: Slide): { title: string; body: string[] } {
  const labels = new Set(slide.links.map((link) => link.text));
  const lines = slide.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !labels.has(line) && !/^In Slide Show view\b/i.test(line));
  const [title = "", ...body] = lines;
  return { title, body };
}

function explanationBlocks(narration: string): DocumentBlock[] {
  return narration ? [heading("Learning explanation"), ...narration.split(/\r?\n\s*\r?\n/).map((part) => paragraph(part))] : [];
}

function pageSection(slide: Slide, position: number, byNumber: ReadonlyMap<number, Slide>): DocumentSection {
  const { title, body } = pageText(slide);
  const answers = slide.links.filter((link) => link.name.startsWith("Answer") && link.text);
  const blocks: DocumentBlock[] = [...body.map((line) => paragraph(line)), ...explanationBlocks(slide.narration)];
  if (answers.length > 0) {
    blocks.push(heading("Responses to consider"), bullets(answers.map((answer) => answer.text)));
    for (const answer of answers) {
      const explanation = byNumber.get(answer.target);
      if (!explanation?.hidden) continue;
      const detail = pageText(explanation);
      blocks.push(
        paragraph([{ text: `Explanation for ${answer.text}`, bold: true }]),
        ...[detail.title, ...detail.body].filter(Boolean).map((line) => paragraph(line)),
        ...(explanation.narration ? explanation.narration.split(/\r?\n\s*\r?\n/).map((part) => paragraph(part)) : []),
      );
    }
  }
  return section(title ? `Page ${position}: ${title}` : `Page ${position}`, blocks);
}

function sourceEntry(source: { title: string; url: string }): DocumentSource {
  if (/^https?:\/\//i.test(source.url)) return { title: source.title, href: source.url };
  return source.url.startsWith("/") ? { title: source.title, note: `program page ${source.url}` } : { title: source.title };
}

/** Self-directed course numbers that can be downloaded, in the order the page lists them. */
export async function selfDirectedDownloadIds(publicRoot = path.join(process.cwd(), "public")): Promise<string[]> {
  return (await courseEntries(publicRoot)).map((entry) => entry.number);
}

/**
 * A self-directed course as a document: its outcomes, then every page in order with its
 * learning explanation, and each practice response with the explanation the page shows for it.
 * Built from the same data file the self-directed page opens. Returns null for an unknown number.
 */
export async function selfDirectedCourseDocument(id: string, scope: StaffProgramScope, publicRoot = path.join(process.cwd(), "public")): Promise<ResourceDocument | null> {
  if (!SELF_DIRECTED_COURSE_NUMBER.test(id)) return null;
  const entry = (await courseEntries(publicRoot)).find((item) => item.number === id);
  if (!entry) return null;
  const course = await courseData(entry, publicRoot);
  if (!course) return null;
  const byNumber = new Map(course.slides.map((slide) => [slide.number, slide]));
  const visible = course.slides.filter((slide) => !slide.hidden);
  if (visible.length === 0) return null;
  return {
    kicker: kicker(scope, "Self-directed learning"),
    title: course.title,
    subtitle: [course.level, course.audience].filter(Boolean).join(" · ") || undefined,
    meta: [
      { label: "Course", value: course.number },
      { label: "Learning level", value: course.level },
      { label: "Audience", value: course.audience },
      { label: "Curriculum", value: entry.curriculum ? "Equity in Policy and Legislative Practice" : "" },
      { label: "Pages", value: String(visible.length) },
      { label: "Program page", value: `/learning/self-directed/index.html?course=${course.number}` },
    ].filter((row) => row.value),
    sections: compactSections([
      section("What you can practice in this course", course.outcomes.length > 0 ? [bullets(course.outcomes)] : []),
      ...visible.map((slide, index) => pageSection(slide, index + 1, byNumber)),
      section(undefined, [paragraph(TRAINING_CREDIT_NOTICE)]),
    ]),
    sources: course.sources.map(sourceEntry),
    attribution: programName(scope),
  };
}
