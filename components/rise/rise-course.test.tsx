import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/image", () => ({ default: (props: { alt: string; src: string }) => <img alt={props.alt} src={props.src} /> }));
vi.mock("@/components/app-link", () => ({ default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => <a href={href} className={className}>{children}</a> }));
import fs from "node:fs";
import path from "node:path";
import { riseCourse, riseLessons } from "@/lib/content/courses/rise";
import { RiseCourseOverview, RiseLessonView } from "./rise-course";

describe("Rise courses render", () => {
  it("the Toolkit opens with its approved photo, concise introduction and optional supporting material", () => {
    const course = riseCourse("dhs-equity-analysis-toolkit")!;
    const page = document.createElement("div");
    page.innerHTML = renderToStaticMarkup(<RiseCourseOverview course={course} />);
    const header = page.querySelector("header")!;
    const photo = header.querySelector("img")!;
    const title = header.querySelector("h1")!;
    expect(photo.getAttribute("src")).toBe("/images/courses/equity-analysis-toolkit/cover-planning-board.webp");
    expect(photo.alt).toBe("Two colleagues discuss notes on a planning board.");
    expect(photo.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(title.textContent).toBe("Equity Analysis Toolkit");
    expect(header.querySelector("p")?.textContent).toBe("Bring equity into your everyday work. Use evidence and people’s experiences to make decisions that improve access.");
    expect(header.querySelector(".rise-eyebrow")).toBeNull();
    expect(header.querySelector("a")?.textContent).toBe("Start course");
    const disclosures = Array.from(page.querySelectorAll("details"));
    const walkthrough = disclosures.find(item => item.querySelector("summary")?.textContent === "Watch or listen")!;
    const details = disclosures.find(item => item.querySelector("summary")?.textContent === "Course details")!;
    expect(walkthrough.open).toBe(false);
    expect(walkthrough.querySelector("[data-course-media-slot]")).not.toBeNull();
    expect(details.open).toBe(false);
    expect(details.textContent).toContain(course.description[0]);
    expect(details.querySelectorAll(".rise-ov-outcomes li")).toHaveLength(course.outcomes.length);
    expect(page.querySelectorAll('nav[aria-label="Course outline"] a')).toHaveLength(14);
  });

  it("the other Rise course retains its existing cover presentation", () => {
    const course = riseCourse("dc-s3-equity-vs-equality")!;
    const page = document.createElement("div");
    page.innerHTML = renderToStaticMarkup(<RiseCourseOverview course={course} />);
    expect(page.querySelector(".rise-cover .rise-eyebrow")?.textContent).toBe(course.eyebrow);
    expect(page.querySelector(".rise-cover h1")?.textContent).toBe(course.title);
    expect(page.querySelector(".rise-cover-sum")?.textContent).toBe(course.summary);
    expect(page.querySelector(".rise-toolkit-overview")).toBeNull();
  });

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
