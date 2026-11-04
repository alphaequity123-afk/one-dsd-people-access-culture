import { describe, expect, it } from "vitest";
import curriculum from "@/lib/content/clas-curriculum.json";
import { lessonTitle, scoreChoice, tutorItem, tutorItems, tutorLessonIds } from "./items";
import { leaksAnswer, normalizeForMatch, protectedTexts, sharesRun } from "./leak-guard";
import { fallbackReply, replyText, STRATEGY_INSTRUCTIONS, TUTOR_SYSTEM_PROMPT, TutorReplySchema, tutorUserPrompt } from "./prompt";
import { tutorGrounding, GROUNDING_WORD_CAP } from "./grounding";
import { LEADERSHIP_CAPSTONE_LESSON_ID, LEADERSHIP_SCENARIO_LESSON_ID } from "./leadership-items";
import { TUTOR_SYSTEM_PROMPT as CLAS_PROMPT, tutorSystemPrompt } from "./prompt";

describe("guided-practice items (content engine)", () => {
  it("exposes one item per lesson with the correct option taken from the content's correct flag", () => {
    expect(tutorLessonIds()).toEqual([...curriculum.modules.map(m => m.id), "ls01", "ls02"]);
    for (const lesson of curriculum.modules) {
      const items = tutorItems(lesson.id);
      expect(items).toHaveLength(1);
      const [item] = items;
      expect(item.itemId).toBe("01");
      expect(item.lessonTitle).toBe(lesson.title);
      expect(item.question).toBe(lesson.practice.question);
      expect(item.options.map(o => o.text)).toEqual(lesson.practice.options.map(o => o.text));
      const flagged = lesson.practice.options.findIndex(o => "correct" in o && o.correct === true);
      expect(item.correctIndex).toBe(flagged);
      expect(tutorItem(lesson.id, "01")).toEqual(item);
    }
  });
  it("returns nothing for unknown lessons or items", () => {
    expect(tutorItems("10")).toEqual([]);
    expect(tutorItems("1")).toEqual([]);
    expect(tutorItems("../01")).toEqual([]);
    expect(tutorItem("01", "02")).toBeNull();
    expect(tutorItem("01", "1")).toBeNull();
    expect(lessonTitle("01")).toBe(curriculum.modules[0].title);
  });
  it("scores deterministically: the chosen option's own feedback, correct only for the flagged option", () => {
    const item = tutorItem("01", "01")!;
    for (const [n, option] of item.options.entries()) {
      expect(scoreChoice(item, n)).toEqual({ correct: n === item.correctIndex, feedback: option.feedback });
    }
    expect(() => scoreChoice(item, item.options.length)).toThrow(RangeError);
    expect(() => scoreChoice(item, -1)).toThrow(RangeError);
    expect(() => scoreChoice(item, 0.5)).toThrow(RangeError);
  });
});

describe("answer-leak guard", () => {
  const item = tutorItem("01", "01")!;
  const wrong = item.options.findIndex((_, n) => n !== item.correctIndex);
  it("normalizes punctuation, case and apostrophes", () => {
    expect(normalizeForMatch("People’s Experience, (and) more!")).toEqual(["peoples", "experience", "and", "more"]);
  });
  it("protects every other option's text and feedback, never the chosen option's own", () => {
    const texts = protectedTexts(item, wrong);
    expect(texts).not.toContain(item.options[wrong].text);
    expect(texts).not.toContain(item.options[wrong].feedback);
    expect(texts).toContain(item.options[item.correctIndex].text);
    expect(texts).toContain(item.options[item.correctIndex].feedback);
  });
  it("flags a reply that repeats eight or more words of the correct option, and passes an original reply", () => {
    const correct = item.options[item.correctIndex];
    expect(leaksAnswer(`Think about this: ${correct.text}`, item, wrong)).toBe(true);
    expect(leaksAnswer(`One thought. ${correct.feedback.split(" ").slice(0, 9).join(" ")}, and so on.`, item, wrong)).toBe(true);
    expect(leaksAnswer("What does the person need to be able to do with the notice? What would tell you whether that worked?", item, wrong)).toBe(false);
    expect(sharesRun("short", "to be", 8)).toBe(false);
    expect(sharesRun("a b c d e f g h i j", "d e f g h", 8)).toBe(true);
    expect(sharesRun("a b c d e f g h i j", "d e f g x", 8)).toBe(false);
  });
});

describe("guide prompt", () => {
  const item = tutorItem("02", "01")!;
  const wrong = item.options.findIndex((_, n) => n !== item.correctIndex);
  it("requires the three-part structure and the boundaries in the system prompt", () => {
    for (const part of ["(a) restatement", "(b) guidance", "(c) nextStep", "Never state, imply or rank which option is correct", "Never quote or paraphrase the feedback text of any other option", "10th-grade", "Never use acronyms"]) {
      expect(TUTOR_SYSTEM_PROMPT).toContain(part);
    }
    expect(TUTOR_SYSTEM_PROMPT).toMatch(/Never call yourself a tutor/);
  });
  it("gives the model only the chosen option, its feedback and the strategy, never the other options", () => {
    const user = tutorUserPrompt({ item, chosenIndex: wrong, correct: false, attemptNumber: 1, strategy: "socratic-hint", grounding: "## Standard 1\nText", learnerMessage: "Why?" });
    expect(user).toContain(item.options[wrong].text);
    expect(user).toContain(item.options[wrong].feedback);
    expect(user).toContain(STRATEGY_INSTRUCTIONS["socratic-hint"]);
    expect(user).toContain('"""Why?"""');
    for (const [n, option] of item.options.entries()) if (n !== wrong) { expect(user).not.toContain(option.text); expect(user).not.toContain(option.feedback); }
  });
  it("validates replies and builds a safe fallback from the chosen option only", () => {
    expect(TutorReplySchema.safeParse({ restatement: "a", guidance: "b", nextStep: "c" }).success).toBe(true);
    expect(TutorReplySchema.safeParse({ restatement: "a", guidance: "b" }).success).toBe(false);
    expect(TutorReplySchema.safeParse({ restatement: "a", guidance: "b", nextStep: " " }).success).toBe(false);
    const fallback = fallbackReply(item, wrong, false);
    expect(fallback.guidance).toBe(item.options[wrong].feedback);
    expect(leaksAnswer(replyText(fallback), item, wrong)).toBe(false);
    expect(fallbackReply(item, item.correctIndex, true).nextStep).toMatch(/Move on/);
  });
});

describe("grounding from the lesson content", () => {
  it("includes the lesson's standards, working example and job aid, capped at about 1,500 words", () => {
    const grounding = tutorGrounding("01");
    expect(grounding.text).toContain("Standard 1:");
    expect(grounding.text).toContain("Working example:");
    expect(grounding.text).toContain("Job aid:");
    expect(grounding.text).toContain("Lesson section:");
    expect(grounding.text.split(/\s+/).length).toBeLessThanOrEqual(GROUNDING_WORD_CAP + 20);
    expect(grounding.links).toContainEqual({ title: "Job aid: Start with the person and the purpose", href: "/learn/clas/curriculum/01/job-aid" });
    expect(grounding.links.some(link => link.title.startsWith("Standard 1:"))).toBe(true);
    expect(new Set(grounding.links.map(l => l.href)).size).toBe(grounding.links.length);
  });
  it("is empty for an unknown lesson", () => {
    expect(tutorGrounding("42")).toEqual({ text: "", links: [] });
  });
});

describe("leadership pathway guided practice", () => {
  const BANNED = /\bAI\b|artificial intelligence|\btutor|\boffices?\b/i;
  it("adds a capstone and a style-scenario lesson, each item with exactly one rubric-strongest option", () => {
    for (const lessonId of [LEADERSHIP_CAPSTONE_LESSON_ID, LEADERSHIP_SCENARIO_LESSON_ID]) {
      const items = tutorItems(lessonId);
      expect(items.length).toBeGreaterThanOrEqual(6);
      expect(items.map(item => item.itemId)).toEqual(items.map((_, n) => String(n + 1).padStart(2, "0")));
      for (const item of items) {
        expect(item.options.length).toBeGreaterThanOrEqual(3);
        expect(item.correctIndex).toBeGreaterThanOrEqual(0);
        expect(scoreChoice(item, item.correctIndex).correct).toBe(true);
        expect(tutorItem(lessonId, item.itemId)).toEqual(item);
        for (const text of [item.question, item.reflection, ...item.options.flatMap(o => [o.text, o.feedback])]) expect(text, text).not.toMatch(BANNED);
      }
      // The strongest option is not always in the same place.
      expect(new Set(items.map(item => item.correctIndex)).size).toBeGreaterThan(1);
      expect(lessonTitle(lessonId)).toMatch(/^Leadership/);
    }
    expect(tutorItems("ls10")).toEqual([]);
    expect(tutorItems("ls09")).toEqual([]);
  });
  it("grounds leadership guidance in the rubric and pathway pages, and reframes the guide's opening", () => {
    const capstone = tutorGrounding(LEADERSHIP_CAPSTONE_LESSON_ID);
    expect(capstone.text).toContain("Practice rubric");
    expect(capstone.text).toContain("Capstone worked analysis");
    expect(capstone.links).toContainEqual({ title: "The eight-point practice rubric", href: "/learn/leadership-styles/capstone#rubric" });
    expect(capstone.text.split(/\s+/).length).toBeLessThanOrEqual(GROUNDING_WORD_CAP + 20);
    const scenarios = tutorGrounding(LEADERSHIP_SCENARIO_LESSON_ID);
    expect(scenarios.links.some(link => link.href === "/learn/leadership-styles/scenarios#scenario-leader-repair")).toBe(true);
    expect(tutorSystemPrompt("01")).toBe(CLAS_PROMPT);
    const leadership = tutorSystemPrompt(LEADERSHIP_CAPSTONE_LESSON_ID);
    expect(leadership).toContain("leadership-styles learning pathway");
    expect(leadership).toContain("never about the learner's character");
    expect(leadership).not.toContain("inside a lesson on the National Culturally");
    for (const part of ["(a) restatement", "Never state, imply or rank which option is correct", "Never call yourself a tutor"]) expect(leadership).toContain(part);
  });
});
