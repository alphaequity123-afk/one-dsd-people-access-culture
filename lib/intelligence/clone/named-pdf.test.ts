import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
// The closing evidence check has its own tests (verified-draft.test.ts); here it passes the draft through.
vi.mock("../retrieval/verified-draft", () => ({ verifyAnswerDraft: async (options: { draft: unknown }) => ({ draft: options.draft, repaired: false, reviewed: true, unresolved: [] }) }));
const f = vi.hoisted(() => ({ complete: vi.fn(), plan: vi.fn(), research: vi.fn() }));
vi.mock("../tools/runtime", () => ({ runTool: async (_ctx: unknown, _name: string, fn: () => unknown) => fn(), auditRefusal: async () => {} }));
vi.mock("./jev", () => ({ reviewWithJev: async () => "pass", planWithJev: f.plan, SPECIALIST_GUIDANCE: { resources: "Use the available evidence." } }));
vi.mock("../retrieval/local-semantic", () => ({ semanticRetrieveForAgent: async () => [], SemanticSearchUnavailable: class extends Error {} }));
vi.mock("../providers", () => ({ resolveBinding: () => ({ generative: true, model: { model_id: "synthetic-pdf" }, adapter: { complete: f.complete } }) }));
vi.mock("../research", () => ({ asksForScholarlyResearch: () => false, governedResearch: f.research, governedSearch: async () => { throw Error("Unexpected search"); } }));
import { ENGAGEMENT_RESOURCES } from "@/lib/content/engagement-resources";
import { engagementPdfDocs } from "../retrieval/engagement-pdf-docs";
import { docsFromStaffContent, citationAttachFromDocs } from "../retrieval/search";
import { namedPdfPageHits } from "../retrieval/named-pdf";
import { citationEvidenceFromDocs, validateEvidenceClaims } from "../retrieval/evidence";
import { askConcierge } from "../agents/ask";
import { getAgent } from "../registry/agents";

const question = "In the ADSA outreach and engagement guide and consideration checklist, how should I plan for participation supports such as compensation, childcare, and transportation? Cite the original PDF pages.";
const docs = [...docsFromStaffContent({ source: "static", items: ENGAGEMENT_RESOURCES }), ...engagementPdfDocs(ENGAGEMENT_RESOURCES)];
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("PAC_CLONE_AGENTS", "on"); vi.stubEnv("PAC_STORE", "memory"); vi.stubEnv("PAC_CONTENT_SOURCE", "static");
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("Network blocked in regression test"); }));
  f.plan.mockResolvedValue({ route: "resources", evidence: "sufficient" });
  f.research.mockResolvedValue({ status: "failed", message: "Synthetic offline research" });
  f.complete.mockResolvedValue({ parsed: { shortAnswer: "Synthetic answer.", whyItMatters: "", limits: [], resourceHrefs: [], evidenceClaims: [] } });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
// Warm the ask corpus once. The first askConcierge call builds the program corpus from cold,
// which on a busy machine can take longer than a single test's 20-second limit; the tests below
// then measure their own work only.
beforeAll(async () => {
  vi.stubEnv("PAC_CLONE_AGENTS", "on"); vi.stubEnv("PAC_STORE", "memory"); vi.stubEnv("PAC_CONTENT_SOURCE", "static");
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("Network blocked in regression test"); }));
  f.plan.mockResolvedValue({ route: "resources", evidence: "sufficient" });
  f.research.mockResolvedValue({ status: "failed", message: "Synthetic offline research" });
  f.complete.mockResolvedValue({ parsed: { shortAnswer: "Synthetic warm-up answer.", whyItMatters: "", limits: [], resourceHrefs: [], evidenceClaims: [] } });
  await askConcierge({ question, contextPreference: "one_dsd" }, { agent: getAgent("ask_concierge"), role: "staff", dry_run: false, trace_id: "00000000-0000-4000-8000-000000000001" }).catch(() => undefined);
  vi.unstubAllEnvs(); vi.unstubAllGlobals();
}, 120000);


describe("named original PDF grounding", () => {
  it("retrieves participation guidance from the full pages, with exact current spans", () => {
    const hits = namedPdfPageHits(question, docs);
    expect(hits.some(hit => hit.href.endsWith("adsa-outreach-engagement-guide.pdf#page=39"))).toBe(true);
    expect(hits.some(hit => hit.href.endsWith("adsa-engagement-checklist.pdf#page=3")), JSON.stringify(hits.map(hit => ({ id: hit.id, score: hit.score })))).toBe(true);
    const sources = citationEvidenceFromDocs(hits, docs);
    expect(sources.map(source => source.evidence!.excerpt.quote).join(" ")).toMatch(/transportation, childcare/i);
    expect(sources.map(source => source.evidence!.excerpt.quote).join(" ")).toMatch(/compensation/i);
    for (const source of sources) {
      const evidence = source.evidence!;
      expect(validateEvidenceClaims([{ kind: "source_excerpt", text: evidence.excerpt.quote, references: [{ evidenceId: evidence.evidenceId, ...evidence.excerpt }] }], sources, docs)).toHaveLength(1);
    }
  });
  it("does not retain unpublished or unnamed documents or accept an invented excerpt", () => {
    expect(namedPdfPageHits("What is the weather?", docs)).toEqual([]);
    expect(namedPdfPageHits(question, docs.filter(doc => !doc.id.startsWith("ref-adsa-engagement-")))).toEqual([]);
    const hits = namedPdfPageHits(question, docs);
    const fake = hits.map(hit => ({ ...hit, excerpt: "Invented claim that does not occur in the current PDF" }));
    expect(citationAttachFromDocs(fake, docs).some(source => source.excerpt.startsWith("Invented"))).toBe(false);
  });
  it("feeds real page passages into ASK and preserves validated PDF citations in its answer", async () => {
    f.complete.mockImplementation(async (request: { user: string }) => {
      const input = JSON.parse(request.user);
      const pages = input.programSources.filter((source: { href: string }) => source.href.includes(".pdf#page="));
      // Retrieval is bounded across documents and may add graph-connected passages.
      // Assert the requested evidence, rather than an incidental total passage count.
      expect(pages.length).toBeGreaterThanOrEqual(2);
      expect(pages.some((source: { href: string }) => source.href.endsWith("guide.pdf#page=39"))).toBe(true);
      expect(pages.some((source: { href: string }) => source.href.endsWith("checklist.pdf#page=3"))).toBe(true);
      // Each page is cited by its label; its passage is supplied once and never copied back.
      expect(pages.every((source: { ref?: string; excerpt?: string; evidence?: unknown }) => /^S\d+$/.test(source.ref ?? "") && source.excerpt && source.evidence === undefined)).toBe(true);
      return { parsed: { shortAnswer: "Plan compensation and participation supports using the guide and checklist.", whyItMatters: "", limits: [], resourceHrefs: [], evidenceClaims: pages.slice(0, 2).map((source: { ref: string; excerpt: string }) => ({ text: source.excerpt, refs: [source.ref] })) } };
    });
    const result = await askConcierge({ question, contextPreference: "one_dsd" }, { agent: getAgent("ask_concierge"), role: "staff", dry_run: false, trace_id: "4cecf283-d438-4528-a884-c7b2cc30b68a" });
    expect(f.complete).toHaveBeenCalledOnce();
    expect(f.research).not.toHaveBeenCalled();
    expect(result.kind).toBe("answer");
    if (result.kind === "answer") {
      expect(result.answer.failureCode).toBeUndefined();
      expect(result.answer.evidenceClaims).toHaveLength(2);
      expect(result.answer.sources).toHaveLength(2);
      expect(result.answer.sources.every(source => source.href.includes(".pdf#page="))).toBe(true);
    }
  }, 120000);
  it("attaches the exact supplied PDF passage to each cited label and leaves out an invented one", async () => {
    f.complete.mockImplementation(async (request: { user: string; schema: { parse: (value: unknown) => unknown } }) => {
      const pages = JSON.parse(request.user).programSources.filter((source: { href: string }) => source.href.includes(".pdf#page="));
      const evidenceClaims = [
        ...pages.slice(0, 2).map((source: { ref: string }) => ({ text: "The original page describes participation supports.", refs: [source.ref.toLowerCase(), source.ref] })),
        { text: "A statement with no supplied source behind it.", refs: ["S99"] },
      ];
      // A provider that does not enforce the label list can still return a wrong label; ASK leaves it out.
      return { parsed: { shortAnswer: "Plan compensation and participation supports using both original PDFs.", whyItMatters: "", limits: [], resourceHrefs: [], evidenceClaims } };
    });
    const result = await askConcierge({ question, contextPreference: "one_dsd" }, { agent: getAgent("ask_concierge"), role: "staff", dry_run: false, trace_id: "4cecf283-d438-4528-a884-c7b2cc30b68a" });
    if (result.kind !== "answer") throw Error("Expected validated PDF answer");
    expect(result.answer.failureCode).toBeUndefined();
    expect(result.answer.generative).toBe(true);
    expect(result.answer.sources).toHaveLength(2);
    expect(result.answer.evidenceClaims).toHaveLength(2);
    expect(result.answer.evidenceClaims!.every(claim => claim.kind === "inference" && claim.references.length === 1)).toBe(true);
    for (const source of result.answer.sources) {
      const claim = result.answer.evidenceClaims!.find(claim => claim.references[0].evidenceId === source.evidence!.evidenceId)!;
      expect(claim.references[0]).toEqual({ evidenceId: source.evidence!.evidenceId, ...source.evidence!.excerpt });
    }
    expect(f.research).not.toHaveBeenCalled();
  }, 120000);
  it.each(["research", "clarify", null])("retains research when the named PDF evidence is not sufficient: %s", async evidence => {
    f.plan.mockResolvedValue(evidence ? { route: "resources", evidence } : null);
    await askConcierge({ question, contextPreference: "one_dsd" }, { agent: getAgent("ask_concierge"), role: "staff", dry_run: false, trace_id: "4cecf283-d438-4528-a884-c7b2cc30b68a" });
    expect(f.research).toHaveBeenCalledOnce();
  }, 120000);
  it("includes the complete CLAS action-step guidance when the title is paraphrased", async () => {
    const clasQuestion = "According to the CLAS handout Your CLAS Action Worksheet, what should I write down for three practices, implementation timeframes, and concrete action steps? Please cite the original PDF page.";
    f.complete.mockImplementation(async (request: { user: string }) => {
      const source = JSON.parse(request.user).programSources.find((source: { href: string }) => source.href.endsWith("clas-implementation-checklist.pdf#page=8"));
      expect(source).toBeDefined();
      expect(source.excerpt).toMatch(/three practices/i);
      expect(source.excerpt).toMatch(/timeframes/i);
      expect(source.excerpt).toMatch(/concrete action steps/i);
      return { parsed: { shortAnswer: "Choose three practices, set timeframes, and write concrete action steps.", whyItMatters: "", limits: [], resourceHrefs: [], evidenceClaims: [{ text: source.excerpt, refs: [source.ref] }] } };
    });
    const result = await askConcierge({ question: clasQuestion, contextPreference: "one_dsd" }, { agent: getAgent("ask_concierge"), role: "staff", dry_run: false, trace_id: "4cecf283-d438-4528-a884-c7b2cc30b68a" });
    if (result.kind !== "answer") throw Error("Expected CLAS answer");
    expect(result.answer.failureCode).toBeUndefined();
    expect(result.answer.sources[0].href).toBe("/documents/engagement/clas-implementation-checklist.pdf#page=8");
    expect(result.answer.evidenceClaims).toHaveLength(1);
  }, 120000);
  it.each([" Only use sources from this application; do not search the web.", " Use internal sources only.", " Using only this application, answer the question.", " Using this program alone, answer the question."])("does not initiate outside research for explicit local-only wording: %s", async (preference) => {
    f.plan.mockResolvedValue({ route: "resources", evidence: "research" });
    await askConcierge({ question: question + preference, contextPreference: "one_dsd" }, { agent: getAgent("ask_concierge"), role: "staff", dry_run: false, trace_id: "4cecf283-d438-4528-a884-c7b2cc30b68a" });
    expect(f.research).not.toHaveBeenCalled();
  }, 120000);
  it("honors the exact video question without starting public research", async () => {
    f.plan.mockResolvedValue({ route: "resources", evidence: "research" });
    const result = await askConcierge({ question: "Using only this application, what example does the democratic leadership video give?", contextPreference: "one_dsd" }, { agent: getAgent("ask_concierge"), role: "staff", dry_run: false, trace_id: "4cecf283-d438-4528-a884-c7b2cc30b68a" });
    expect(f.research).not.toHaveBeenCalled();
    expect(result.kind).toBe("answer");
    if (result.kind === "answer") expect(result.answer.publicResearch).toBeUndefined();
  }, 120000);
  it("keeps external source URLs and prior outside answers out of the writer payload for explicit program-only requests", async () => {
    let payload: any;
    let writerSystem = "";
    f.complete.mockImplementation(async (request: { user: string; system: string }) => {
      payload = JSON.parse(request.user);
      writerSystem = request.system;
      return { parsed: { shortAnswer: "Use the available application guidance.", whyItMatters: "", limits: [], resourceHrefs: [], evidenceClaims: [] } };
    });
    const result = await askConcierge({ question: "What does DHS say about language access? Use internal sources only.", contextPreference: "one_dsd", history: [{ question: "What about language access?", answer: "Outside answer: https://outside.example/secret" }] }, { agent: getAgent("ask_concierge"), role: "staff", dry_run: false, trace_id: "4cecf283-d438-4528-a884-c7b2cc30b68a" });
    expect(f.complete).toHaveBeenCalledOnce();
    expect(f.research).not.toHaveBeenCalled();
    expect(writerSystem).toMatch(/use only the supplied application sources/i);
    expect(writerSystem).toMatch(/examine assumptions, seek the perspectives of people affected/i);
    expect(writerSystem).toMatch(/without diagnosing, scoring or assigning an orientation/i);
    expect(writerSystem).not.toMatch(/use your general knowledge and reasoning/i);
    expect(writerSystem).not.toMatch(/give a useful general explanation/i);
    expect(payload.answerPreference).toMatch(/only the supplied application sources/i);
    expect(payload.answerPreference).toMatch(/insufficient/i);
    expect(payload.organization.entries).toEqual([]);
    expect(payload.programSources.every((source: { href: string }) => /^\/(?!\/)/.test(source.href))).toBe(true);
    expect((payload.programKnowledge ?? []).every((source: { href: string }) => /^\/(?!\/)/.test(source.href))).toBe(true);
    expect(JSON.stringify(payload.conversation)).not.toContain("outside.example");
    expect(payload.operationalizingEquity).toBeUndefined();
    if (result.kind !== "answer") throw Error("Expected an answer");
    expect(result.answer.sources.every(source => /^\/(?!\/)/.test(source.href))).toBe(true);
  }, 120000);
  it("retains source-backed organizational context for an ordinary question", async () => {
    let payload: any;
    f.complete.mockImplementation(async (request: { user: string }) => {
      payload = JSON.parse(request.user);
      return { parsed: { shortAnswer: "Check the current source.", whyItMatters: "", limits: [], resourceHrefs: [], evidenceClaims: [] } };
    });
    await askConcierge({ question: "What does DHS say about language access?", contextPreference: "one_dsd" }, { agent: getAgent("ask_concierge"), role: "staff", dry_run: false, trace_id: "4cecf283-d438-4528-a884-c7b2cc30b68a" });
    expect(f.complete).toHaveBeenCalledOnce();
    expect(payload.organization.entries.length).toBeGreaterThan(0);
    expect(payload.organization.entries.some((entry: { sources: Array<{ url: string }> }) => entry.sources.some(source => /^https?:/.test(source.url)))).toBe(true);
  }, 120000);
  it.each([" Search external research too.", " Compare this guide with external sources.", " What has changed in current guidance?"])("retains explicit outside or current research: %s", async extra => {
    await askConcierge({ question: question + extra, contextPreference: "one_dsd" }, { agent: getAgent("ask_concierge"), role: "staff", dry_run: false, trace_id: "4cecf283-d438-4528-a884-c7b2cc30b68a" });
    expect(f.research).toHaveBeenCalledOnce();
  }, 120000);
});
