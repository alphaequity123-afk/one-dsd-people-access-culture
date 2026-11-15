import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const f = vi.hoisted(() => ({ complete: vi.fn() }));
vi.mock("../tools/runtime", () => ({ runTool: async (_ctx: unknown, _name: string, fn: () => unknown) => fn(), auditRefusal: async () => {} }));
vi.mock("./jev", () => ({ reviewWithJev: async () => "pass", planWithJev: async () => ({ route: "resources", evidence: "sufficient" }), SPECIALIST_GUIDANCE: { resources: "Use the available program evidence." } }));
vi.mock("../retrieval/local-semantic", () => ({ semanticRetrieveForAgent: async () => [], SemanticSearchUnavailable: class extends Error {} }));
vi.mock("../providers", () => ({ resolveBinding: () => ({ generative: true,
  model: { model_id: "synthetic-response-mode" }, adapter: { complete: f.complete } }) }));
vi.mock("../research", () => ({ asksForScholarlyResearch: () => false,
  governedResearch: async () => { throw new Error("Unexpected external research in internal-source fixture"); },
  governedSearch: async () => { throw new Error("Unexpected search in internal-source fixture"); },
}));
import { askConcierge, type AskInput } from "../agents/ask";
import { getAgent } from "../registry/agents";
import { strictSchemaForOpenAI } from "../providers/openai";

const ctx = { agent: getAgent("ask_concierge"), role: "staff" as const, dry_run: false,
  trace_id: "2a7f18c9-dab2-42bb-a07d-e8fa93219286" };
const question = "How can I make a meeting more accessible?";
const answer = { shortAnswer: "Send materials ahead and offer several ways to participate.", whyItMatters: "", limits: [], evidenceClaims: [], resourceHrefs: [] };
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("PAC_CLONE_AGENTS", "on"); vi.stubEnv("PAC_STORE", "memory"); vi.stubEnv("PAC_CONTENT_SOURCE", "static");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Network is blocked in this regression test"); }));
  f.complete.mockResolvedValue({ parsed: answer });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

async function complete(input: Partial<AskInput> = {}) {
  const result = await askConcierge({ question, contextPreference: "one_dsd", ...input }, ctx);
  expect(result.kind).toBe("answer");
  expect(f.complete).toHaveBeenCalled();
  return { result, request: f.complete.mock.calls.at(-1)![0] };
}

describe("spoken answer preference", () => {
  it("preserves the original text prompt by default and keeps source contracts identical", async () => {
    const omitted = await complete();
    const text = await complete({ responseMode: "text" });
    const spoken = await complete({ responseMode: "spoken" });
    expect(omitted.request.system).toBe(text.request.system);
    expect(text.request.system).not.toContain("easy to follow by ear");
    expect(spoken.request.system).toContain("easy to follow by ear");
    expect(spoken.request.system).toContain("Honor all explicitly requested details");
    expect(spoken.request.system).toContain("continuing an existing draft");
    expect(strictSchemaForOpenAI(spoken.request.schema).schema).toEqual(strictSchemaForOpenAI(text.request.schema).schema);
    expect(JSON.parse(spoken.request.user)).toEqual(JSON.parse(text.request.user));
  }, 120000);

  it("does not truncate a requested detailed answer or code in spoken mode", async () => {
    const detailedQuestion = "Explain accessible meeting planning in detail, with ten numbered steps and a sample HTML button.";
    const detail = Array.from({ length: 10 }, (_, index) => `${index + 1}. Review this access arrangement and explain how participants can use it.`).join("\n") + '\n```html\n<button type="button">Join meeting</button>\n```';
    f.complete.mockResolvedValue({ parsed: { ...answer, shortAnswer: detail } });
    const { result, request } = await complete({ question: detailedQuestion, responseMode: "spoken" });
    expect(JSON.parse(request.user).question).toBe(detailedQuestion);
    // Nothing is cut short. The answer is plain text, so the code keeps its own line without the fence marks.
    if (result.kind === "answer") expect(result.answer.shortAnswer).toBe(detail.replace("```html\n", "").replace(/\n```$/, ""));
  }, 120000);

  it("keeps an explicitly requested worksheet and its follow-up revision in spoken mode", async () => {
    f.complete.mockResolvedValue({ parsed: { ...answer, practiceDraft: { pathId: "gp-8", fields: [{ id: "ahead", value: "Proposed: send accessible materials before the meeting; timing to confirm." }] } } });
    const first = await complete({ question: "Draft an accessible meeting worksheet.", pathId: "gp-8", responseMode: "spoken" });
    if (first.result.kind !== "answer") throw new Error("Expected worksheet answer");
    const priorArtifact = first.result.answer.practiceArtifact;
    expect(priorArtifact?.values.ahead).toContain("Proposed:");
    f.complete.mockResolvedValue({ parsed: { ...answer, practiceDraft: { pathId: "gp-8", fields: [{ id: "formats", value: ["Speaking", "Written input"] }] } } });
    const revised = await complete({ question: "Add written input to this accessible meeting draft.", responseMode: "spoken", priorArtifact });
    expect(JSON.parse(revised.request.user).practiceDraft.previousDraft.values.ahead).toBe(priorArtifact!.values.ahead);
    if (revised.result.kind === "answer") {
      expect(revised.result.answer.practiceArtifact?.parentRevisionId).toBe(priorArtifact!.revisionId);
      expect(revised.result.answer.practiceArtifact?.values).toMatchObject({ ahead: priorArtifact!.values.ahead, formats: ["Speaking", "Written input"] });
    }
  }, 120000);
});
