import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CoursePackSchema } from "../../contract";
import { AUTHORED_COURSES, ALL_COURSE_SURFACES, CODE_APPROVED_SURFACE_IDS } from "../../definitions";
import { courseHref, publishedCourses } from "../../published";
import type { Block } from "../../source-types";
import manifest from "./import-manifest.json";
import { SUPERVISOR_MANAGER_COURSE_PACKS as PACKS } from ".";

const ids = manifest.courses.map(row => row.id);

describe("supervisor and manager course packs", () => {
  it("imports all 19 courses, with the counts taken from the source files", () => {
    expect(PACKS).toHaveLength(19);
    expect(PACKS.map(pack => pack.course.id)).toEqual(ids);
    expect(manifest.totals).toMatchObject({ lessons: 93, minutes: 1188, scenarios: 93, knowledgeChecks: 93, transfers: 93, leaderMoves: 93 });
    for (const row of manifest.courses) {
      const { course, sources, jobAid } = PACKS.find(pack => pack.course.id === row.id)!;
      const blocks = course.lessons.flatMap(lesson => lesson.blocks);
      const count = (type: Block["type"]) => blocks.filter(block => block.type === type).length;
      expect([course.lessons.length, count("knowledgeCheck"), count("text"), count("statement"), count("list"), count("tabs"), count("accordion"), count("leaderMove"), jobAid.sections.length, sources.length], row.id)
        .toEqual([row.lessons, row.knowledgeChecks, row.text, row.statements, row.lists, row.tabs, row.accordions, row.leaderMoves, row.jobAidSections, row.sources]);
    }
  });
  it("validates every pack against the course contract", () => {
    for (const pack of PACKS) expect(CoursePackSchema.safeParse(pack).success, pack.course.id).toBe(true);
  });
  it("keeps a scenario, knowledge check and transfer prompt in every lesson", () => {
    for (const pack of PACKS) for (const lesson of pack.course.lessons) {
      expect(lesson.scenario?.options.filter(option => option.recommended), lesson.id).toHaveLength(1);
      expect(lesson.transfer?.prompt, lesson.id).toBeTruthy();
      const checks = lesson.blocks.filter(block => block.type === "knowledgeCheck");
      expect(checks, lesson.id).toHaveLength(1);
      for (const check of checks) if (check.type === "knowledgeCheck") expect(check.options.filter(option => option.correct), lesson.id).toHaveLength(1);
    }
  });
  it("leaves no answer marker or Markdown behind", () => {
    for (const pack of PACKS) {
      const text = JSON.stringify(pack);
      expect(text, pack.course.id).not.toContain("(correct)");
      expect(text, pack.course.id).not.toContain("**");
    }
  });
  it("records the owner's approval of October 31, 2026, with no review note left for readers", () => {
    for (const pack of PACKS) {
      const { course } = pack;
      expect(course.governance?.status, course.id).toBe("reviewed");
      expect(course.governance?.lastReviewed, course.id).toBe("October 31, 2026");
      expect(course.governance?.reviewers, course.id).toEqual(["Equity and Inclusion Operations Consultant"]);
      expect(course.governance?.nextReview, course.id).toBe("At the agreed review point and whenever an update trigger occurs");
      const text = JSON.stringify(pack);
      expect(text, course.id).not.toContain("Review needed");
      expect(text, course.id).not.toContain("Not yet reviewed");
    }
    for (const row of manifest.courses) expect(row, row.id).not.toHaveProperty("reviewNeeded");
  });
  it("uses cover images that exist", () => {
    for (const { course } of PACKS) expect(existsSync(path.join(process.cwd(), "public", course.coverImage)), course.coverImage).toBe(true);
  });
});

describe("publication", () => {
  it("registers each course as a code-approved surface", () => {
    const registered = new Set(AUTHORED_COURSES.map(pack => pack.course.id));
    const surfaces = new Set(ALL_COURSE_SURFACES.map(surface => surface.surfaceId));
    for (const id of ids) {
      expect(registered.has(id), id).toBe(true);
      expect(surfaces.has(`course.${id}`), id).toBe(true);
      expect(CODE_APPROVED_SURFACE_IDS.has(`course.${id}`), id).toBe(true);
    }
  });
  it("does not hide draft courses or courses with no reviewers from readers", async () => {
    for (const scope of ["dsd", "one-dhs"] as const) {
      const published = new Set((await publishedCourses(scope)).map(({ pack }) => pack.course.id));
      expect(ids.filter(id => !published.has(id)), scope).toEqual([]);
    }
    expect(courseHref("sm-first-week")).toBe("/courses/sm-first-week");
  });
});
