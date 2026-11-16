import { describe, expect, it } from "vitest";
import { responsibleWording, withResponsibleWording } from "./responsible-wording";

describe("the person or area responsible", () => {
  it.each([
    ["Contact the appropriate office before you decide.", "Contact the person or area responsible before you decide."],
    ["The responsible office confirms the rule.", "The person or area responsible confirms the rule."],
    ["Ask the responsible offices.", "Ask the people or areas responsible."],
    ["Check with the appropriate ADSA office.", "Check with the person or area responsible in ADSA."],
    ["Send it to the responsible agency office.", "Send it to the person or area responsible in the agency."],
    ["the responsible person or office", "the person or area responsible"],
    ["the right person or office", "the person or area responsible"],
    ["the responsible people and offices", "the people or areas responsible"],
    ["the designated Tribal relations office", "the person or area responsible for Tribal relations"],
    ["the responsible Tribal-relations office", "the person or area responsible for Tribal relations"],
    ["a responsible program office", "a person or area responsible for the program"],
    ["an appropriate office", "a person or area responsible"],
    ["Find the right office.", "Find the person or area responsible."],
    ["the appropriate designated office", "the person or area responsible"],
    ["the responsible hiring office", "the person or area responsible for hiring"],
    ["legal counsel or other responsible offices", "legal counsel or other people or areas responsible"],
  ])("%s", (before, after) => { expect(responsibleWording(before)).toBe(after); });

  it("leaves official names and unrelated sentences alone", () => {
    for (const text of [
      "The Office of the Legislative Auditor found a gap.",
      "the Equal Opportunity and Access Division",
      "Staff have the right to an office that is accessible.",
      "She works in an office downtown.",
      "the appropriate Office of Inspector General",
    ]) expect(responsibleWording(text)).toBe(text);
  });

  it("rewords every text field of a record except spoken transcripts, addresses and identifiers", () => {
    const record = { title: "Ask the appropriate office", transcript: "Ask the appropriate office", href: "/the-appropriate-office", items: [{ body: "the responsible office", id: "the-responsible-office" }], count: 2 };
    expect(withResponsibleWording(record)).toEqual({ title: "Ask the person or area responsible", transcript: "Ask the appropriate office", href: "/the-appropriate-office", items: [{ body: "the person or area responsible", id: "the-responsible-office" }], count: 2 });
    const untouched = { title: "Nothing to change", items: ["plain"] };
    expect(withResponsibleWording(untouched)).toBe(untouched);
  });
});

import { EDITABLE_SURFACE_REGISTRY } from "./staff-surface-registry";
import { withProfessionalLanguage } from "./professional-language";

describe("every published surface follows the rule", () => {
  it("leaves nothing to reword after the shared language layer has run, in any course, path or page", () => {
    let surfaces = 0, reworded = 0;
    for (const definition of EDITABLE_SURFACE_REGISTRY) {
      const shown = withProfessionalLanguage(definition.surfaceId, definition.approvedValues);
      if (shown !== definition.approvedValues) reworded++;
      // Applying the rule again changes nothing: no "responsible office" wording is left.
      expect(withResponsibleWording(shown), definition.surfaceId).toBe(shown);
      surfaces++;
    }
    expect(surfaces).toBeGreaterThan(100);
    expect(reworded).toBeGreaterThan(50);
  });
});
