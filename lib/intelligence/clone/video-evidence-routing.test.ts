import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Doc } from "../retrieval/search";
vi.mock("server-only", () => ({}));
const f = vi.hoisted(() => ({ docs: [] as Doc[], complete: vi.fn(), research: vi.fn() }));
vi.mock("../tools/runtime", () => ({ runTool: async (_ctx: unknown, _name: string, fn: () => unknown) => fn(), auditRefusal: async () => {} }));
vi.mock("./jev", () => ({ reviewWithJev: async () => "pass", planWithJev: async () => ({ route: "resources", evidence: "sufficient" }), SPECIALIST_GUIDANCE: { resources: "Use the available evidence." } }));
vi.mock("../retrieval/local-semantic", () => ({ semanticRetrieveForAgent: async () => [], SemanticSearchUnavailable: class extends Error {} }));
vi.mock("../retrieval/program-resources", () => ({ indexedProgramResources: async () => ({ destinations: f.docs, communityDocs: [] }), programResourceLinks: () => [] }));
vi.mock("../retrieval/staff-search", () => ({ indexedStaffDocs: async () => [] }));
vi.mock("../providers", () => ({ resolveBinding: () => ({ generative: true, model: { model_id: "synthetic-video" }, adapter: { complete: f.complete } }) }));
vi.mock("../research", () => ({ governedResearch: f.research, governedSearch: async () => { throw Error("Unexpected search"); } }));
import { askConcierge } from "../agents/ask";
import { getAgent } from "../registry/agents";

const transcript: Doc = { kind: "content", id: "leadership-video-democratic", title: "Democratic leadership: video transcript", href: "/learn/cultural-intelligence#leadership-style-democratic", authority: "learning", type: "leadership_video_transcript", status: "approved", reviewDate: "", scope: "dsd", summary: "Invite participation while retaining accountability.", text: "Narrator: Democratic leadership invites participation. Narrator: Imagine a team in the Disability Services Division revising a meeting invitation. The invitation is only in English. The supervisor asks disabled people and partners what would support participation. The team provides accessible formats and language support.", tags: ["democratic", "leadership", "video"], intents: [] };

beforeEach(() => {
  vi.resetAllMocks(); f.docs = [transcript];
  vi.stubEnv("PAC_CLONE_AGENTS", "on"); vi.stubEnv("PAC_STORE", "memory"); vi.stubEnv("PAC_CONTENT_SOURCE", "static");
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("Network blocked in regression test"); }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Ask video scenario citations", () => {
  it("provides the actual scenario as validated program evidence and keeps external research off", async () => {
    f.complete.mockImplementation(async (request: { user: string }) => {
      const payload = JSON.parse(request.user);
      const source = payload.programSources.find((item: { id: string }) => item.id === transcript.id);
      expect(source.evidence.excerpt.quote).toContain("Imagine a team in the Disability Services Division");
      return { parsed: { shortAnswer: "A team revises a meeting invitation and asks people what they need to participate.", whyItMatters: "", limits: [], resourceHrefs: [], evidenceClaims: [{ kind: "source_excerpt", text: source.evidence.excerpt.quote, references: [{ evidenceId: source.evidence.evidenceId, ...source.evidence.excerpt }] }] } };
    });
    const result = await askConcierge({ question: "Using only this application, what example does the democratic leadership video give?", contextPreference: "one_dsd" }, { agent: getAgent("ask_concierge"), role: "staff", dry_run: false, trace_id: "4cecf283-d438-4528-a884-c7b2cc30b68a" });
    expect(f.research).not.toHaveBeenCalled();
    expect(result.kind).toBe("answer");
    if (result.kind !== "answer") return;
    expect(result.answer.publicResearch).toBeUndefined();
    expect(result.answer.failureCode).toBeUndefined();
    expect(result.answer.sources.some(source => source.id === transcript.id)).toBe(true);
    expect(result.answer.evidenceClaims).toHaveLength(1);
    expect(result.answer.limits.join(" ")).not.toContain("could not be matched exactly");
  }, 20000);
});
