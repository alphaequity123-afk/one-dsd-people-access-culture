import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./governance", () => ({
  getResearchPolicy: async () => ({ provider_order: ["perplexity_agent"], allowed_domains: [], recency: "any" }),
  admitResearch: async () => ({ ok: true, policy: { provider_order: ["perplexity_agent"], allowed_domains: [], recency: "any" } }),
  hashQuery: async () => "hash",
  recordUsage: async () => undefined,
}));
vi.mock("../tools/runtime", () => ({ runTool: async (_ctx: unknown, _tool: string, fn: () => unknown) => fn() }));

import { getResearchProvider, UnresolvedCitationError } from "./providers";
import { governedResearch } from "./index";
import type { ToolContext } from "../types";

const SOURCE = "https://mn.gov/dhs/people-we-serve/";
const agentReply = (text: string, annotations: unknown[] = []) => ({
  id: "resp-1", model: "openai/gpt-5.6-luna", status: "completed",
  output: [
    { type: "search_results", queries: ["question"], results: [{ id: 1, url: SOURCE, title: "People we serve" }] },
    { type: "message", content: [{ type: "output_text", text, annotations }] },
  ],
  usage: { tool_calls_details: { web_search: { invocation: 1 } } },
});
const fetcherFor = (body: unknown) => (async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch;
const request = { question: "question", depth: "current_web" as const, allowed_domains: [], recency: "any" as const, trace_id: "trace-1" };
const refusal = async (text: string, annotations: unknown[] = []) => {
  const error = await getResearchProvider("perplexity_agent").run(request, fetcherFor(agentReply(text, annotations))).catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(UnresolvedCitationError);
  expect((error as Error).message).toBe("research_unresolved_citation");
  return error as UnresolvedCitationError;
};

beforeEach(() => vi.stubEnv("PERPLEXITY_API_KEY", "test-key"));
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("research citation joining", () => {
  it("joins a link to a returned source and keeps the answer", async () => {
    const output = await getResearchProvider("perplexity_agent").run(request, fetcherFor(agentReply(`Services are listed by the department [People we serve](${SOURCE}).`)));
    expect(output.answer).toContain("[1]");
    expect(output.sources.map(source => source.url)).toEqual([SOURCE]);
  });

  it("names a link to another page on a returned source's site", async () => {
    const error = await refusal("Services are listed [People we serve](https://mn.gov/dhs/people-we-serve/children/).");
    expect([error.reason, error.detail]).toEqual(["link_url", "same_host"]);
  });

  it("names a link to a site no search returned", async () => {
    const error = await refusal("Services are listed [Elsewhere](https://example.org/page).");
    expect([error.reason, error.detail]).toEqual(["link_url", "other_host"]);
  });

  it("names a numeric marker that is not a search result", async () => {
    expect((await refusal(`Services are listed [People](${SOURCE}) and more [7].`)).reason).toBe("marker_id");
  });

  it("names a combined marker", async () => {
    expect((await refusal(`Services are listed [People](${SOURCE}) [1, 2].`)).reason).toBe("combined_marker");
  });

  it("names an unfamiliar citation annotation form", async () => {
    const error = await refusal(`Services are listed [People](${SOURCE}).`, [{ type: "search_result_citation", url: SOURCE, end_index: 10 }]);
    expect([error.reason, error.detail]).toEqual(["annotation_type", "search_result_citation"]);
  });

  it("logs the finite reason with the unchanged public code, and no answer text", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const ctx = { trace_id: "trace-1", dry_run: false, role: "staff" } as unknown as ToolContext;
    const result = await governedResearch("question", "current_web", true, ctx, fetcherFor(agentReply("Services are listed [Elsewhere](https://example.org/private-detail).")));
    expect(result).toMatchObject({ status: "failed", error_code: "research_unresolved_citation" });
    const [, fields] = logged.mock.calls.find(([label]) => label === "research_failed")!;
    expect(fields).toMatchObject({ code: "research_unresolved_citation", reason: "link_url", detail: "other_host" });
    expect(JSON.stringify(fields)).not.toContain("example.org");
  });
});
