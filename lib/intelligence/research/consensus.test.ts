import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ToolContext } from "../types";

const controls = vi.hoisted(() => ({
  policy: { provider_order: ["perplexity_agent", "openai_web"], allowed_domains: [] as string[], recency: "any" },
  admit: vi.fn(),
  audit: vi.fn(),
  usage: vi.fn(),
}));
vi.mock("./governance", () => ({
  getResearchPolicy: async () => controls.policy,
  admitResearch: (...args: unknown[]) => controls.admit(...args),
  hashQuery: async () => "abcdef0123456789",
  recordUsage: (...args: unknown[]) => controls.usage(...args),
}));
vi.mock("../tools/runtime", () => ({
  runTool: (_ctx: unknown, toolName: string, run: () => unknown) => {
    controls.audit(toolName);
    return run();
  },
}));

import { asksForScholarlyResearch, consensusQuery, consensusResearchProvider } from "./consensus";
import { governedResearch, governedSearch } from "./index";
import { getResearchProvider, type ResearchRequest } from "./providers";

const question = "Use Consensus to find peer-reviewed studies on supported decision-making.";
const ctx = { trace_id: "12345678-1234-4abc-8abc-123456789abc", role: "staff" } as ToolContext;
const request: ResearchRequest = { question, depth: "current_web", allowed_domains: [], recency: "any", trace_id: ctx.trace_id };
const paper = {
  paper_id: "c".repeat(32),
  title: "Supported decision making in community services",
  journal_name: "Journal of Disability Research",
  publish_year: 2025,
  authors: ["Test Researcher", "Another Researcher"],
  doi: "10.1234/supported-decisions",
  url: "https://consensus.app/papers/supported-decisions/cccccccccccccccccccccccccccccccc/",
  abstract: "A pilot study reported that people wanted more time to consider their options.",
  full_text_chunks: ["Do not use this content."],
  takeaway: "This provider-generated takeaway was not independently verified.",
};

let testClock = Date.parse("2026-11-13T13:00:00Z");

beforeEach(() => {
  testClock += 10_000;
  vi.useFakeTimers({ now: testClock });
  vi.stubEnv("CONSENSUS_API_KEY", "fixture-consensus-key");
  vi.stubEnv("PERPLEXITY_API_KEY", "fixture-web-key");
  controls.policy.allowed_domains = [];
  controls.admit.mockReset().mockImplementation(async () => ({ ok: true, policy: controls.policy }));
  controls.audit.mockReset();
  controls.usage.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function result(papers: unknown[]) {
  return Response.json({ results: papers, page: 0, is_end: true, page_size: 6 });
}

function startNextSecond() {
  vi.advanceTimersByTime(1_001);
}

describe("bounded Consensus paper search", () => {
  it.each([
    question,
    "Consensus: autism and self-determination",
    "What do studies say about supported decision-making?",
    "Compare scientific evidence on plain language and comprehension.",
  ])("recognizes scholarly searches: %s", text => {
    expect(asksForScholarlyResearch(text)).toBe(true);
  });

  it.each([
    "Find the current Minnesota Department of Human Services waiver guidance.",
    "Review the administrative papers filed by the Minnesota agency.",
    "How can we use consensus to make a group decision?",
    "Don't use Consensus. Explain what research evidence means.",
    "Use only sources from this application to find peer-reviewed studies.",
  ])("keeps other queries out of Consensus: %s", text => {
    expect(asksForScholarlyResearch(text)).toBe(false);
  });

  it("uses a single bounded request and cites only returned safe academic records", async () => {
    const fetcher = vi.fn().mockResolvedValue(result([
      paper,
      { ...paper, title: "Duplicate" },
      { ...paper, title: "Preprint", doi: "10.1234/preprint", is_preprint: true },
      { ...paper, title: "Unsafe", doi: "10.1234/../../escape", url: "https://127.0.0.1/anything" },
      { ...paper, title: "Invented destination", doi: null, url: "https://arbitrary.invalid/paper" },
      { ...paper, title: "Record without DOI", doi: null, abstract: null, url: "https://consensus.app/papers/record/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/" },
    ]));
    const output = await consensusResearchProvider.run(request, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [endpoint, init] = fetcher.mock.calls[0] as [URL, RequestInit];
    expect(endpoint.origin + endpoint.pathname).toBe("https://api.consensus.app/v1/search");
    expect(Object.fromEntries(endpoint.searchParams)).toEqual({
      query: "find peer-reviewed studies on supported decision-making.",
      page_size: "6",
      exclude_preprints: "true",
      include_full_text_chunks: "false",
    });
    expect(init).toMatchObject({ method: "GET", redirect: "error", cache: "no-store", headers: { "x-api-key": "fixture-consensus-key" } });
    expect(endpoint.href).not.toContain("fixture-consensus-key");
    expect(output.sources.map(source => source.url)).toEqual([
      "https://doi.org/10.1234/supported-decisions",
      "https://consensus.app/papers/record/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/",
    ]);
    expect(output.sources[0].snippet).toContain("Abstract excerpt:");
    expect(output.sources[1].snippet).toContain("No abstract was available.");
    expect(output.answer).toContain("[1]");
    expect(output.answer).toContain("[2]");
    expect(JSON.stringify(output)).not.toContain("Do not use this content");
    expect(JSON.stringify(output)).not.toContain("provider-generated takeaway");
  });

  it("checks privacy before truncation and strips pasted URLs from the bounded query", () => {
    expect(() => consensusQuery(question + " ".repeat(500) + " Contact me at person@example.com.")).toThrow("research_consensus_private_query");
    expect(consensusQuery(question + " https://agency.example/private/detail")).not.toContain("https:");
    expect(consensusQuery(question + " long".repeat(200)).length).toBeLessThanOrEqual(400);
  });

  it("retains the domain restriction instead of treating scholarly evidence as an exception", async () => {
    await expect(consensusResearchProvider.run({ ...request, allowed_domains: ["mn.gov"] }, vi.fn().mockResolvedValue(result([paper]))))
      .rejects.toThrow("research_consensus_no_papers");
  });

  it("uses the existing governed admission, audit and usage receipt for papers", async () => {
    const fetcher = vi.fn().mockResolvedValue(result([paper]));
    const found = await governedResearch(question, "current_web", false, ctx, fetcher, [{ title: "Internal source", url: "https://mn.gov/restricted" }]);
    expect(found).toMatchObject({ status: "used", provider: "consensus", note: expect.stringMatching(/abstracts/i) });
    expect(fetcher.mock.calls[0][0].href).not.toContain("restricted");
    expect(controls.admit).toHaveBeenCalledWith(question, "current_web", true, true, "staff");
    expect(controls.audit).toHaveBeenCalledWith("research.current_answer");
    expect(controls.usage).toHaveBeenCalledWith(expect.objectContaining({ provider: "consensus", search_queries: 1, estimated_usd: 0, ok: true }));
    expect(JSON.stringify(controls.usage.mock.calls)).not.toContain(question);
  });

  it("keeps source restrictions, privacy, no-key and owner stop ahead of outbound calls", async () => {
    const fetcher = vi.fn();
    const restricted = "Use only sources from this application to find peer-reviewed studies.";
    expect(await governedSearch(restricted, true, ctx, fetcher)).toMatchObject({ status: "not_admitted", reason: "source_only" });
    expect(await governedResearch(question + " My client case number is 123456.", "current_web", true, ctx, fetcher)).toMatchObject({ status: "not_admitted", reason: "safety_refused" });
    controls.admit.mockResolvedValueOnce({ ok: false, reason: "owner_stop", message: "Paused." });
    expect(await governedResearch(question, "current_web", true, ctx, fetcher)).toMatchObject({ status: "not_admitted", reason: "owner_stop" });
    vi.stubEnv("CONSENSUS_API_KEY", "");
    controls.admit.mockResolvedValueOnce({ ok: false, reason: "no_provider_configured", message: "Unavailable." });
    expect(await governedResearch(question, "current_web", true, ctx, fetcher)).toMatchObject({ status: "not_admitted", reason: "no_provider_configured" });
    expect(controls.admit).toHaveBeenLastCalledWith(question, "current_web", true, false, "staff");
    expect(fetcher).not.toHaveBeenCalled();
    expect(controls.usage).not.toHaveBeenCalled();
  });

  it("reports quota without retrying or falling over to a billed web search", async () => {
    const other = vi.spyOn(getResearchProvider("perplexity_agent"), "run");
    const fetcher = vi.fn().mockResolvedValue(new Response("quota exhausted", { status: 429 }));
    expect(await governedResearch(question, "current_web", true, ctx, fetcher)).toMatchObject({
      status: "failed",
      error_code: "research_consensus_quota",
      message: expect.stringMatching(/allowance has been used/i),
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(other).not.toHaveBeenCalled();
    expect(controls.usage).toHaveBeenCalledWith(expect.objectContaining({ provider: "consensus", ok: false }));
  });

  it("does not exceed the local request pacing and keeps ordinary agency research on its original provider", async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(result([paper])));
    await consensusResearchProvider.run(request, fetcher);
    await expect(consensusResearchProvider.run(request, fetcher)).rejects.toThrow("research_consensus_rate_limited");
    expect(fetcher).toHaveBeenCalledTimes(1);
    startNextSecond();
    const ordinary = vi.spyOn(getResearchProvider("perplexity_agent"), "run").mockResolvedValue({
      provider: "perplexity_agent", model: "fixture-web", depth: "current_web",
      answer: "Agency guidance [1]", sources: [{ title: "Agency guidance", url: "https://mn.gov/dhs", domain: "mn.gov" }],
      searchedAt: "2026-11-13T13:00:00Z", usage: {}, estimated_usd: 0,
    });
    expect(await governedResearch("Find current Minnesota DHS waiver guidance.", "current_web", true, ctx, fetcher))
      .toMatchObject({ status: "used", provider: "perplexity_agent" });
    expect(ordinary).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
