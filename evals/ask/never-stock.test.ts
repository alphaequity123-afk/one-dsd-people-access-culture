/**
 * A2 fault matrix: Ask always answers in words (docs/EVALS-STUDY.md, section 6, A2).
 *
 * Each fault in evals/ask/stock-replies.json is injected below the real route (app/api/ask/route.ts) and the real
 * Ask (lib/intelligence/agents/ask.ts). The test reads the reply a person would see and requires a real answer of at
 * least 40 words with no stock phrase. Where the code returns stock text today, the case FAILS on purpose: the owner
 * must choose a non-stock fallback (for example, an answer written from the library's own text). Do not loosen it.
 *
 * Offline: providers, research, embeddings and the run ledger are replaced; fetch is blocked. Questions are synthetic.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { answerWords, loadStockList, parseAskBody, shownText, stockMatcher, visibleReply } from "./golden.ts";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ fault: "none", writerCalls: 0 }));
const WRITTEN = "Send the agenda and materials ahead of time so people can prepare, and ask everyone the same question about access needs without asking anyone to explain a disability. Arrange captions and interpretation before the meeting, choose a room or platform that works with assistive technology, give people spoken and written ways to contribute, and close by sharing decisions, owners and next steps in an accessible follow-up note.";

vi.mock("@/lib/intelligence/tools/runtime", () => ({ runTool: async (_ctx: unknown, _name: string, fn: () => unknown) => fn(), auditRefusal: async () => {} }));
vi.mock("@/lib/intelligence/clone/jev", () => ({
  planWithJev: async () => ({ route: "resources", evidence: "sufficient" }),
  reviewWithJev: async () => "pass",
  SPECIALIST_GUIDANCE: { resources: "Use the available program evidence.", support: "Point to the responsible person.", accessibility: "Check access." },
}));
vi.mock("@/lib/intelligence/clone/ledger", () => ({
  openLedger: () => {
    if (state.fault === "database-unconfigured-ledger") throw new Error("SQLITE_CANTOPEN: unable to open database file");
    return { close() {} };
  },
  admitRun: () => "synthetic-run", finishRun: () => {}, recordDecision: () => {}, ledgerSummary: () => [],
}));
vi.mock("@/lib/security/rate-limit", () => ({ consumeRequestLimit: async () => ({ allowed: true }), rateLimitHeaders: () => ({}) }));
vi.mock("@/lib/intelligence/retrieval/verified-draft", () => ({ verifyAnswerDraft: async (options: { draft: unknown }) => ({ draft: options.draft, repaired: false, reviewed: true, unresolved: [] }) }));
vi.mock("@/lib/intelligence/research", () => ({
  asksForScholarlyResearch: () => false,
  // Outside research is not part of this matrix: it reports that no web search was needed.
  governedResearch: async () => ({ status: "failed", error_code: "research_search_not_performed", message: "" }),
  governedSearch: async () => ({ status: "failed", message: "" }),
}));
vi.mock("@/lib/intelligence/retrieval/local-semantic", () => {
  class SemanticSearchUnavailable extends Error {}
  return {
    SemanticSearchUnavailable,
    semanticRetrieveForAgent: async () => {
      if (state.fault === "embeddings-unavailable") throw new SemanticSearchUnavailable("embeddings_unavailable");
      if (state.fault === "embeddings-error") throw new Error("embeddings_http_500");
      return [];
    },
  };
});
vi.mock("@/lib/intelligence/retrieval/search", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/intelligence/retrieval/search")>();
  return { ...actual, searchDocs: (...args: Parameters<typeof actual.searchDocs>) => {
    if (state.fault === "search-throws") throw new Error("search_failed");
    return actual.searchDocs(...args);
  } };
});
vi.mock("@/lib/intelligence/retrieval/brain", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/intelligence/retrieval/brain")>();
  return { ...actual, expandThroughGraph: (...args: Parameters<typeof actual.expandThroughGraph>) => {
    if (state.fault === "graph-throws") throw new Error("graph_timeout");
    return actual.expandThroughGraph(...args);
  } };
});
vi.mock("@/lib/intelligence/providers", () => ({
  resolveBinding: () => ({
    generative: true, model: { model_id: "synthetic-writer", provider_model_ref: "synthetic" },
    adapter: {
      id: "synthetic",
      complete: async () => {
        state.writerCalls += 1;
        if (state.fault === "writer-fails-always") throw Object.assign(new Error("provider_unavailable"), { name: "ProviderUnavailableError" });
        // A malformed reply once: the codebase's own one-format-retry path should then succeed.
        if (state.fault === "writer-fails-once" && state.writerCalls === 1) throw Object.assign(new Error("Invalid writer output"), { name: "ZodError", issues: [] });
        return { parsed: { shortAnswer: WRITTEN, whyItMatters: "People take part fully when access is planned in advance rather than requested afterward.", limits: [], evidenceClaims: [], resourceHrefs: [] }, model_id: "synthetic-writer" };
      },
    },
  }),
}));

import { POST } from "@/app/api/ask/route";

const list = loadStockList();
const stock = stockMatcher(list);
const ORIGIN = "http://localhost:8911";
const ask = async (question: string) => {
  let response: Response;
  try {
    response = await POST(new NextRequest(`${ORIGIN}/api/ask`, { method: "POST", headers: { origin: ORIGIN, "content-type": "application/json" }, body: JSON.stringify({ question }) }));
  } catch (error) {
    // The route threw: the person would get the framework's error page, not an answer.
    return { status: 500, reply: visibleReply({ error: `the route threw (${error instanceof Error ? error.message : String(error)}); the person sees an error page` }) };
  }
  return { status: response.status, reply: visibleReply(parseAskBody(await response.text())) };
};
const env = (fault: string) => {
  vi.stubEnv("PAC_CLONE_AGENTS", "on"); vi.stubEnv("PAC_PUBLIC_ORIGIN", ORIGIN); vi.stubEnv("PAC_STORE", "memory");
  vi.stubEnv("PAC_CONTENT_SOURCE", fault === "database-unconfigured-content" ? "postgres" : "static");
  vi.stubEnv("PAC_RUNTIME_DATABASE_URL", "");
  // The fast streamed path runs only with a provider key; a synthetic key with blocked network makes it fail.
  vi.stubEnv("OPENAI_API_KEY", fault === "fast-writer-fails" ? "synthetic-key-not-a-credential" : "");
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network blocked in the A2 fault matrix"); }));
};

/** What fails A2 for one reply, in plain words. Empty when the person got a real answer. */
function a2Problems(status: number, reply: ReturnType<typeof visibleReply>): string[] {
  const problems: string[] = [];
  if (reply.kind !== "answer") problems.push(`no answer (HTTP ${status}, ${reply.kind}): "${(reply.error || reply.answer).slice(0, 160)}"`);
  const count = answerWords(reply);
  if (reply.kind === "answer" && count < list.minimumWords) problems.push(`answer has ${count} words (needs ${list.minimumWords}): "${reply.answer.slice(0, 160)}"`);
  // Name the part of the reply that carries the stock text: the error, the answer, the notice or a limit.
  const parts: Array<[string, string]> = [["error", reply.error], ["answer", reply.answer], ["why", reply.why], ["notice", reply.notice], ...reply.limits.map((limit): [string, string] => ["limit", limit]), ["research", reply.research]];
  for (const [part, text] of parts) {
    const phrases = text ? stock(text) : [];
    if (!phrases.length) continue;
    // The error text is already quoted above.
    problems.push(part === "error" ? `stock text in the error [${phrases.join(", ")}]` : `stock text in the ${part} [${phrases.join(", ")}]: "${text.replace(/\s+/g, " ").slice(0, 200)}"`);
  }
  return problems;
}

beforeAll(async () => {
  // The first question builds the program library from cold; warm it once so each case measures its own work.
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  env("none");
  await ask(list.questions[0].question).catch(() => undefined);
}, 300_000);
beforeEach(() => { state.writerCalls = 0; });
afterAll(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const faults = list.faults.filter(fault => fault.applicable !== false);
describe.each(faults)("A2 fault: $id", fault => {
  it.each(list.questions)(`answers "$id" in words with no stock text`, async ({ question }) => {
    state.fault = fault.id;
    env(fault.id);
    const { status, reply } = await ask(question);
    const problems = a2Problems(status, reply);
    // One plain sentence per problem, so the report says exactly what the person would have read.
    if (problems.length) expect.fail(problems.join(" | "));
  }, 180_000);
});
