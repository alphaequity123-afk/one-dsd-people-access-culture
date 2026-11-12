import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const f = vi.hoisted(() => ({ complete: vi.fn(), plan: vi.fn(), research: vi.fn(), review: vi.fn() }));
vi.mock("../tools/runtime", () => ({ runTool: async (_ctx: unknown, _name: string, fn: () => unknown) => fn(), auditRefusal: async () => {} }));
vi.mock("./jev", () => ({ reviewWithJev: f.review, planWithJev: f.plan, SPECIALIST_GUIDANCE: { resources: "Use the available program evidence.", support: "Point to the responsible person." } }));
vi.mock("../retrieval/local-semantic", () => ({ semanticRetrieveForAgent: async () => [], SemanticSearchUnavailable: class extends Error {} }));
vi.mock("../providers", () => ({ resolveBinding: () => ({ generative: true, model: { model_id: "synthetic-live" }, adapter: { id: "openai", complete: f.complete } }) }));
vi.mock("../research", () => ({ governedResearch: f.research, governedSearch: async () => { throw new Error("Unexpected search"); } }));
import { askConcierge, type AskInput } from "../agents/ask";
import type { AskProgress } from "../agents/ask-progress";
import { getAgent } from "../registry/agents";

const ctx = { agent: getAgent("ask_concierge"), role: "staff" as const, dry_run: false, trace_id: "7b0e5b0e-52c8-4f0e-9c3f-0d6d0f1f2a11" };
const question = "How can I make a meeting more accessible?";
const text = "Send materials ahead of time.\nOffer more than one way to take part, and ask what would help.";
const reply = { shortAnswer: text, whyItMatters: "People can prepare.", limits: [], evidenceClaims: [], resourceHrefs: [] };

/** A writer that sends its reply a few characters at a time, the way a streamed reply arrives. */
function streamingWriter(parsed: Record<string, unknown> = reply) {
  return async (request: { onText?: (soFar: string) => void }) => {
    const json = JSON.stringify(parsed);
    for (let length = 7; length < json.length; length += 7) request.onText?.(json.slice(0, length));
    request.onText?.(json);
    return { parsed };
  };
}
async function ask(input: Partial<AskInput> = {}) {
  const events: AskProgress[] = [];
  const result = await askConcierge({ question, contextPreference: "one_dsd", onProgress: event => events.push(event), ...input }, ctx);
  const stages = events.flatMap(event => event.type === "stage" ? [event.stage] : []);
  const shown = events.flatMap(event => event.type === "text" ? [event.text] : []);
  return { result, events, stages, shown };
}
const stub = () => {
  vi.stubEnv("PAC_CLONE_AGENTS", "on"); vi.stubEnv("PAC_STORE", "memory"); vi.stubEnv("PAC_CONTENT_SOURCE", "static");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Network is blocked in this regression test"); }));
  f.plan.mockResolvedValue({ route: "resources", evidence: "sufficient" });
  f.review.mockResolvedValue("pass");
  f.research.mockResolvedValue({ status: "failed", message: "Synthetic offline research" });
  f.complete.mockImplementation(streamingWriter());
};
// The first question builds the program library from cold; warm it once so each test measures its own work.
beforeAll(async () => { stub(); await ask().catch(() => undefined); vi.unstubAllEnvs(); vi.unstubAllGlobals(); }, 180000);
beforeEach(() => { vi.resetAllMocks(); stub(); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("an answer that appears as it is written", () => {
  it("reports each stage in order and shows the growing answer, ending with the whole of it", async () => {
    const { result, stages, shown } = await ask();
    expect(stages).toEqual(["reading", "writing", "finishing"]);
    expect(shown.length).toBeGreaterThan(1);
    for (let index = 1; index < shown.length; index++) expect(shown[index].startsWith(shown[index - 1])).toBe(true);
    expect(shown.at(-1)).toBe(text);
    if (result.kind !== "answer") throw new Error("Expected an answer");
    expect(result.answer.shortAnswer).toBe(text);
    expect(result.answer.generative).toBe(true);
    expect(f.complete).toHaveBeenCalledOnce();
    expect(f.research).not.toHaveBeenCalled();
  }, 120000);

  it("asks the writer for the answer first, so there is something to show at once", async () => {
    await ask();
    const { schema } = f.complete.mock.calls.at(-1)![0] as { schema: { shape: Record<string, unknown> } };
    expect(Object.keys(schema.shape).slice(0, 3)).toEqual(["shortAnswer", "whyItMatters", "limits"]);
  }, 120000);

  it("gives the same answer when no page is waiting for progress", async () => {
    const result = await askConcierge({ question, contextPreference: "one_dsd" }, ctx);
    if (result.kind !== "answer") throw new Error("Expected an answer");
    expect(result.answer.shortAnswer).toBe(text);
    expect((f.complete.mock.calls.at(-1)![0] as { onText?: unknown }).onText).toBeUndefined();
  }, 120000);

  it("shows nothing early for a personnel concern, and still gives the checked answer", async () => {
    const { result, shown, stages } = await ask({ question: "A colleague told me about harassment on our team. What general steps should a supervisor take?" });
    expect(shown).toEqual([]);
    expect(stages).toContain("writing");
    if (result.kind !== "answer") throw new Error("Expected an answer");
    expect(result.answer.escalate).toBeDefined();
    expect(result.answer.shortAnswer).toBe(text);
  }, 120000);

  it("shows nothing early when the routing step sends the question to a person", async () => {
    f.plan.mockResolvedValue({ route: "support", evidence: "sufficient" });
    const { shown } = await ask();
    expect(shown).toEqual([]);
  }, 120000);

  it("replaces what was shown when the closing check withholds the answer", async () => {
    f.review.mockResolvedValue("human");
    const { result, shown } = await ask();
    expect(shown.at(-1)).toBe(text);
    if (result.kind !== "answer") throw new Error("Expected an answer");
    expect(result.answer.shortAnswer).not.toBe(text);
    expect(result.answer.shortAnswer).toContain("needs a person");
  }, 120000);

  it("sets aside what was shown when writing fails, and says so plainly", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    f.complete.mockImplementation(async (request: { onText?: (soFar: string) => void }) => {
      request.onText?.("{\"shortAnswer\":\"Send materials");
      throw new Error("openai_stream_error");
    });
    const { result, events } = await ask();
    expect(events.some(event => event.type === "text")).toBe(true);
    expect(events.findLastIndex(event => event.type === "reset")).toBeGreaterThan(events.findLastIndex(event => event.type === "text"));
    if (result.kind !== "answer") throw new Error("Expected an answer");
    expect(result.answer.generative).toBe(false);
    expect(result.answer.degraded).toBe(true);
  }, 120000);

  it("keeps answering when the page has gone away", async () => {
    const result = await askConcierge({ question, contextPreference: "one_dsd", onProgress: () => { throw new Error("page closed"); } }, ctx);
    if (result.kind !== "answer") throw new Error("Expected an answer");
    expect(result.answer.shortAnswer).toBe(text);
  }, 120000);
});

describe("writing once", () => {
  it("leaves out a citation that names no supplied source, without writing the answer again", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    f.complete.mockImplementation(streamingWriter({ ...reply, evidenceClaims: [{ text: "An unsupported statement.", refs: ["S99"] }] }));
    const { result } = await ask();
    expect(f.complete).toHaveBeenCalledOnce();
    if (result.kind !== "answer") throw new Error("Expected an answer");
    expect(result.answer.shortAnswer).toBe(text);
    expect(result.answer.evidenceClaims).toBeUndefined();
    expect(result.answer.sources).toEqual([]);
  }, 120000);

  it("records how long each part took, with no question or answer text", async () => {
    const logged = vi.spyOn(console, "info").mockImplementation(() => undefined);
    await ask();
    const timing = logged.mock.calls.find(([label]) => label === "ask_timing")?.[1] as Record<string, unknown>;
    expect(timing).toMatchObject({ traceId: ctx.trace_id, generative: true, research: "none" });
    for (const part of ["read", "plan", "write", "first_text", "review", "total"]) expect(typeof timing[part]).toBe("number");
    expect(JSON.stringify(timing)).not.toContain("meeting");
    expect(JSON.stringify(timing)).not.toContain("materials");
  }, 120000);
});

describe("searching outside sources only when it helps", () => {
  it("does not search for a calculation or for wording help with supplied text", async () => {
    for (const selfContained of ["What is 17 times 23?", "(1200 + 350) / 4", "Rewrite this so it is clearer: we will be closing the office on Fridays effective the first of next month."]) {
      f.plan.mockResolvedValue(null);
      const { stages } = await ask({ question: selfContained });
      expect(stages, selfContained).not.toContain("checking");
    }
    expect(f.research).not.toHaveBeenCalled();
  }, 180000);

  it("searches alongside routing when the question asks for current information, and says so", async () => {
    f.plan.mockResolvedValue(null);
    const { stages } = await ask({ question: "What is the latest federal guidance on waiver rates this year?" });
    expect(f.research).toHaveBeenCalledOnce();
    expect(stages).toEqual(["reading", "checking", "writing", "finishing"]);
  }, 120000);

  it("leaves the choice to the routing step when the program has some material but not all", async () => {
    f.plan.mockResolvedValue({ route: "resources", evidence: "sufficient" });
    await ask({ question: "Explain accessible meeting planning in detail, with ten numbered steps and a sample HTML button." });
    expect(f.research).not.toHaveBeenCalled();
  }, 120000);
});

describe("work with Native American communities and Tribal Nations", () => {
  const referred = /Office of Indian Policy or the (?:responsible|appropriate) Tribal liaison comes first/;
  it("is referred first, holds to the program's own pages, and is not shown while it is written", async () => {
    const { result, shown } = await ask({ question: "My team will meet next month with Native American families about waiver services. What should we prepare?" });
    const request = f.complete.mock.calls.at(-1)![0] as { system: string };
    expect(request.system).toContain("they come first");
    expect(request.system).toContain("Do not add your own description of Native cultures");
    expect(shown).toEqual([]);
    if (result.kind !== "answer") throw new Error("Expected an answer");
    expect(result.answer.shortAnswer).toMatch(referred);
    expect(result.answer.shortAnswer.indexOf("Office of Indian Policy")).toBeLessThan(120);
    expect(result.answer.shortAnswer).toContain(text);
    expect(result.answer.limits.join(" ")).not.toContain("Office of Indian Policy");
  }, 120000);

  it("recognises Alaska Native people and the Nations by name", async () => {
    for (const question of ["How should we plan outreach with Alaska Native families?", "We are preparing a listening session at Leech Lake. What should we plan for?"]) {
      const { result } = await ask({ question });
      if (result.kind !== "answer") throw new Error("Expected an answer");
      expect(result.answer.shortAnswer, question).toMatch(referred);
    }
  }, 180000);

  it("does not repeat the referral when the answer already opens with it", async () => {
    f.complete.mockImplementation(streamingWriter({ ...reply, shortAnswer: "The Office of Indian Policy and the Tribal liaison come first for this work. " + text }));
    const { result } = await ask({ question: "How do we consult with a Tribal Nation about a policy change?" });
    if (result.kind !== "answer") throw new Error("Expected an answer");
    expect(result.answer.shortAnswer.match(/Office of Indian Policy/g)).toHaveLength(1);
  }, 120000);

  it("answers a question of general knowledge as usual, with the referral as a note", async () => {
    const { result } = await ask({ question: "What is Tribal sovereignty?" });
    const request = f.complete.mock.calls.at(-1)![0] as { system: string };
    expect(request.system).not.toContain("they come first");
    if (result.kind !== "answer") throw new Error("Expected an answer");
    expect(result.answer.shortAnswer).toBe(text);
    expect(result.answer.limits.join(" ")).toContain("Office of Indian Policy");
  }, 120000);

  it("does not mistake North Dakota for a Tribal subject", async () => {
    const { result } = await ask({ question: "How do we plan a meeting with partners from North Dakota?" });
    if (result.kind !== "answer") throw new Error("Expected an answer");
    expect(result.answer.shortAnswer).toBe(text);
    expect(result.answer.limits.join(" ")).not.toContain("Office of Indian Policy");
  }, 120000);
});
