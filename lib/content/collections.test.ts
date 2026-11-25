import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DSD_SCENARIOS } from "@/lib/dsd";
import { buildStartRecommendation } from "@/lib/product/start";
import { PAGE_AREAS, PRIMARY_SECTIONS, pageArea } from "@/lib/program/page-purpose";
import { REFERRAL_ONLY_COURSE_IDS, isRetiredCulturalWorkshop } from "@/lib/program/retired-features";
import { GRADUATION_PATHS } from "./paths";
import { SELF_DIRECTED_COURSES } from "./self-directed";
import { staffCorpus } from "./staff-corpus";
import { AUTHORED_COURSES, RECOVERED_COURSES } from "./courses/definitions";
import { publishedCourses } from "./courses/published";
import {
  COLLECTION_COUNTS, COLLECTION_REFERRAL_IDS, DOOR_ASK, DOOR_RESOURCES, LEADING_DOORS, LEADING_PATHS, QUESTION_SCENARIOS, REQUIRED_COURSE_ID, REQUIRED_COURSE_LABEL,
  STAFF_COLLECTIONS, STAFF_RESOURCES, collectionItem, collectionItemHref, doorIds, jobAidHref, leadingDoor, leadingPath, scenarioHref, staffCollection, staffCollectionIds, whomToAsk,
} from "./collections";

const root = process.cwd();
const allPacks = [...RECOVERED_COURSES, ...AUTHORED_COURSES];
const servedCourses = new Map(allPacks.filter(({ course }) => !REFERRAL_ONLY_COURSE_IDS.has(course.id) && !isRetiredCulturalWorkshop(course)).map(pack => [pack.course.id, pack]));
const selfDirected = new Set(SELF_DIRECTED_COURSES.map(course => `self-directed-${course.number}`));
const listedIds = [...new Set([...STAFF_COLLECTIONS.flatMap(staffCollectionIds), ...LEADING_DOORS.flatMap(doorIds), ...LEADING_PATHS.flatMap(item => item.courseIds)])];

/** Why an id fails to resolve, using the app's own course data. Empty when it resolves. */
function linkProblem(id: string): string {
  const item = collectionItem(id);
  if (!item) return `${id}: not in the collections data`;
  if (item.kind === "self-directed") return selfDirected.has(id) ? "" : `${id}: not in the self-directed data`;
  if (item.kind === "referral") return REFERRAL_ONLY_COURSE_IDS.has(id) ? "" : `${id}: marked referral but not referral-only in the app`;
  return servedCourses.has(id) ? "" : `${id}: not a served course`;
}

/** Whether an internal link has a real destination in this app. */
function destinationExists(href: string): boolean {
  const clean = href.split(/[?#]/)[0];
  const practice = clean.match(/^\/practice\/(gp-\d+)$/);
  if (practice) return GRADUATION_PATHS.some(item => item.id === practice[1]);
  const library = clean.match(/^\/library\/(.+)$/);
  if (library) return staffCorpus().some(item => item.id === library[1]);
  const scenario = clean.match(/^\/one-dsd\/scenarios\/(.+)$/);
  if (scenario) return DSD_SCENARIOS.some(item => item.id === decodeURIComponent(scenario[1]));
  return existsSync(path.join(root, "app", clean, "page.tsx")) || existsSync(path.join(root, "public", clean));
}

describe("every listed item resolves", () => {
  it("finds a real destination for every id in every collection, door and path", () => {
    expect(listedIds.length).toBe(COLLECTION_COUNTS.items);
    expect(listedIds.map(linkProblem).filter(Boolean)).toEqual([]);
  });
  it("fails for a broken link", () => {
    expect(linkProblem("no-such-course")).toContain("not in the collections data");
    const original = servedCourses.get(REQUIRED_COURSE_ID)!;
    servedCourses.delete(REQUIRED_COURSE_ID);
    expect(linkProblem(REQUIRED_COURSE_ID)).toContain("not a served course");
    servedCourses.set(REQUIRED_COURSE_ID, original);
  });
  it("uses the app's own titles", () => {
    const wrong = [...servedCourses.values()].filter(({ course }) => collectionItem(course.id)?.title !== course.title).map(({ course }) => course.id);
    expect(wrong).toEqual([]);
  });
  it("leaves no served or self-directed course out of the collections", () => {
    const listed = new Set(listedIds);
    expect([...servedCourses.keys(), ...selfDirected].filter(id => !listed.has(id))).toEqual([]);
  });
  it("builds a link for every item, and a job aid link for every starting course", () => {
    for (const id of listedIds) expect(collectionItemHref(collectionItem(id)!)).toMatch(/^\//);
    for (const door of LEADING_DOORS) for (const question of door.questions) {
      const start = collectionItem(question.startId)!;
      expect(start.kind, question.key).toBe("course");
      expect(jobAidHref(start), question.key).toBe(start.id.startsWith("sm-") ? `/resources/ja-${start.id}` : `/courses/${start.id}#job-aid`);
      if (start.id.startsWith("sm-")) expect(staffCorpus().some(item => item.id === `ja-${start.id}`), question.key).toBe(true);
      expect(servedCourses.get(start.id)!.jobAid.sections.length, question.key).toBeGreaterThan(0);
    }
  });
  it("serves every course named as a start, in the app's published list", async () => {
    const published = new Set((await publishedCourses("dsd")).map(({ pack }) => pack.course.id));
    const courseIds = listedIds.filter(id => collectionItem(id)!.kind === "course");
    expect(courseIds.filter(id => !published.has(id))).toEqual([]);
    expect(published.has(REQUIRED_COURSE_ID)).toBe(true);
  });
  it("keeps the Tribal and Native courses as referrals only", () => {
    expect([...COLLECTION_REFERRAL_IDS].sort()).toEqual([...REFERRAL_ONLY_COURSE_IDS].sort());
    expect(listedIds.filter(id => REFERRAL_ONLY_COURSE_IDS.has(id))).toEqual([]);
    for (const id of COLLECTION_REFERRAL_IDS) expect(collectionItemHref(collectionItem(id)!)).toBe("/learn/tribal-referral");
  });
});

describe("the plan's structure", () => {
  it("has 8 staff collections, 9 doors, 89 questions and 6 paths", () => {
    expect(STAFF_COLLECTIONS).toHaveLength(8);
    expect(LEADING_DOORS).toHaveLength(9);
    expect(LEADING_PATHS).toHaveLength(6);
    expect(LEADING_PATHS.map(path => path.slug)).toEqual(["exploring-leadership", "program-leads", "first-year", "experienced", "managers-of-managers", "senior-leaders"]);
    expect(LEADING_DOORS.flatMap(door => door.questions)).toHaveLength(89);
    expect(LEADING_DOORS.map(door => door.itemCount)).toEqual([20, 9, 40, 29, 17, 100, 113, 25, 24]);
    expect(STAFF_COLLECTIONS.map(collection => collection.itemCount)).toEqual([26, 71, 62, 51, 139, 65, 119, 69]);
    for (const door of LEADING_DOORS) expect(new Set(doorIds(door)).size, door.slug).toBe(door.itemCount);
    for (const collection of STAFF_COLLECTIONS) expect(new Set(staffCollectionIds(collection)).size, collection.id).toBe(collection.itemCount);
  });
  it("resolves every route parameter", () => {
    for (const door of LEADING_DOORS) expect(leadingDoor(door.slug)).toBe(door);
    for (const item of LEADING_PATHS) expect(leadingPath(item.slug)).toBe(item);
    for (const collection of STAFF_COLLECTIONS) expect(staffCollection(collection.id)).toBe(collection);
    expect(leadingDoor("paths")).toBeUndefined();
    expect(leadingDoor("how-this-works")).toBeUndefined();
    for (const page of ["app/leading/page.tsx", "app/leading/[door]/page.tsx", "app/leading/paths/page.tsx", "app/leading/paths/[path]/page.tsx", "app/leading/how-this-works/page.tsx", "app/leading/journey/page.tsx", "app/learn/collections/page.tsx", "app/learn/collections/[collection]/page.tsx"]) expect(existsSync(path.join(root, page)), page).toBe(true);
    expect(leadingDoor("journey")).toBeUndefined();
  });
  it("gives every question whom to ask and places all 13 scenarios", () => {
    for (const door of LEADING_DOORS) {
      expect(DOOR_ASK[door.slug]?.length, door.slug).toBeGreaterThan(0);
      for (const question of door.questions) expect(whomToAsk(door.slug, question.key).length, question.key).toBeGreaterThan(0);
    }
    const questionKeys = new Set(LEADING_DOORS.flatMap(door => door.questions.map(question => question.key)));
    expect(Object.keys(QUESTION_SCENARIOS).filter(key => !questionKeys.has(key))).toEqual([]);
    const placed = Object.values(QUESTION_SCENARIOS).flat();
    expect([...placed].sort()).toEqual(DSD_SCENARIOS.map(scenario => scenario.id).sort());
    expect(placed.filter(id => !destinationExists(scenarioHref(id)))).toEqual([]);
  });
  it("links only to pages that exist", () => {
    const links = [...Object.values(DOOR_RESOURCES).flatMap(group => [...group.practice, ...group.jobAids, ...group.tools]), ...Object.values(STAFF_RESOURCES).flat()];
    expect(links.length).toBeGreaterThan(30);
    expect(links.filter(link => !destinationExists(link.href)).map(link => link.href)).toEqual([]);
    expect(LEADING_DOORS.map(door => door.slug).filter(slug => !DOOR_RESOURCES[slug])).toEqual([]);
    expect(STAFF_COLLECTIONS.map(collection => collection.id).filter(id => !STAFF_RESOURCES[id])).toEqual([]);
    expect(Object.values(DOOR_RESOURCES).flatMap(group => group.jobAids)).toHaveLength(21);
  });
});

describe("the Equity Analysis Toolkit", () => {
  it("is the one required item, marked as such", () => {
    expect(collectionItem(REQUIRED_COURSE_ID)?.required).toBe(REQUIRED_COURSE_LABEL);
    expect(REQUIRED_COURSE_LABEL).toBe("Required of all DHS staff");
    expect(listedIds.filter(id => collectionItem(id)?.required)).toEqual([REQUIRED_COURSE_ID]);
  });
  it("comes first in Start here and stays in Policy, data", () => {
    expect(staffCollection("start-here")!.startIds[0]).toBe(REQUIRED_COURSE_ID);
    expect(staffCollectionIds(staffCollection("policy-data-decisions")!)).toContain(REQUIRED_COURSE_ID);
  });
  it("sits near the start of the first-year path and first in the others", () => {
    expect(leadingPath("first-year")!.courseIds.indexOf(REQUIRED_COURSE_ID)).toBe(1);
    for (const slug of ["experienced", "managers-of-managers", "senior-leaders"]) expect(leadingPath(slug)!.courseIds[0], slug).toBe(REQUIRED_COURSE_ID);
  });
});

describe("navigation", () => {
  it("adds a separate area without a sixth main menu item", () => {
    expect(PRIMARY_SECTIONS).toHaveLength(5);
    expect(pageArea("/leading")).toBe("leading");
    expect(pageArea("/leading/policy")).toBe("leading");
    expect(pageArea("/learn/collections")).toBe("learn");
    expect(pageArea("/learn/collections/start-here")).toBe("learn");
    expect(PAGE_AREAS.learn.links.map(([, href]) => href)).toContain("/learn/collections");
    expect(PAGE_AREAS.programs.links.map(([, href]) => href)).toContain("/one-dsd/leadership");
    for (const [, href] of PAGE_AREAS.leading.links) expect(destinationExists(href), href).toBe(true);
    const header = readFileSync(path.join(root, "components/dsd-program-header.tsx"), "utf8");
    // Owner decision 2026-11-11: the menu says "Leadership"; the full wording stays as the tooltip.
    expect(header).toContain('title="For leaders, supervisors, managers, and directors">Leadership</Link>');
  });
  it("sends the supervisor or manager role to the space, and no other role", () => {
    const intake = (role: string) => ({ contextPreference: "one_dsd", task: "workforce_equity", urgency: "exploratory", role }) as Parameters<typeof buildStartRecommendation>[0];
    const recommendation = buildStartRecommendation(intake("supervisor_or_manager"));
    expect(recommendation.roleSpace?.href).toBe("/leading");
    expect(buildStartRecommendation(intake("staff_member")).roleSpace).toBeUndefined();
  });
});

describe("the promises on these pages", () => {
  const pageFiles = ["app/leading/page.tsx", "app/leading/[door]/page.tsx", "app/leading/paths/page.tsx", "app/leading/paths/[path]/page.tsx", "app/leading/how-this-works/page.tsx", "app/leading/journey/page.tsx", "components/leading-start-chooser.tsx", "app/learn/collections/page.tsx", "app/learn/collections/[collection]/page.tsx", "components/leading-path-place.tsx", "components/collection-item-link.tsx"];
  it("uses no sign-in or roster code", () => {
    for (const file of pageFiles) expect(readFileSync(path.join(root, file), "utf8"), file).not.toMatch(/@\/lib\/auth|fetch\(|editingModeFromCookies/);
  });
  it("states plainly what is and is not recorded", () => {
    const page = readFileSync(path.join(root, "app/leading/how-this-works/page.tsx"), "utf8");
    for (const words of ["does not give supervisors a learner scoreboard", "keep those items in this browser profile", "does not send those saved items to supervisors or program staff", "Exporting or sharing a copy is a separate action", "go to outside services", "does not intentionally save a question-and-answer copy", "earlier versions may have retained separate records", "does not replace training the state requires", "TRAINING_CREDIT_NOTICE", "does not assign or certify required agency training"]) expect(page).toContain(words);
  });
});
