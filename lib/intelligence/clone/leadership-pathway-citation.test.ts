import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Doc } from "../retrieval/search";
vi.mock("server-only", () => ({}));
const f = vi.hoisted(() => ({ docs: [] as Doc[], complete: vi.fn(), research: vi.fn() }));
vi.mock("../tools/runtime", () => ({ runTool: async (_ctx: unknown, _name: string, fn: () => unknown) => fn(), auditRefusal: async () => {} }));
vi.mock("./jev", () => ({ reviewWithJev: async () => "pass", planWithJev: async () => ({ route: "resources", evidence: "sufficient" }), SPECIALIST_GUIDANCE: { resources: "Use the available evidence." } }));
vi.mock("../retrieval/local-semantic", () => ({ semanticRetrieveForAgent: async () => [], SemanticSearchUnavailable: class extends Error {} }));
vi.mock("../retrieval/program-resources", () => ({ indexedProgramResources: async () => ({ destinations: f.docs, communityDocs: [] }), programResourceLinks: () => [] }));
vi.mock("../retrieval/staff-search", () => ({ indexedStaffDocs: async () => [] }));
vi.mock("../providers", () => ({ resolveBinding: () => ({ generative: true, model: { model_id: "synthetic-leadership" }, adapter: { complete: f.complete } }) }));
vi.mock("../research", () => ({ governedResearch: f.research, governedSearch: async () => { throw Error("Unexpected search"); } }));
import { askConcierge } from "../agents/ask";
import { getAgent } from "../registry/agents";
import { leadershipStylesPathwayDocs } from "../retrieval/leadership-styles-pathway-docs";

beforeEach(() => {
  vi.resetAllMocks(); f.docs = leadershipStylesPathwayDocs("dsd");
  vi.stubEnv("PAC_CLONE_AGENTS", "on"); vi.stubEnv("PAC_STORE", "memory"); vi.stubEnv("PAC_CONTENT_SOURCE", "static");
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("Network blocked in regression test"); }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

// Writers retype curly quotation marks, apostrophes and dashes as keyboard characters.
const plain = (text: string) => text.replace(/[“”]/g, "\"").replace(/[‘’]/g, "'").replace(/[–—]/g, "-");
const typographic = /[“”‘’–—]/;

describe("Ask leadership pathway citations", () => {
  it("keeps the leadership lesson citation when the writer retypes curly quotation marks", async () => {
    let offered: Array<{ id: string; evidence: { evidenceId: string; excerpt: { start: number; end: number; quote: string } } }> = [];
    f.complete.mockImplementation(async (request: { user: string }) => {
      offered = JSON.parse(request.user).programSources ?? [];
      const claims = offered.filter(source => source.id.startsWith("leadership-pathway-") && typographic.test(source.evidence.excerpt.quote)).slice(0, 2).map(source => {
        const quote = plain(source.evidence.excerpt.quote);
        return { kind: "source_excerpt", text: quote, references: [{ evidenceId: source.evidence.evidenceId, start: source.evidence.excerpt.start, end: source.evidence.excerpt.end, quote }] };
      });
      return { parsed: { shortAnswer: "Servant leadership listens to the person and checks how visible assignments are shared.", whyItMatters: "", limits: [], resourceHrefs: [], evidenceClaims: claims } };
    });
    const result = await askConcierge({ question: "How does servant leadership handle a report that an employee is excluded from visible assignments?", contextPreference: "one_dsd" }, { agent: getAgent("ask_concierge"), role: "staff", dry_run: false, trace_id: "5d1f0a52-3b8e-4c47-9e0f-1f5a3c2b7d10" });
    expect(result.kind).toBe("answer");
    if (result.kind !== "answer") return;
    const cited = offered.filter(source => source.id.startsWith("leadership-pathway-") && typographic.test(source.evidence.excerpt.quote));
    expect(cited.length).toBeGreaterThan(0);
    expect(offered.some(source => source.id.startsWith("leadership-pathway-style-servant"))).toBe(true);
    expect(result.answer.limits.join(" ")).not.toContain("could not be matched exactly");
    expect(result.answer.sources.length).toBeGreaterThan(0);
    expect(result.answer.sources.every(source => source.href.startsWith("/learn/leadership-styles"))).toBe(true);
    // The citation shows the lesson's own characters, not the retyped ones.
    for (const claim of result.answer.evidenceClaims ?? []) expect(cited.some(source => source.evidence.excerpt.quote === claim.text)).toBe(true);
  }, 20000);
});
