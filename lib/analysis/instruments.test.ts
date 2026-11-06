import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { INSTRUMENT_IDS, nextStepSchema, type Instrument } from "@/lib/analysis/contract";
import { getQuestions as getToolkitQuestions } from "@/lib/consultant-toolkit/instrument";
import { INSTRUMENTS, getInstrument, instrumentQuestions, matchGuidance } from "@/lib/analysis/instruments";

const ROOT = "C:/Users/garyb/Projects/one-dsd-community-hub-20261105";

const ALLOWED_HREFS = [
  "/community-outreach/county-map",
  "/community-outreach/county-agencies",
  "/community-outreach/organizations",
  "/community-outreach/providers",
  "/community-outreach/how-the-system-connects",
  "/community-outreach/plan",
  "/community-outreach/sources",
  "/minnesota-communities",
  "/equity-review",
  "/equity-review/structural",
  "/equity-review/working-group-plan",
  "/learn/equity-toolkit",
  "/learn/community-connections",
  "/support/right-person",
  "/library/ja-access-checks",
  "/learn/tribal-referral",
  "/community-outreach/policies",
];

// "/library/ja-access-checks" is served by the dynamic route app/library/[id]/page.tsx.
const DYNAMIC_ROUTES: Record<string, string> = { "/library/ja-access-checks": "app/library/[id]/page.tsx" };

const FORBIDDEN = /\b(DSD|DHS|AI|HCBS|ADSA)\b|\btutor\b/;

/** Every string a person could see, excluding basis, which is tested separately. */
function visibleText(instrument: Instrument): string[] {
  const out: string[] = [instrument.title, instrument.whatToUpload, instrument.intro];
  for (const stage of instrument.stages) {
    out.push(stage.title);
    if (stage.description) out.push(stage.description);
    for (const q of stage.questions) {
      out.push(q.prompt);
      if (q.help) out.push(q.help);
    }
  }
  for (const link of instrument.guidance) out.push(link.label, link.why);
  return out;
}

describe("INSTRUMENTS", () => {
  it("covers every id in INSTRUMENT_IDS exactly once, in order", () => {
    expect(INSTRUMENTS.map(i => i.id)).toEqual([...INSTRUMENT_IDS]);
  });

  it.each(INSTRUMENTS.map(i => [i.id, i] as const))("%s has at least 8 questions with unique ids", (_id, instrument) => {
    const questions = instrument.stages.flatMap(s => s.questions);
    expect(questions.length).toBeGreaterThanOrEqual(8);
    const ids = questions.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of questions) {
      expect(q.id).toMatch(/^[a-z0-9][a-z0-9-]{0,79}$/);
      expect(q.prompt.trim().length).toBeGreaterThan(10);
    }
    const stageIds = instrument.stages.map(s => s.id);
    expect(new Set(stageIds).size).toBe(stageIds.length);
    expect(instrument.stages.length).toBeGreaterThanOrEqual(4);
  });

  it.each(INSTRUMENTS.map(i => [i.id, i] as const))("%s has required text fields", (_id, instrument) => {
    expect(instrument.title.trim()).not.toBe("");
    expect(instrument.basis.trim()).not.toBe("");
    // One sentence on what to upload.
    expect(instrument.whatToUpload.trim()).toMatch(/\.$/);
    expect(instrument.whatToUpload.split(/\.\s/).length).toBe(1);
    // Two or three sentences of intro.
    const sentences = instrument.intro.trim().split(/(?<=\.)\s+/).filter(Boolean);
    expect(sentences.length).toBeGreaterThanOrEqual(2);
    expect(sentences.length).toBeLessThanOrEqual(3);
  });

  it.each(INSTRUMENTS.map(i => [i.id, i] as const))("%s guidance links are allowed, exist under app/, and carry lowercase keywords", (_id, instrument) => {
    expect(instrument.guidance.length).toBeGreaterThanOrEqual(6);
    expect(instrument.guidance.length).toBeLessThanOrEqual(10);
    const hrefs = instrument.guidance.map(l => l.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const link of instrument.guidance) {
      expect(ALLOWED_HREFS).toContain(link.href);
      const page = DYNAMIC_ROUTES[link.href] ?? `app${link.href}/page.tsx`;
      expect(existsSync(join(ROOT, page)), `${page} should exist`).toBe(true);
      expect(nextStepSchema.shape.href.safeParse(link.href).success).toBe(true);
      expect(link.keywords.length).toBeGreaterThan(0);
      for (const keyword of link.keywords) {
        expect(keyword).toBe(keyword.toLowerCase());
        expect(keyword.trim()).toBe(keyword);
        expect(keyword).not.toBe("");
      }
      expect(link.label.trim()).not.toBe("");
      expect(link.why.trim()).not.toBe("");
      expect(link.why.length).toBeLessThanOrEqual(400);
      expect(link.label.length).toBeLessThanOrEqual(160);
    }
  });

  it.each(INSTRUMENTS.map(i => [i.id, i] as const))("%s visible text has no acronyms, no AI and no tutor", (_id, instrument) => {
    for (const text of visibleText(instrument)) {
      expect(text, text).not.toMatch(FORBIDDEN);
    }
  });

  it.each(INSTRUMENTS.map(i => [i.id, i] as const))("%s basis spells every name out in full", (_id, instrument) => {
    expect(instrument.basis).not.toMatch(FORBIDDEN);
  });

  it("equity-analysis question ids match the toolkit scan track", () => {
    const toolkitIds = getToolkitQuestions("scan").map(q => q.id);
    const ours = instrumentQuestions("equity-analysis").map(q => q.id);
    expect(ours).toEqual(toolkitIds);
  });

  it("equity-analysis keeps the toolkit prompts", () => {
    const toolkit = new Map(getToolkitQuestions("scan").map(q => [q.id, q.prompt]));
    for (const q of instrumentQuestions("equity-analysis")) {
      expect(q.prompt).toBe(toolkit.get(q.id));
    }
  });

  it("no visible text names an outside address", () => {
    for (const instrument of INSTRUMENTS) {
      for (const text of [...visibleText(instrument), instrument.basis]) {
        expect(text).not.toMatch(/https?:\/\//i);
      }
    }
  });
});

describe("helpers", () => {
  it("getInstrument returns the instrument for each id and throws for an unknown id", () => {
    for (const id of INSTRUMENT_IDS) expect(getInstrument(id).id).toBe(id);
    // @ts-expect-error unknown id
    expect(() => getInstrument("not-an-instrument")).toThrow();
  });

  it("instrumentQuestions flattens stages in order", () => {
    const instrument = getInstrument("policy-review");
    expect(instrumentQuestions("policy-review")).toEqual(instrument.stages.flatMap(s => s.questions));
  });

  it("matchGuidance returns links whose keywords appear in the text, case-insensitively", () => {
    const instrument = getInstrument("policy-review");
    const links = matchGuidance(instrument, "The document names no Interpreter for Somali speakers.");
    expect(links.map(l => l.href)).toContain("/library/ja-access-checks");
    expect(matchGuidance(instrument, "nothing relevant here")).toEqual([]);
  });

  it("matches keywords as whole words only: 'information', 'explanation' and the standard gap sentence attach no link", () => {
    const instrument = getInstrument("policy-review");
    expect(matchGuidance(instrument, "The sources do not give this information.")).toEqual([]);
    expect(matchGuidance(instrument, "The document gives no explanation of unintended effects.")).toEqual([]);
    expect(matchGuidance(instrument, "The sources do not address this.")).toEqual([]);
    expect(matchGuidance(instrument, "Coordination, determination and designation are described, and the trustee is named.")).toEqual([]);
    expect(matchGuidance(instrument, "No alternative format is offered.").map(l => l.href)).toContain("/library/ja-access-checks");
    expect(matchGuidance(instrument, "Each Tribal Nation affected is not consulted.").map(l => l.href)).toContain("/learn/tribal-referral");
  });

  it("keeps every single-word keyword specific enough that no gap answer written in plain words picks up a link by accident", () => {
    const broad = new Set(["nation", "nations", "source", "sources", "information", "document", "documents", "the", "not"]);
    for (const instrument of INSTRUMENTS) for (const link of instrument.guidance) for (const keyword of link.keywords) {
      expect(broad.has(keyword), `${instrument.id}: "${keyword}" is too broad for ${link.href}`).toBe(false);
    }
  });

  it("keyword hints from the task map to the expected pages", () => {
    const cases: Array<[string, string]> = [
      ["county", "/community-outreach/county-map"],
      ["organization", "/community-outreach/organizations"],
      ["interpreter", "/library/ja-access-checks"],
      ["tribal", "/learn/tribal-referral"],
      ["who decides", "/equity-review/structural"],
      ["provider", "/community-outreach/providers"],
      ["lead agency", "/community-outreach/how-the-system-connects"],
    ];
    const instrument = getInstrument("program-analysis");
    const all = INSTRUMENTS.flatMap(i => i.guidance);
    for (const [keyword, href] of cases) {
      const matching = all.filter(l => l.keywords.includes(keyword)).map(l => l.href);
      expect(matching, keyword).toContain(href);
    }
    expect(matchGuidance(instrument, "No provider list by county.").map(l => l.href)).toEqual(expect.arrayContaining(["/community-outreach/providers", "/community-outreach/county-map"]));
  });
});
