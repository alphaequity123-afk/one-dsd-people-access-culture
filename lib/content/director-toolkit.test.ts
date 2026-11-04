import { describe, expect, it } from "vitest";
import {
  DIRECTOR_STARTER_PACKAGE, DIRECTOR_TEMPLATES, DIRECTOR_TOOLKIT_INTRO, DIRECTOR_TOOLKIT_SECTIONS, DIRECTOR_FIRST_90_DAYS, TEMPLATE_KEEP_OUT,
  cellKey, checkKey, directorTemplate, sectionText, templateAnchor, templateDescriptionText, templateText,
} from "./director-toolkit";

/** Hub page text in reading order, then the templates page. */
const hubText = [DIRECTOR_TOOLKIT_INTRO.lede, ...DIRECTOR_TOOLKIT_INTRO.summary, DIRECTOR_TOOLKIT_INTRO.privacy,
  ...DIRECTOR_TOOLKIT_SECTIONS.map(sectionText)].join("\n");
const templatesText = ["Fill-in templates for equity reviews at the Minnesota Department of Human Services (DHS).", ...DIRECTOR_TEMPLATES.map(templateDescriptionText)].join("\n");

/** Parts of official names and form numbers ("Level AA", "Minnesota IT Services", "DHS-4210-ENG"), not short forms to spell out. */
const NOT_SHORT_FORMS = new Set(["ENG", "AA", "IT"]);

function firstUseProblems(text: string): string[] {
  const problems: string[] = [];
  for (const short of new Set([...text.matchAll(/\b[A-Z]{2,}\b/g)].map(match => match[0]))) {
    if (NOT_SHORT_FORMS.has(short)) continue;
    const at = text.search(new RegExp(`\\b${short}\\b`));
    // Spelled out on first use, either "Full Name (SHORT)" or "SHORT (Full Name)".
    if (text[at - 1] !== "(" && !text.slice(at + short.length).startsWith(" (")) problems.push(`${short}: ${text.slice(Math.max(0, at - 40), at + 40)}`);
  }
  return problems;
}

describe("Equity Director toolkit content", () => {
  it("covers sections 1 to 14 in source order with distinct anchors", () => {
    expect(DIRECTOR_TOOLKIT_SECTIONS.map(section => section.number)).toEqual(Array.from({ length: 14 }, (_, index) => index + 1));
    expect(new Set(DIRECTOR_TOOLKIT_SECTIONS.map(section => section.id)).size).toBe(14);
    for (const section of DIRECTOR_TOOLKIT_SECTIONS) for (const item of section.items) {
      expect(item.purpose && item.use, item.name).toBeTruthy();
    }
    const all = DIRECTOR_TOOLKIT_SECTIONS.map(sectionText).join("\n");
    for (const phrase of ["DHS Equity Policy", "Equity, Diversity and Inclusion InfoLink", "seven criteria", "DHS-4210-ENG", "15 languages", "Office of Equity in Procurement", "Equity Select",
      "Vulnerable Adult Protection Dashboard", "Olmstead Plan", "internal-only", "11 Tribal Nations", "July 1, 2024", "Human Services Performance Management"]) expect(all, phrase).toContain(phrase);
  });

  it("keeps the internal-only caution for the person-level dashboard", () => {
    expect(DIRECTOR_TOOLKIT_SECTIONS.find(section => section.id === "data-evaluation")!.caution).toMatch(/internal-only.*should not be given to external partners/);
  });

  it("has the first 90 days and the 12-item starter package, three foundational resources then nine supports with templates", () => {
    expect(DIRECTOR_FIRST_90_DAYS.map(period => period.period)).toEqual(["Days 1 to 30", "Days 31 to 60", "Days 61 to 90"]);
    expect(DIRECTOR_STARTER_PACKAGE).toHaveLength(12);
    const anchors = new Set(DIRECTOR_TEMPLATES.map(template => templateAnchor(template.id)));
    for (const item of DIRECTOR_STARTER_PACKAGE.slice(3)) expect(anchors.has(item.href.split("#")[1]), item.title).toBe(true);
  });

  it("provides the 14 requested templates, each tied to a toolkit area, with the nine-part assessment record", () => {
    expect(DIRECTOR_TEMPLATES.map(template => template.id)).toEqual(["intake-triage", "impact-assessment", "budget-worksheet", "decision-log", "heard-changed-log", "partner-map",
      "tribal-screening", "accessibility-review", "language-access-review", "workforce-review", "procurement-grant-review", "action-tracker", "metric-definition", "outcome-scorecard"]);
    const sections = new Set(DIRECTOR_TOOLKIT_SECTIONS.map(section => section.id));
    for (const template of DIRECTOR_TEMPLATES) expect(sections.has(template.sectionId), template.id).toBe(true);
    const numbered = directorTemplate("impact-assessment")!.fields.filter(field => /^\d\. /.test(field.label));
    expect(numbered.map(field => field.label.slice(0, 2))).toEqual(["1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9."]);
    const metric = directorTemplate("metric-definition")!.fields.map(field => field.label).join(" ");
    for (const part of ["Population", "Numerator", "Denominator", "Period", "source", "Missing data", "Limits on interpretation"]) expect(metric).toContain(part);
  });

  it("exports a filled template as plain text without storing anything", () => {
    const template = directorTemplate("decision-log")!;
    const text = templateText(template, { subject: "Notice redesign", [cellKey("log", 0, 0)]: "Notice is hard to read", [cellKey("log", 0, 4)]: "Program manager" });
    expect(text).toContain("Decision or review this log covers: Notice redesign");
    expect(text).toContain("Row 1. Finding: Notice is hard to read");
    expect(text).toContain("Accountable owner (role): Program manager");
    expect(text).not.toContain("Row 2.");
    expect(text).toContain(TEMPLATE_KEEP_OUT);
    const checklist = templateText(directorTemplate("intake-triage")!, { [checkKey("triggers", 0)]: "Yes" });
    expect(checklist).toContain("- Eligibility processes. [Yes]");
    expect(checklist).toContain("- Service access. [not answered]");
  });

  it("follows the plain-language rules: short forms spelled out on first use, no banned words, no 'office' for the responsible party", () => {
    expect(firstUseProblems(hubText)).toEqual([]);
    expect(firstUseProblems(templatesText)).toEqual([]);
    for (const text of [hubText, templatesText]) {
      expect(text).not.toMatch(/\bAI\b/);
      expect(text).not.toMatch(/\btutors?\b/i);
      // This copy is the One DSD application: it must not describe itself as One DHS.
      expect(text).not.toMatch(/\bOne DHS\b/);
      expect(text.replaceAll("Office of Equity in Procurement", "")).not.toMatch(/\boffices?\b/i);
    }
    expect(hubText).toContain("person or area responsible for Tribal and Urban Indian Relations");
  });
});
