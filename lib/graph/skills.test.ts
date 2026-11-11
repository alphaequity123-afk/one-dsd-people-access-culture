import { describe, expect, it } from "vitest";
import { FACETS, facetValue, facetValues, facetsForHref, isolatedItems } from "./facets";
import { SKILLS, SKILL_COURSES, SKILL_TAG_BASIS } from "./skills";
import { REFERRAL_ONLY_COURSE_IDS } from "@/lib/program/retired-features";

describe("skills as a way into the collection", () => {
  it("offers 21 skills in five groups, each with something to open", () => {
    expect(FACETS.map(facet => facet.id)).toContain("skill");
    expect(SKILLS).toHaveLength(21);
    expect(new Set(SKILLS.map(skill => skill.group)).size).toBe(5);
    expect(new Set(SKILLS.map(skill => skill.id)).size).toBe(21);
    expect(facetValues("skill")).toHaveLength(21);
    for (const skill of SKILLS) {
      const entry = facetValue("skill", skill.id);
      expect(entry?.items.length, skill.id).toBeGreaterThan(2);
      expect(entry?.items.some(item => item.kind === "course"), skill.id).toBe(true);
    }
  });

  it("tags only known skills, and never lists a referral-only course under any skill", () => {
    const known = new Set(SKILLS.map(skill => skill.id));
    for (const id of Object.keys(SKILL_COURSES)) expect(known.has(id), id).toBe(true);
    for (const entry of facetValues("skill")) for (const item of entry.items) {
      expect(REFERRAL_ONLY_COURSE_IDS.has(item.id.replace(/^course-/, "")), `${entry.id}: ${item.id}`).toBe(false);
    }
  });

  it("says plainly that the tags are a first pass", () => {
    expect(SKILL_TAG_BASIS).toMatch(/First pass/);
    expect(SKILL_TAG_BASIS).toMatch(/Not yet reviewed/);
  });

  it("shows a course's skills among its connections, and leaves nothing standing alone", () => {
    const coaching = facetValue("skill", "coach-feedback")!;
    const course = coaching.items.find(item => item.kind === "course")!;
    expect(facetsForHref(course.href, 40).some(entry => entry.facet === "skill")).toBe(true);
    expect(isolatedItems()).toEqual([]);
  });

  it("uses plain titles with no specialist wording", () => {
    for (const skill of SKILLS) expect(`${skill.title} ${skill.summary}`).not.toMatch(/\b(competenc|orientation|domain|taxonomy|tag|score|level)\w*/i);
  });
});
