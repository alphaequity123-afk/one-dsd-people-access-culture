import { describe, expect, it } from "vitest";
import { explicitInputLinks, inspectGeneratedSourceLinks } from "./source-links";

const origin = "https://one-people-access-culture.up.railway.app";
const options = { origin };
const allowed = ["/learn/water", "/readings/ada#exceptions", "https://www.pacer.org/about/areas-of-focus/", "https://example.org/source_(2026)?x=1&y=2"];

describe("generated answer and work-product source links", () => {
  it("rejects invented citation URLs in Word paragraphs even when the separately attached sources are real", () => {
    const result = inspectGeneratedSourceLinks({
      shortAnswer: "Here is your working guide.",
      workProduct: {
        title: "Water reflection guide", format: "docx",
        sections: [{ heading: "Citations", paragraphs: [
          "The Water We Swim In — https://info-oneculture.mn.gov/courses/water-we-swim-in",
          "Minnesota Culture Brief — https://info-oneculture.mn.gov/briefs/minnesota-culture",
        ], headers: [], rows: [] }],
        sources: [{ title: "The Water We Swim In", href: "/learn/water" }],
      },
    }, allowed, options);
    expect(result.ok).toBe(false);
    expect(result.violations).toHaveLength(2);
    expect(result.violations[0].path).toBe("draft.workProduct.sections[0].paragraphs[0]");
  });

  it("checks spreadsheet cells, practice drafts, answer prose and optional next questions", () => {
    const result = inspectGeneratedSourceLinks({
      shortAnswer: "See https://made-up.gov/policy.",
      practiceDraft: { steps: [{ note: "Read https://made-up.gov/draft" }] },
      workProduct: { sections: [{ rows: [["Source", '=HYPERLINK("https://made-up.gov/row")']] }] },
      followUpQuestions: ["Should we use https://made-up.gov/next?"],
    }, allowed, options);
    expect(result.violations.map(v => v.path)).toEqual([
      "draft.shortAnswer", "draft.practiceDraft.steps[0].note", "draft.workProduct.sections[0].rows[0][1]", "draft.followUpQuestions[0]",
    ]);
  });

  it("permits supplied relative and absolute app links with the supplied fragment", () => {
    expect(inspectGeneratedSourceLinks({ resourceHrefs: ["/learn/water", `${origin}/readings/ada#exceptions`] }, allowed, options).ok).toBe(true);
  });

  it("does not turn a trusted host into authority for new paths, queries or anchors", () => {
    const result = inspectGeneratedSourceLinks({ resourceHrefs: [
      "https://www.pacer.org/not-a-provided-page", "/readings/ada#invented", "/learn/water?approval=yes",
    ] }, allowed, options);
    expect(result.violations).toHaveLength(3);
    expect(result.violations.every(v => v.reason === "not_supplied")).toBe(true);
  });

  it("handles Markdown, angle links, sentence punctuation and balanced parentheses", () => {
    expect(inspectGeneratedSourceLinks({ shortAnswer:
      "Read [Water](/learn/water), [PACER](<https://www.pacer.org/about/areas-of-focus/>), and [study](https://example.org/source_(2026)?x=1&y=2).",
    }, allowed, options).ok).toBe(true);
  });

  it("handles source URLs with balanced parentheses inside ordinary prose", () => {
    expect(inspectGeneratedSourceLinks("The source (https://example.org/source_(2026)?x=1&y=2).", allowed, options).ok).toBe(true);
  });

  it("rejects bare invented domains and HTML links", () => {
    const result = inspectGeneratedSourceLinks({ shortAnswer: 'Sources: info-oneculture.mn.gov/briefs/water and <a href="/invented">more</a>.' }, allowed, options);
    expect(result.violations.map(v => v.url)).toContain("https://info-oneculture.mn.gov/briefs/water");
    expect(result.violations.map(v => v.url)).toContain("/invented");
  });

  it("checks relative reference-style Markdown citations and bare-domain query strings", () => {
    const result = inspectGeneratedSourceLinks("Read [more][one].\n[one]: /invented\n\nSee pacer.org?madeup=yes.", ["https://pacer.org/"], options);
    expect(result.violations.map(v => v.url)).toContain("/invented");
    expect(result.violations.map(v => v.url)).toContain("https://pacer.org?madeup=yes");
    expect(inspectGeneratedSourceLinks("Read [more][one].\n[one]: /learn/water", allowed, options).ok).toBe(true);
  });

  it.each(["javascript:alert(1)", "data:text/html,hello", "file:///C:/private.txt", "https://user:password@www.pacer.org/about/areas-of-focus/", "//untrusted.example/path", "/\\untrusted.example/path"])("rejects unsafe or unsupplied structured destination %s", href => {
    expect(inspectGeneratedSourceLinks({ sources: [{ href }] }, allowed, options).ok).toBe(false);
  });

  it("rejects unsafe Markdown links without relying on automatic hyperlinking", () => {
    expect(inspectGeneratedSourceLinks("[open](javascript:alert(1))", [], options).ok).toBe(false);
  });

  it("accepts ordinary narrative with emails, numeric ratios and filenames without inventing links", () => {
    expect(inspectGeneratedSourceLinks({ shortAnswer: "Discuss the 1/2 ratio, edit guide.docx, and email staff@example.org." }, [], options).ok).toBe(true);
  });

  it("accepts a supplied WWW address and preserves query parameters", () => {
    expect(inspectGeneratedSourceLinks("Read WWW.PACER.ORG/about/areas-of-focus/.", allowed, options).ok).toBe(true);
  });

  it("preserves punctuation that belongs to an explicitly supplied URL", () => {
    const href = "https://example.org/search?q=what?";
    expect(inspectGeneratedSourceLinks(`Read [the search](${href}).`, [href], options).ok).toBe(true);
  });

  it("bounds error reporting and handles cyclic input without silently declaring success", () => {
    const value: Record<string, unknown> = { text: "https://invented.gov/one https://invented.gov/two" };
    value.self = value;
    expect(inspectGeneratedSourceLinks(value, [], { ...options, maxViolations: 1 })).toMatchObject({ ok: false, violations: [{ path: "draft.text" }] });
  });

  it("does not mutate a document or replace an unknown link with a guessed resource", () => {
    const draft = { shortAnswer: "https://info-oneculture.mn.gov/water" };
    inspectGeneratedSourceLinks(draft, allowed, options);
    expect(draft.shortAnswer).toBe("https://info-oneculture.mn.gov/water");
  });

  it("rejects invented raw root-relative citations in document paragraphs", () => {
    const result = inspectGeneratedSourceLinks({ workProduct: { sections: [{ paragraphs: ["Cited reading: /learn/not-real."] }] } }, allowed, options);
    expect(result).toMatchObject({ ok: false, violations: [{ path: "draft.workProduct.sections[0].paragraphs[0]", url: "/learn/not-real" }] });
  });

  it("accepts supplied raw relative paths with query punctuation and ignores ratios and units", () => {
    expect(inspectGeneratedSourceLinks("See /learn/path?q=what?, then /learn/water. Use 1/2, km/h, 10 mg /kg, 5 m /s and <span>text</span>.", [...allowed, "/learn/path?q=what?"], options).ok).toBe(true);
  });
});

describe("literal addresses in the user's task", () => {
  it("permits an explicitly requested example link as data without trusting sibling paths", () => {
    const links = explicitInputLinks('Write HTML with a link to https://example.com/demo and an endpoint /api/demo.');
    expect(links).toContain("https://example.com/demo");
    expect(links).toContain("/api/demo");
    expect(inspectGeneratedSourceLinks('<a href="https://example.com/demo">Demo</a>', links, options).ok).toBe(true);
    expect(inspectGeneratedSourceLinks('https://example.com/invented', links, options).ok).toBe(false);
    expect(inspectGeneratedSourceLinks({ sources: [{ href: "https://generated.example.org/fake" }] }, links, options).ok).toBe(false);
    expect(explicitInputLinks("Use https://example.com/search?q=what?.")).toContain("https://example.com/search?q=what?");
  });

  it.each([
    "http://localhost/private", "http://127.1/private", "http://10.0.0.1/private", "http://169.254.169.254/latest", "http://[::1]/private", "http://[fd00::1]/private",
    "https://user:password@example.com/demo", "https://example.com/demo?api_key=private", "https://example.com/demo?X-Amz-Signature=private", "https://example.com/demo#access_token=private", "/api/demo?password=private",
    "http://localhost/?next=/private", "https://example.com/?token=private&next=/private", "http://localhost/?next=example.com",
  ])("does not authorize private or credential-bearing input %s", url => {
    expect(explicitInputLinks(`Use ${url}`)).toEqual([]);
  });
});
