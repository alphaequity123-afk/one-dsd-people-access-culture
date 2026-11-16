import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CollectionItemLink } from "@/components/collection-item-link";
import { LEADING_DOORS, LEADING_PATHS, REQUIRED_COURSE_ID, STAFF_COLLECTIONS, collectionItem, jobAidHref } from "@/lib/content/collections";
import LeadingPage from "./page";
import LeadingDoorPage from "./[door]/page";
import LeadingPathsPage from "./paths/page";
import LeadingPathPage from "./paths/[path]/page";
import LeadingHowThisWorksPage from "./how-this-works/page";
import CollectionsPage from "@/app/learn/collections/page";
import CollectionPage from "@/app/learn/collections/[collection]/page";
import CoursePage from "@/app/courses/[courseId]/page";
import { CourseLesson } from "@/components/course-lesson";
import { SUPERVISOR_MANAGER_COURSE_PACKS } from "@/lib/content/courses/authored/supervisor-manager";
import { lessonObjectives, sanitizedLesson } from "@/lib/content/courses/published";

vi.mock("@/lib/product/request-context", () => ({ requestedContentScope: async () => "dsd" }));
// Server components that load their own data; unrelated to what these tests check.
vi.mock("@/components/related-readings", () => ({ RelatedReadings: () => null }));
vi.mock("@/components/learning-journey-link", () => ({ LearningJourneyLink: () => null }));
vi.mock("next/navigation", async original => ({ ...await original<typeof import("next/navigation")>(), usePathname: () => "/leading" }));

const REQUIRED = "Required of all DHS staff";
const html = (element: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(element).replaceAll("&#x27;", "'").replaceAll("&amp;", "&").replaceAll("&quot;", '"');

describe("supervisor and manager pages render with their data", () => {
  it("keeps the question and all nine doors in the detailed leadership view", async () => {
    const page = html(await LeadingPage({ searchParams: Promise.resolve({ view: "all" }) }));
    expect(page).toContain("Lead equity in everyday work");
    expect(page).toContain("Explore leadership");
    expect(page).toContain("/one-dsd/leadership#starting-points");
    expect(page).toContain("/one-dsd/leadership#continuity-plan");
    expect(page).toContain("/one-dsd/amplify/mentoring#mentoring-tool");
    expect(page).toContain("/learn/leadership-styles");
    expect(page).toContain("until you copy or download them");
    expect(page).toContain("Human Resources or selection process");
    expect(page).toContain("What are you deciding?");
    for (const door of LEADING_DOORS) { expect(page).toContain(door.title); expect(page).toContain(`/leading/${door.slug}`); }
    for (const path of LEADING_PATHS) expect(page).toContain(`/leading/paths/${path.slug}`);
    expect(page).toContain(REQUIRED);
    expect(page).toContain("/learn/tribal-referral");
  });
  it("shows each door's questions first, with a start, job aid, whom to ask and closed depth", async () => {
    for (const door of LEADING_DOORS) {
      const page = html(await LeadingDoorPage({ params: Promise.resolve({ door: door.slug }) }));
      for (const question of door.questions) {
        expect(page, question.key).toContain(question.question);
        expect(page, question.key).toContain(jobAidHref(collectionItem(question.startId)!)!);
      }
      expect(page.indexOf(door.questions[0].question), door.slug).toBeLessThan(page.indexOf("Whom to ask, by role"));
      expect(page, door.slug).not.toMatch(/<details[^>]*\sopen/);
      expect(page, door.slug).toContain("Whom to ask");
      expect(page.match(/not available right now/g), door.slug).toBeNull();
    }
    const policy = html(await LeadingDoorPage({ params: Promise.resolve({ door: "policy" }) }));
    expect(policy).toContain(REQUIRED);
    expect(policy).toContain("/one-dsd/scenarios/dsd-policy-change");
  });
  it("lists every course on every path, with the Toolkit marked", async () => {
    expect(html(LeadingPathsPage())).toContain("Six suggested orders through the material.");
    for (const path of LEADING_PATHS) {
      const page = html(await LeadingPathPage({ params: Promise.resolve({ path: path.slug }) }));
      for (const id of path.courseIds) expect(page, id).toContain(`/courses/${id}`);
      expect(page, path.slug).toContain(REQUIRED);
      expect(page.match(/not available right now/g), path.slug).toBeNull();
    }
  });
  it("states the promises", () => {
    const page = html(LeadingHowThisWorksPage());
    expect(page).toContain("Do not type anyone's name, case, health or personnel details.");
    expect(page).toContain("agency responsibility associated with the Equity Analysis Toolkit");
    expect(page).toContain("is met through the state's own training");
  });
});

describe("staff collection pages render with their data", () => {
  it("lists the 8 shelves", async () => {
    const page = html(await CollectionsPage());
    for (const collection of STAFF_COLLECTIONS) expect(page).toContain(`/learn/collections/${collection.id}`);
  });
  it("lists every item on every shelf, Toolkit first in Start here", async () => {
    for (const collection of STAFF_COLLECTIONS) {
      const page = html(await CollectionPage({ params: Promise.resolve({ collection: collection.id }) }));
      for (const id of collection.startIds) expect(page, id).toContain(collectionItem(id)!.title);
      for (const group of collection.deeper) for (const id of group.ids) expect(page, id).toContain(collectionItem(id)!.title);
      expect(page, collection.id).not.toMatch(/<details[^>]*\sopen/);
    }
    const start = html(await CollectionPage({ params: Promise.resolve({ collection: "start-here" }) }));
    const toolkit = start.indexOf(`/courses/${REQUIRED_COURSE_ID}`);
    expect(toolkit).toBeGreaterThan(-1);
    expect(toolkit).toBeLessThan(start.indexOf(`/courses/${STAFF_COLLECTIONS[0].startIds[1]}`));
    expect(start).toContain(REQUIRED);
  });
});

describe("a listed course that is not being served", () => {
  it("stays visible and says so, and keeps the required label", () => {
    const page = html(<CollectionItemLink id={REQUIRED_COURSE_ID} published={new Set()} />);
    expect(page).toContain("DHS Equity Analysis Toolkit");
    expect(page).toContain(REQUIRED);
    expect(page).toContain("not available right now");
    expect(page).not.toContain(`/courses/${REQUIRED_COURSE_ID}`);
  });
});

describe("imported courses render for readers", () => {
  it("renders every lesson of all 19 courses through the real lesson component", () => {
    for (const { course } of SUPERVISOR_MANAGER_COURSE_PACKS) for (const source of course.lessons) {
      const lesson = sanitizedLesson(source);
      const page = html(<CourseLesson courseId={course.id} lesson={lesson} objectives={lessonObjectives(lesson)} />);
      expect(page, lesson.id).toContain(source.title);
      expect(page, lesson.id).toContain("Try a situation");
      expect(page, lesson.id).toContain("Your next step");
      expect(page, lesson.id).toContain("Check answer");
      expect(page, lesson.id).not.toContain("&lt;");
      expect(page, lesson.id).not.toMatch(/\*\*|\(correct\)/);
    }
  });
  it("shows the scope on a course page with no review note, now that the owner has approved the courses", async () => {
    const approved = html(await CoursePage({ params: Promise.resolve({ courseId: "sm-calibration" }) }));
    expect(approved).not.toContain("Not yet reviewed");
    expect(approved).not.toContain("Review needed");
    expect(approved).not.toContain("data-course-review-note");
    expect(approved).toContain('id="job-aid"');
    const scoped = html(await CoursePage({ params: Promise.resolve({ courseId: "sm-first-week" }) }));
    expect(scoped).toContain('data-course-scope="sm-first-week"');
    expect(scoped).toContain("does not count as the training Minn. Stat. 43A.21 requires");
    expect(scoped).not.toContain("Not yet reviewed");
    const older = html(await CoursePage({ params: Promise.resolve({ courseId: REQUIRED_COURSE_ID }) }));
    expect(older).not.toContain("data-course-review-note");
    expect(older).not.toContain("data-course-scope");
  });
});
