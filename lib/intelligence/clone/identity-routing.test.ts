import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
const f = vi.hoisted(() => ({ index: vi.fn(), research: vi.fn(), complete: vi.fn(), plan: vi.fn(), review: vi.fn(),
  paused: vi.fn(), ask: vi.fn(), admit: vi.fn(), finish: vi.fn(), close: vi.fn(), refusal: vi.fn() }));
vi.mock("../tools/runtime", () => ({ runTool: async (_ctx: unknown, _name: string, fn: () => unknown) => fn(), auditRefusal: f.refusal }));
vi.mock("../retrieval/program-resources", () => ({ indexedProgramResources: f.index, programResourceLinks: () => [] }));
vi.mock("../retrieval/staff-search", () => ({ indexedStaffDocs: async () => [] }));
vi.mock("../retrieval/local-semantic", () => ({ semanticRetrieveForAgent: async () => [], SemanticSearchUnavailable: class extends Error {} }));
vi.mock("../providers", () => ({ resolveBinding: () => ({ generative: true, model: { model_id: "synthetic-identity" }, adapter: { complete: f.complete } }) }));
vi.mock("../research", () => ({ asksForScholarlyResearch: () => false, governedResearch: f.research, governedSearch: f.research }));
vi.mock("./jev", () => ({ planWithJev: f.plan, reviewWithJev: f.review, SPECIALIST_GUIDANCE: { general: "Answer the actual question." } }));
vi.mock("../orchestrator", () => ({ paused: f.paused, ask: f.ask, contextFor: () => ctx }));
vi.mock("./ledger", () => ({ openLedger: () => ({ close: f.close }), admitRun: f.admit, finishRun: f.finish }));
vi.mock("@/lib/security/rate-limit", () => ({ consumeRequestLimit: async () => ({ allowed: true }), rateLimitHeaders: () => ({}) }));
import { askConcierge, type AskInput } from "../agents/ask";
import { getAgent } from "../registry/agents";
import { POST } from "@/app/api/ask/route";
import { DEFAULT_PRODUCT_CONTEXT } from "@/lib/product/federation";

const exactQuestion = "Is ASK an AI system or a human adviser?";
const ctx = { agent: getAgent("ask_concierge"), role: "staff" as const, dry_run: false, trace_id: "5cb037d6-78f6-4f34-ac58-4c9c385337d5" };
const request = (body: unknown) => new NextRequest("http://localhost:8911/api/ask", {
  method: "POST", headers: { origin: "http://localhost:8911", "content-type": "application/json" }, body: JSON.stringify(body),
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("PAC_CLONE_AGENTS", "on"); vi.stubEnv("PAC_PUBLIC_ORIGIN", "http://localhost:8911");
  vi.stubEnv("PAC_STORE", "memory"); vi.stubEnv("PAC_CONTENT_SOURCE", "static");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Network blocked in identity regression"); }));
  f.index.mockResolvedValue({ communityDocs: [], destinations: [] });
  f.research.mockResolvedValue({ status: "not_admitted", message: "Synthetic research fixture." });
  f.plan.mockResolvedValue({ route: "general", evidence: "sufficient" });
  f.complete.mockResolvedValue({ parsed: { shortAnswer: "A general subject answer.", whyItMatters: "", limits: [], evidenceClaims: [], resourceHrefs: [] } });
  f.paused.mockResolvedValue(false); f.admit.mockReturnValue("server-run"); f.review.mockResolvedValue("pass");
  f.ask.mockImplementation((input: AskInput) => askConcierge(input, ctx));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("local ASK identity", () => {
  it.each([exactQuestion, "Are you an AI or a human?", "Are you a real person?", "Is ASK a chatbot?", "Who are you?", "Who am I speaking to?"])("answers direct identity without external lookup: %s", async question => {
    const result = await askConcierge({ question }, ctx);
    expect(result.kind).toBe("answer");
    if (result.kind === "answer") {
      expect(result.answer.shortAnswer).toContain("I’m Ask, the One DSD question-and-answer tool, not a human adviser");
      expect(result.answer).toMatchObject({ generative: false, degraded: false, grounding: "none", sources: [] });
      expect(result.answer.publicResearch).toBeUndefined();
    }
    expect(f.index).not.toHaveBeenCalled(); expect(f.plan).not.toHaveBeenCalled();
    expect(f.research).not.toHaveBeenCalled(); expect(f.complete).not.toHaveBeenCalled();
  });

  it.each([
    "What is an AI system?", "How do AI systems differ from human advisers?", "Is Ask.com an AI system or a search engine?",
    "Is ASK an AI system or a human adviser in the product I saw on another website?",
    'Explain the wording "Is ASK an AI system or a human adviser?"',
    "Are you an AI, and how do neural networks work?",
  ])("keeps other subjects and compound questions on normal routing: %s", async question => {
    const result = await askConcierge({ question }, ctx);
    expect(f.index).toHaveBeenCalled(); expect(f.research).toHaveBeenCalled(); expect(f.complete).toHaveBeenCalled();
    if (result.kind === "answer") expect(result.answer.shortAnswer).toBe("A general subject answer.");
  });

  it("does not replace a draft review with a self-identity answer", async () => {
    await askConcierge({ question: exactQuestion, mode: "review" }, ctx);
    expect(f.index).toHaveBeenCalled(); expect(f.research).toHaveBeenCalled();
  });

  it.each([
    { question: exactQuestion + " My SSN is 123-45-6789." },
    { question: exactQuestion, history: [{ question: "SSN 123-45-6789", answer: "Private fixture." }] },
    { question: exactQuestion, priorArtifact: {
      schemaVersion: 1, artifactId: "5cb037d6-78f6-4f34-ac58-4c9c385337d5", revisionId: "8cb037d6-78f6-4f34-ac58-4c9c385337d5",
      parentRevisionId: null, traceId: "5cb037d6-78f6-4f34-ac58-4c9c385337d5", createdAt: "2026-10-25T00:00:00.000Z",
      context: DEFAULT_PRODUCT_CONTEXT, pathId: "gp-8", pathContract: "a".repeat(64), title: "Synthetic draft", values: { ahead: "SSN 123-45-6789" }, sources: [],
    } },
  ])("keeps privacy checks ahead of local identity", async input => {
    expect((await askConcierge(input as AskInput, ctx)).kind).toBe("refusal");
    expect(f.refusal).toHaveBeenCalled(); expect(f.index).not.toHaveBeenCalled(); expect(f.research).not.toHaveBeenCalled();
  });
});

describe("identity through the public ASK route", () => {
  it.each(["text", "spoken"])("admits the fixed local %s answer without a provider call", async responseMode => {
    const response = await POST(request({ question: exactQuestion, responseMode }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.answer.shortAnswer).toContain("I’m Ask, the One DSD question-and-answer tool, not a human adviser");
    expect(f.admit).toHaveBeenCalledTimes(1);
    expect(f.finish).toHaveBeenCalledWith(expect.anything(), "server-run", "completed");
    expect(f.research).not.toHaveBeenCalled(); expect(f.complete).not.toHaveBeenCalled(); expect(f.review).not.toHaveBeenCalled();
  });
  it("blocks local answers when paused or allowance is exhausted", async () => {
    f.paused.mockResolvedValue(true);
    expect((await POST(request({ question: exactQuestion }))).status).toBe(503);
    expect(f.ask).not.toHaveBeenCalled();
    f.paused.mockResolvedValue(false); f.admit.mockReturnValue(null);
    expect((await POST(request({ question: exactQuestion }))).status).toBe(429);
    expect(f.ask).not.toHaveBeenCalled();
  });
  it("rechecks owner stop before releasing the answer", async () => {
    f.paused.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    expect((await (await POST(request({ question: exactQuestion }))).json()).error).toContain("paused");
  });
});

describe("the privacy check before any provider", () => {
  it.each([
    "My client John Smith has a disability and lost his eligibility. What should I do?",
    "This employee has a medical condition and filed a complaint. How do I respond?",
    "Please email me at someone@example.org about this.",
    "Summarize this confidential memo for me.",
  ])("stops private details: %s", async question => {
    expect((await askConcierge({ question }, ctx)).kind).toBe("refusal");
    expect(f.index).not.toHaveBeenCalled(); expect(f.research).not.toHaveBeenCalled(); expect(f.complete).not.toHaveBeenCalled(); expect(f.plan).not.toHaveBeenCalled();
  });
  it.each([
    "How should a supervisor support an employee who asks for a disability accommodation?",
    "What is person-centered planning?",
    "Who was Vang Pao?",
    "What does the Disability Services Division do?",
    "How do I file a complaint about discrimination?",
    "What does confidential mean?",
  ])("still answers a general question: %s", async question => {
    expect((await askConcierge({ question }, ctx)).kind).toBe("answer");
  });
  it("shares a written answer the final review marks revise, and withholds one it sends to a person", async () => {
    f.review.mockResolvedValue("revise");
    const revised = await askConcierge({ question: "What is person-centered planning?" }, ctx);
    expect(revised.kind).toBe("answer");
    if (revised.kind === "answer") expect(revised.answer.shortAnswer).toBe("A general subject answer.");
    f.review.mockResolvedValue("human");
    const held = await askConcierge({ question: "What is person-centered planning?" }, ctx);
    if (held.kind === "answer") expect(held.answer.shortAnswer).not.toBe("A general subject answer.");
  });
  it.each([
    "The Disability Services Division has a new equity plan. Where can I find it?",
    "Explain how Medical Assistance is different from Medicare.",
    "What makes information confidential under the Minnesota Government Data Practices Act?",
    "Is 651-431-2000 the main phone number for the Department of Human Services?",
    "Who do I email about language access? Is it dhs.info@state.mn.us?",
  ])("answers a general question that names no person: %s", async question => {
    expect((await askConcierge({ question }, ctx)).kind).toBe("answer");
  });
  it.each([
    "My client was denied a waiver. Her number is 612-555-0100.",
    "Ms. Lopez has a disability accommodation on file. What should I do?",
    "Client ID 12345678 was denied eligibility.",
  ])("still declines private details about a person: %s", async question => {
    expect((await askConcierge({ question }, ctx)).kind).toBe("refusal");
  });
});
