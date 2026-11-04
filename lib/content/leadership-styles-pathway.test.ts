import { describe, expect, it } from "vitest";
import { fleschKincaidGrade, splitSentences } from "@/lib/content/readability";
import {
  CAPSTONE, COMMON_SCENARIO, CONDUCIVE_GROUPS, FOUNDATIONS, LEADERSHIP_SCENARIO_FAMILIES, LEADERSHIP_STYLE_LESSONS, LEGACY_STYLE_TO_PATHWAY,
  LIFECYCLE, PATHWAY_AUTHORITY, PATHWAY_BOUNDARY, PATHWAY_INTRO, RACE_SECTION, RUBRIC, leadershipStyle,
} from "./leadership-styles-pathway";

const strings = (value: unknown): string[] => typeof value === "string" ? [value] : Array.isArray(value) ? value.flatMap(strings)
  : value && typeof value === "object" ? Object.values(value).flatMap(strings) : [];
const ALL = { LEADERSHIP_STYLE_LESSONS, LEADERSHIP_SCENARIO_FAMILIES, PATHWAY_INTRO, PATHWAY_AUTHORITY, PATHWAY_BOUNDARY, FOUNDATIONS, COMMON_SCENARIO, CONDUCIVE_GROUPS, RACE_SECTION, LIFECYCLE, RUBRIC, CAPSTONE };
const visible = strings(ALL).filter(text => !/^[a-z-]+$/.test(text));

describe("leadership styles pathway content", () => {
  it("has sixteen complete lessons with valid cross-references", () => {
    expect(LEADERSHIP_STYLE_LESSONS).toHaveLength(16);
    expect(new Set(LEADERSHIP_STYLE_LESSONS.map(lesson => lesson.slug)).size).toBe(16);
    for (const lesson of LEADERSHIP_STYLE_LESSONS) {
      for (const list of [lesson.definition, lesson.isNot, lesson.promotes, lesson.undermines, lesson.helpsWhen, lesson.avoidWhen, lesson.safeguards, lesson.review, lesson.practice.steps,
        lesson.swot.strengths, lesson.swot.weaknesses, lesson.swot.opportunities, lesson.swot.threats]) expect(list.length, lesson.slug).toBeGreaterThan(0);
      for (const text of [lesson.stronger.quote, lesson.harmful.quote, lesson.conflict.situation, lesson.conflict.tendency, lesson.conflict.stronger, lesson.race, lesson.assessment.label]) expect(text.trim(), lesson.slug).not.toBe("");
      for (const item of lesson.complements) expect(leadershipStyle(item.slug), `${lesson.slug} -> ${item.slug}`).toBeTruthy();
      expect(lesson.complements.some(item => item.slug === lesson.slug)).toBe(false);
      expect(CONDUCIVE_GROUPS.some(group => group.id === lesson.group)).toBe(true);
    }
    for (const slug of Object.values(LEGACY_STYLE_TO_PATHWAY)) expect(leadershipStyle(slug)).toBeTruthy();
  });
  it("covers all seven scenario families, each with several styles and both stronger and harmful responses", () => {
    expect(LEADERSHIP_SCENARIO_FAMILIES.map(family => family.family)).toEqual([
      "Assignment and advancement opportunities", "Accessible meetings and accommodation routing", "Community input that conflicts with leadership preferences",
      "Provider or service-access barriers", "Scarce resources and competing priorities", "Staff disagreement during organizational change", "A leader's own mistake and repair",
    ]);
    for (const family of LEADERSHIP_SCENARIO_FAMILIES) {
      expect(new Set(family.responses.map(response => response.slug)).size, family.id).toBeGreaterThanOrEqual(4);
      expect(family.responses.some(response => response.kind === "stronger")).toBe(true);
      expect(family.responses.some(response => response.kind === "harmful")).toBe(true);
      for (const response of family.responses) expect(leadershipStyle(response.slug), response.slug).toBeTruthy();
    }
    for (const stage of LIFECYCLE.stages) for (const slug of stage.styles) expect(leadershipStyle(slug), slug).toBeTruthy();
    expect(LIFECYCLE.stages).toHaveLength(8);
    expect(RUBRIC.criteria).toHaveLength(8);
    expect(RACE_SECTION.parts).toHaveLength(4);
    expect(CAPSTONE.tasks).toHaveLength(7);
  });
  it("follows the owner's wording rules", () => {
    for (const text of visible) {
      expect(text, text).not.toMatch(/\bAI\b|\bA\.I\.\b|artificial intelligence|\btutor/i);
      // The responsible party is a "person or area responsible", never an office.
      expect(text, text).not.toMatch(/\boffices?\b/i);
      expect(text, text).not.toMatch(/probabilit(?:y|ies) (?:of|that)|personality type (?:is|of)/i);
    }
    // Acronyms are spelled out where they first appear.
    expect(PATHWAY_AUTHORITY[0].label).toContain("Department of Human Services (DHS)");
    expect(PATHWAY_AUTHORITY[1].label).toContain("Aging and Disability Services Administration (ADSA)");
    // The three kinds of guidance stay distinct.
    expect(PATHWAY_AUTHORITY.map(item => item.label)).toEqual([expect.stringMatching(/requirements/), expect.stringMatching(/guidance/), "Project recommendations"]);
  });
  it("stays near a 10th-grade reading level on average", () => {
    const sentences = visible.flatMap(text => splitSentences(text));
    const grades = sentences.map(sentence => fleschKincaidGrade(sentence, ["Department of Human Services", "Aging and Disability Services Administration", "Equity Analysis Toolkit"]));
    const mean = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
    const words = visible.join(" ").split(/\s+/).filter(Boolean).length;
    console.log(`leadership pathway: ${words} words, ${sentences.length} sentences, mean grade ${mean.toFixed(1)}`);
    expect(words).toBeGreaterThan(12000);
    expect(mean).toBeLessThanOrEqual(10.5);
  });
});
