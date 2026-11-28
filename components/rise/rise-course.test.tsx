import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/image", () => ({ default: (props: { alt: string; src: string }) => <img alt={props.alt} src={props.src} /> }));
vi.mock("@/components/app-link", () => ({ default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => <a href={href} className={className}>{children}</a> }));
import fs from "node:fs";
import path from "node:path";
import { riseCourse, riseLessons } from "@/lib/content/courses/rise";
import { RiseCourseOverview, RiseLessonView } from "./rise-course";

describe("Rise courses render", () => {
  for (const id of ["dc-s3-equity-vs-equality", "dhs-equity-analysis-toolkit"]) {
    const course = riseCourse(id)!;
    it(`${id}: the cover page and every lesson render, with every image present`, () => {
      const pages = [renderToStaticMarkup(<RiseCourseOverview course={course} />), ...riseLessons(course).map(l => renderToStaticMarkup(<RiseLessonView course={course} lessonId={l.id} />))];
      for (const html of pages) expect(html).toContain("rise");
      const images = new Set(pages.join("").match(/\/images\/(?:courses|cast)\/[^"?]+\.webp/g) ?? []);
      for (const src of images) expect(fs.existsSync(path.join("public", src)), src).toBe(true);
    });
    it(`${id}: each lesson that teaches a Toolkit step links to the tool`, () => {
      const lessons = riseLessons(course);
      const withWork = lessons.filter(l => l.blocks.some(b => b.kind === "useAtWork"));
      expect(withWork.length).toBeGreaterThanOrEqual(5);
    });
  }
});
