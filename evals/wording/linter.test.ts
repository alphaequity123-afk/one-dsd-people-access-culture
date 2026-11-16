import { describe, expect, it } from "vitest";
import { extractFromSource } from "./extract.ts";
import { AcronymTracker, discoverScenarioNames, lintStandalone, lintText, loadAllowlist, type RuleId } from "./linter.ts";

const allowlist = loadAllowlist();
// Acronyms have their own test; the other rules are checked without them.
const rules = (text: string, options = {}) => [...new Set(lintStandalone(text, allowlist, options).map(f => f.rule).filter(rule => rule !== "acronyms"))].sort() as RuleId[];

describe("A5 shared wording linter", () => {
  it("passes plain, owner-approved wording", () => {
    expect(rules("Ask the person or area responsible before you change a notice. Guidance offers hints while you practice.")).toEqual([]);
  });

  it("flags banned words, including tutor and bot, but not words that only contain them", () => {
    expect(rules("Ask the AI tutor.")).toEqual(["banned-words"]);
    expect(rules("The chatbot answers.")).toEqual(["banned-words"]);
    expect(rules("A bot replies.")).toEqual(["banned-words"]);
    expect(rules("She visits botánicas and robots.")).toEqual([]);
  });

  it("flags \"office\" for whoever is responsible and leaves official names alone", () => {
    expect(rules("Contact the responsible office.")).toEqual(["responsible-party"]);
    expect(rules("Send it to the appropriate ADSA office.")).toEqual(["responsible-party"]);
    expect(rules("The Office of the Legislative Auditor published it.")).toEqual([]);
  });

  it("flags DEI terms and the held-aside MMB name", () => {
    expect(rules("Our DEIA work")).toContain("retired-terms");
    expect(lintStandalone("MMB Leading with DEIA", allowlist).some(f => f.message.includes("held aside"))).toBe(true);
    expect(rules("Diversity, equity, and inclusion training")).toContain("retired-terms");
  });

  it("flags participation notices only when the sentence is about taking part", () => {
    expect(rules("Participation is voluntary.")).toEqual(["system-notices"]);
    expect(rules("This optional lesson takes ten minutes.")).toEqual(["system-notices"]);
    expect(rules("Your answers are not saved.")).toEqual(["system-notices"]);
    expect(rules("Nothing you type is stored.")).toEqual(["system-notices"]);
    expect(rules("Voluntary agencies resettle refugees in Minnesota.")).toEqual([]);
  });

  it("flags program voice outside quotations only", () => {
    expect(rules("We recommend this guide.")).toEqual(["program-voice"]);
    expect(rules("She said, \"we built our future here.\"")).toEqual([]);
    expect(rules("The U.S. Census counts people.")).toEqual([]);
    expect(rules("Visit https://example.org/who-we-are for details.")).toEqual([]);
    expect(lintStandalone("We could meet on Tuesday.", allowlist, { speech: true }).filter(f => f.rule === "program-voice")).toEqual([]);
  });

  it("flags names for people in courses and trainings when asked to", () => {
    expect(rules("Morgan asks the team for help.", { checkNames: true })).toEqual(["names"]);
    expect(rules("Morgan asks the team for help.")).toEqual([]);
    expect(rules("A supervisor asks the team for help.", { checkNames: true })).toEqual([]);
  });

  it("flags program and status labels, but not a label quoted from someone else's site", () => {
    expect(rules("Coming soon")).toEqual(["status-labels"]);
    expect(rules("Review date TBD")).toEqual(["status-labels"]);
    expect(rules("Existing DHS resource")).toEqual(["status-labels"]);
    expect(rules("Its website showed only \"Coming Soon\".")).toEqual([]);
    expect(rules("Review a draft before you send it.")).toEqual([]);
  });

  it("requires an acronym to be spelled out before its first use, per unit", () => {
    const tracker = new AcronymTracker(allowlist.knownAcronyms);
    expect(lintText("Home and community-based services (HCBS) help people live at home.", { allowlist, acronyms: tracker })).toEqual([]);
    expect(lintText("HCBS waivers vary.", { allowlist, acronyms: tracker })).toEqual([]);
    expect(lintText("Ask HR first.", { allowlist, acronyms: tracker }).map(f => f.match)).toEqual(["HR"]);
    expect(lintText("DHS staff and PDF files.", { allowlist, acronyms: new AcronymTracker(allowlist.knownAcronyms) })).toEqual([]);
  });

  it("finds first names given to people in scenarios", () => {
    const texts = Array.from({ length: 6 }, () => "Wynn asks the team for help. Wynn says the form is long.");
    expect(discoverScenarioNames(texts)).toContain("Wynn");
    expect(discoverScenarioNames(["This says a lot. ".repeat(10)])).toEqual([]);
  });
});

describe("visible-text extraction", () => {
  it("reads JSX text and visible attributes, not classes, links or log messages", () => {
    const texts = extractFromSource("app/x/page.tsx", `
      export default function Page() {
        console.log("internal message for the log");
        return <main className="flex gap-2"><h1 title="Visible title here">Welcome to the page</h1><a href="/learn">Learn more</a></main>;
      }`).map(t => t.text);
    expect(texts).toEqual(expect.arrayContaining(["Visible title here", "Welcome to the page", "Learn more"]));
    expect(texts.join(" ")).not.toMatch(/flex gap-2|\/learn|internal message/);
  });

  it("reads prose in data but skips ids, addresses and someone else's words", () => {
    const texts = extractFromSource("lib/content/x.json", JSON.stringify({
      courses: [{ id: "c-1", href: "/courses/c-1", title: "Working with interpreters", summary: "Plan the meeting with the interpreter.", sources: [{ title: "DEI Report 2024" }], quote: "We said this." }],
    }, null, 1)).map(t => t.text);
    expect(texts).toEqual(["Working with interpreters", "Plan the meeting with the interpreter."]);
  });
});
