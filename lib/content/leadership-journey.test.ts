import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LEADING_PATHS } from "./collections";
import { LEARNING_ELSEWHERE, END_OF_PATH_QUESTIONS, JOURNEY_STEPS, LEARNING_WITH_OTHERS, PATH_JOURNEY, REFLECTION_PROMPTS, SIX_WEEKS, WEEKLY_RHYTHM, suggestedPath } from "./leadership-journey";
import { REFLECTION_KINDS } from "@/lib/implementation/records";

const root = process.cwd();
const pageExists = (href: string) => {
  const clean = href.split(/[?#]/)[0].replace(/^\//, "");
  return existsSync(path.join(root, "app", clean, "page.tsx"));
};
const everyWord = [
  ...JOURNEY_STEPS.flatMap(step => [step.title, step.body, step.link]),
  ...Object.values(PATH_JOURNEY).flatMap(entry => [entry.question, entry.tryThis, entry.keep]),
  ...WEEKLY_RHYTHM.flatMap(item => [item.what, item.time]),
  ...LEARNING_ELSEWHERE.flatMap(course => [course.title, course.provider, course.body]),
  ...SIX_WEEKS.flatMap(week => [week.learn, week.reflect, week.apply]),
  ...REFLECTION_PROMPTS.flatMap(prompt => [prompt.kind, prompt.when, ...prompt.questions]),
  ...END_OF_PATH_QUESTIONS,
  ...LEARNING_WITH_OTHERS.flatMap(place => [place.title, place.body]),
].join("\n");

describe("the leadership journey", () => {
  it("is one round of five steps, in order, each leading somewhere real", () => {
    expect(JOURNEY_STEPS.map(step => step.id)).toEqual(["learn", "reflect", "apply", "capture", "repeat"]);
    for (const step of JOURNEY_STEPS) expect(pageExists(step.href), step.href).toBe(true);
  });
  it("gives every suggested path its question and something to try, and names no path that does not exist", () => {
    const slugs = LEADING_PATHS.map(item => item.slug);
    expect(Object.keys(PATH_JOURNEY).sort()).toEqual([...slugs].sort());
    for (const entry of Object.values(PATH_JOURNEY)) {
      expect(entry.question.endsWith("?")).toBe(true);
      expect(entry.tryThis.length).toBeGreaterThan(30);
      expect(entry.keep.length).toBeGreaterThan(20);
    }
  });
  it("paces six weeks and a week that fits inside real work", () => {
    expect(SIX_WEEKS.map(week => week.week)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(WEEKLY_RHYTHM).toHaveLength(4);
  });
  it("offers the same kinds of reflection the notebook does", () => {
    expect(REFLECTION_PROMPTS.map(prompt => prompt.kind)).toEqual([...REFLECTION_KINDS]);
    for (const prompt of REFLECTION_PROMPTS) expect(prompt.questions.length).toBeGreaterThanOrEqual(3);
    expect(END_OF_PATH_QUESTIONS).toHaveLength(4);
  });
  it("points only to places that exist for learning with others", () => {
    expect(LEARNING_WITH_OTHERS.length).toBeGreaterThan(3);
    for (const place of LEARNING_WITH_OTHERS) expect(pageExists(place.href), place.href).toBe(true);
  });
  it("suggests a starting path from a person's own answers, and always one that exists", () => {
    const slugs = new Set(LEADING_PATHS.map(item => item.slug));
    expect(suggestedPath({ supervises: false, guidesProgram: false })).toBe("exploring-leadership");
    expect(suggestedPath({ supervises: false, guidesProgram: true })).toBe("program-leads");
    expect(suggestedPath({ supervises: true, supervisesSupervisors: false, firstYear: true })).toBe("first-year");
    expect(suggestedPath({ supervises: true, supervisesSupervisors: false, firstYear: false })).toBe("experienced");
    expect(suggestedPath({ supervises: true, supervisesSupervisors: true, setsDirection: false })).toBe("managers-of-managers");
    expect(suggestedPath({ supervises: true, supervisesSupervisors: true, setsDirection: true })).toBe("senior-leaders");
    for (const supervises of [true, false]) for (const guidesProgram of [true, false]) for (const firstYear of [true, false]) for (const supervisesSupervisors of [true, false]) for (const setsDirection of [true, false]) {
      expect(slugs.has(suggestedPath({ supervises, guidesProgram, firstYear, supervisesSupervisors, setsDirection }))).toBe(true);
    }
  });
});

describe("the promises the journey keeps", () => {
  const files = ["app/leading/journey/page.tsx", "app/my-work/reflections/page.tsx", "components/leading-start-chooser.tsx", "lib/content/leadership-journey.ts"].map(file => readFileSync(path.join(root, file), "utf8"));
  it("asks for no sign-in, sends nothing anywhere, and keeps nothing about a person on the server", () => {
    for (const file of files) expect(file).not.toMatch(/@\/lib\/auth|fetch\(|editingModeFromCookies|cookies\(\)|localStorage|sessionStorage/);
  });
  it("offers no badge, certificate, score, rating or ranking", () => {
    // The page explicitly says it has no score report; that disclosure is not an award.
    const pageText = files.map(text => text.replace('no completion submission or supervisor score report', 'no completion submission'));
    for (const text of [everyWord, ...pageText]) expect(text).not.toMatch(/\b(badges?|certificat\w*|certif\w*|scores?|scored|ratings?|ranked|ranking|leaderboard|grade[ds]?|points)\b/i);
  });
  it("says plainly that it is optional, with nothing to submit and nothing counted", () => {
    const page = files[0];
    for (const words of ["no nomination, no group to join and no deadline", "no completion submission or supervisor score report", "is your choice", "None of this is required", "Nothing is sent as a reminder", "Related lessons may save progress or practice responses in your browser profile"]) expect(page).toContain(words);
  });
  it("is written plainly, with no system words and no status words", () => {
    expect(everyWord).not.toMatch(/\b(AI|artificial intelligence|assistant|chatbot|bot|model|module|framework|competenc\w*|diagnostic|coming soon|under construction|beta|pilot|draft|placeholder|TBD)\b/i);
    expect(everyWord).not.toMatch(/\*\*|`|^#/m);
  });
  it("lists free courses elsewhere only on secure outside addresses, each once", () => {
    expect(LEARNING_ELSEWHERE.length).toBeGreaterThan(0);
    for (const course of LEARNING_ELSEWHERE) expect(course.href).toMatch(/^https:\/\/(?!one-d)/);
    expect(new Set(LEARNING_ELSEWHERE.map(course => course.href)).size).toBe(LEARNING_ELSEWHERE.length);
  });
});
