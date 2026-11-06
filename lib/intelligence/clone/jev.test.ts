import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../tools/runtime", () => ({ runTool: async (_ctx: unknown, _tool: string, fn: () => unknown) => fn() }));
vi.mock("./ledger", () => ({ recordDecision: () => undefined }));

import { reviewWithJev } from "./jev";
import type { ToolContext } from "../types";

const ctx = { trace_id: "trace-1" } as unknown as ToolContext;
const QUESTION = "How do I plan an accessible meeting?";
const ANSWER = "Share the agenda ahead of time and ask about access needs.";
const decision = (choice: string, confidence: number) => ({ answers: { review: { type: "choice", choice, confidence } } });
const reasonLogged = (warn: { mock: { calls: unknown[][] } }) => {
  const call = warn.mock.calls.find(([label]) => label === "jev_review_unused");
  return call ? (call[1] as { reason: string }) : undefined;
};

beforeEach(() => { vi.stubEnv("PAC_CLONE_AGENTS", "on"); vi.stubEnv("TYPESAFE_API_KEY", "test-key"); });
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
