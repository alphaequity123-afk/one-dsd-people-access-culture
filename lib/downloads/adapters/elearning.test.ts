import { describe, expect, it } from "vitest";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { DownloadKind } from "../catalog";
import { DOWNLOAD_FORMATS, type DownloadFormat, type ResourceDocument } from "../model";

// Course and curriculum content comes from the files in the repository, never a database.
process.env.PAC_CONTENT_SOURCE = "static";
process.env.PAC_STORE = "memory";

const SCOPE: StaffProgramScope = "dsd";
const CURRICULUM_KINDS = new Set<string>(["clas-curriculum", "clas-lesson", "toolkit-curriculum", "toolkit-lesson", "intercultural-curriculum", "intercultural-lesson"]);
const CHUNK_TIMEOUT = 600_000;

// Imported after the content source is set, and listed once: there are hundreds of courses and thousands of lessons.
const [adapter, render, text, retired, definitions] = await Promise.all([
  import("./elearning"),
  import("../render"),
  import("../exporters/text"),
  import("@/lib/program/retired-features"),
  import("@/lib/content/courses/definitions"),
]);
const ALL_IDS = await adapter.elearningDownloadIds(SCOPE);
const COURSES = ALL_IDS.filter((entry) => entry.kind === "course");
const LESSONS = ALL_IDS.filter((entry) => entry.kind === "lesson");
const CURRICULA = ALL_IDS.filter((entry) => CURRICULUM_KINDS.has(entry.kind));
const OTHERS = ALL_IDS.filter((entry) => !CURRICULUM_KINDS.has(entry.kind) && entry.kind !== "course" && entry.kind !== "lesson");

function chunks<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let start = 0; start < items.length; start += size) result.push(items.slice(start, start + size));
  return result;
}

async function expectRenders(document: ResourceDocument, formats: readonly DownloadFormat[] = DOWNLOAD_FORMATS): Promise<void> {
  for (const format of formats) {
    const buffer = await render.renderResourceDocument(document, format);
    expect(buffer.length, `${document.title} as ${format}`).toBeGreaterThan(0);
    const signature = buffer.subarray(0, format === "pdf" ? 4 : 2).toString("latin1");
    expect(signature, `${document.title} as ${format}`).toBe(format === "pdf" ? "%PDF" : "PK");
  }
}

async function resolved(kind: DownloadKind, id: string): Promise<ResourceDocument> {
  const document = await adapter.elearningDocument(kind, id, SCOPE);
  expect(document, `${kind}/${id}`).not.toBeNull();
  expect(document!.title.trim(), `${kind}/${id} title`).not.toBe("");
  expect(document!.sections.length, `${kind}/${id} sections`).toBeGreaterThan(0);
  return document!;
}

describe("eLearning downloads", () => {
  it("lists every published course, each lesson and every curriculum part", () => {
    const kinds = new Set(ALL_IDS.map((entry) => entry.kind));
    for (const kind of ["course", "lesson", "clas-curriculum", "clas-lesson", "toolkit-curriculum", "toolkit-lesson", "intercultural-curriculum", "intercultural-lesson", "leadership-styles", "reading", "learn-page"]) {
      expect(kinds.has(kind as DownloadKind), kind).toBe(true);
    }
    expect(new Set(ALL_IDS.map((entry) => `${entry.kind}/${entry.id}`)).size).toBe(ALL_IDS.length);
    expect(COURSES.length).toBeGreaterThan(0);
    expect(LESSONS.length).toBeGreaterThan(COURSES.length);
    expect(CURRICULA.length).toBeGreaterThan(0);
  });

  for (const [index, group] of chunks(COURSES, 60).entries()) {
    it(`builds and renders published courses as Word, Excel, PowerPoint and PDF (group ${index + 1})`, async () => {
      for (const { id } of group) {
        const document = await resolved("course", id);
        const plain = text.renderText(document).toString("utf8");
        expect(plain, id).not.toMatch(/<\/?(?:p|strong|em|ul|li|a)\b/);
        await expectRenders(document);
      }
    }, CHUNK_TIMEOUT);
  }

  for (const [index, group] of chunks(LESSONS, 400).entries()) {
    it(`builds and renders course lessons in all four formats (group ${index + 1})`, async () => {
      for (const { id } of group) await expectRenders(await resolved("lesson", id));
    }, CHUNK_TIMEOUT);
  }

  it("builds and renders every curriculum overview and lesson in all four formats", async () => {
    for (const { kind, id } of CURRICULA) await expectRenders(await resolved(kind, id));
  }, CHUNK_TIMEOUT);

  it("builds every other eLearning page and renders a sample in all four formats", async () => {
    for (const [index, { kind, id }] of OTHERS.entries()) {
      const document = await resolved(kind, id);
      if (kind !== "reading" || index % 25 === 0) await expectRenders(document);
    }
  }, CHUNK_TIMEOUT);

  it("never offers the referral-only Native and Tribal courses or their lessons", async () => {
    const referralOnly = retired.REFERRAL_ONLY_COURSE_IDS;
    expect(referralOnly.size).toBeGreaterThan(0);
    for (const courseId of referralOnly) {
      expect(await adapter.elearningDocument("course", courseId, SCOPE), courseId).toBeNull();
      expect(await adapter.elearningDocument("course", courseId, "one-dhs"), courseId).toBeNull();
      expect(await adapter.elearningDocument("lesson", `${courseId}~lesson-1`, SCOPE), courseId).toBeNull();
      expect(ALL_IDS.some((entry) => entry.id === courseId || entry.id.startsWith(`${courseId}~`)), courseId).toBe(false);
    }
    // Lesson ids built from a referral-only course return null even when the lesson exists in the source.
    let checked = 0;
    for (const surface of definitions.ALL_COURSE_SURFACES) {
      const pack = surface.approvedValues.pack as { course: { id: string; lessons: { id: string }[] } };
      if (!referralOnly.has(pack.course.id)) continue;
      for (const lesson of pack.course.lessons) {
        expect(await adapter.elearningDocument("lesson", `${pack.course.id}~${lesson.id}`, SCOPE)).toBeNull();
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  }, CHUNK_TIMEOUT);

  it("returns nothing for unknown ids", async () => {
    expect(await adapter.elearningDocument("course", "no-such-course", SCOPE)).toBeNull();
    expect(await adapter.elearningDocument("lesson", "no-such-course~no-such-lesson", SCOPE)).toBeNull();
    expect(await adapter.elearningDocument("lesson", "missing-separator", SCOPE)).toBeNull();
    expect(await adapter.elearningDocument("lesson", `${COURSES[0].id}~no-such-lesson`, SCOPE)).toBeNull();
    for (const kind of ["clas-lesson", "toolkit-lesson", "intercultural-lesson", "water-we-swim-in", "leadership-styles", "reading", "learn-page"] as DownloadKind[]) {
      expect(await adapter.elearningDocument(kind, "no-such-id", SCOPE), kind).toBeNull();
    }
  });
});
