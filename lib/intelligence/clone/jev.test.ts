import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../tools/runtime", () => ({ runTool: async (_ctx: unknown, _tool: string, fn: () => unknown) => fn() }));

import { planWithJev, reviewWithJev } from "./jev";
import type { ToolContext } from "../types";

const ctx = { trace_id: "trace-1" } as unknown as ToolContext;
const QUESTION = "How do I plan an accessible meeting?";
const ANSWER = "Share the agenda ahead of time and ask about access needs.";
const decision = (choice: string, confidence: number) => ({ answers: { review: { type: "choice", choice, confidence } } });
const reasonLogged = (warn: { mock: { calls: unknown[][] } }) => {
  const call = warn.mock.calls.find(([label]) => label === "jev_review_unused");
  return call ? (call[1] as { reason: string }) : undefined;
};

beforeEach(() => { vi.stubEnv("PAC_CLONE_AGENTS", "on"); vi.stubEnv("PAC_DECISION_PROVIDER", ""); vi.stubEnv("GEMINI_API_KEY", ""); vi.stubEnv("TYPESAFE_API_KEY", "test-key"); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("answer review outcome", () => {
  it("returns a confident decision without logging", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify(decision("pass", 0.95))));
    await expect(reviewWithJev(QUESTION, ANSWER, ctx)).resolves.toBe("pass");
    expect(reasonLogged(warn)).toBeUndefined();
  });

  it.each([
    ["an unsure decision", async () => new Response(JSON.stringify(decision("pass", 0.4))), "jev_low_confidence"],
    ["an error status", async () => new Response("busy", { status: 503 }), "jev_http_503"],
    ["an unexpected reply", async () => new Response(JSON.stringify({ answers: {} })), "jev_response_invalid"],
    ["a reply that is not JSON", async () => new Response("<html>"), "jev_response_invalid"],
    ["a timeout", async () => { throw Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" }); }, "jev_timeout"],
  ])("still sends the answer after %s and records only the reason", async (_case, reply, reason) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", reply);
    await expect(reviewWithJev(QUESTION, ANSWER, ctx)).resolves.toBe("unavailable");
    expect(reasonLogged(warn)).toEqual({ traceId: "trace-1", reason });
    expect(JSON.stringify(warn.mock.calls)).not.toContain("accessible");
  });

  it("records a missing credential as unavailable", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await expect(reviewWithJev(QUESTION, ANSWER, ctx)).resolves.toBe("unavailable");
    expect(reasonLogged(warn)?.reason).toBe("jev_unavailable");
  });
});

describe("Google decision provider", () => {
  beforeEach(() => { vi.stubEnv("PAC_DECISION_PROVIDER", "gemini"); vi.stubEnv("GEMINI_API_KEY", "google-test-key"); });

  it("uses the Decisions API for routing and review, with credentials only in headers", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ answers: {
      route: { type: "choice", choice: "accessibility", confidence: 0.98 },
      evidence: { type: "choice", choice: "sufficient", confidence: 0.9 },
    } }))).mockResolvedValueOnce(new Response(JSON.stringify(decision("pass", 0.95))));
    vi.stubGlobal("fetch", fetcher);
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);
    await expect(planWithJev(QUESTION, [], ctx)).resolves.toEqual({ route: "accessibility", evidence: "sufficient" });
    await expect(reviewWithJev(QUESTION, ANSWER, ctx)).resolves.toBe("pass");
    expect(fetcher).toHaveBeenCalledTimes(2);
    for (const [url, options] of fetcher.mock.calls) {
      expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/decisions");
      expect(options.headers).toEqual({ "x-goog-api-key": "google-test-key", "content-type": "application/json" });
      expect(options.redirect).toBe("error");
      expect(options.signal).toBeInstanceOf(AbortSignal);
      const body = JSON.parse(options.body);
      expect(body.model).toBe("gemini-decision-1");
      expect(JSON.parse(body.input).question).toBe(QUESTION);
      expect(body).not.toHaveProperty("state");
      expect(options.body).not.toContain("google-test-key");
    }
    expect(log).toHaveBeenCalledWith("decision_used", expect.objectContaining({ provider: "gemini", stage: "review" }));
    expect(JSON.stringify(log.mock.calls)).not.toContain(QUESTION);
  });

  it("does not send a legacy credential when the Google key is absent", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await expect(reviewWithJev(QUESTION, ANSWER, ctx)).resolves.toBe("unavailable");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("keeps answers available without retries when Google rejects a request", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("quota", { status: 429 }));
    vi.stubGlobal("fetch", fetcher); vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await expect(reviewWithJev(QUESTION, ANSWER, ctx)).resolves.toBe("unavailable");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("blocks private identifiers before sending them to Google", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await expect(reviewWithJev(QUESTION, "SSN 123-45-6789", ctx)).resolves.toBe("human");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
