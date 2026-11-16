import { it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { DEFAULT_PRODUCT_CONTEXT } from "@/lib/product/federation";
vi.mock("server-only", () => ({}));
const f = vi.hoisted(() => ({ paused: vi.fn(), ask: vi.fn(), review: vi.fn(), limit: vi.fn() }));
const LIBRARY = "From the program library: the listed resources set out the practice, and the person or area responsible confirms any rule.";
vi.mock("../orchestrator", () => ({ paused: f.paused, ask: f.ask, contextFor: () => ({}) }));
vi.mock("../agents/ask", () => ({ toStaffAskResult: (result: unknown) => result, libraryAskResult: () => ({ kind: "answer", answer: { shortAnswer: LIBRARY, whyItMatters: "", limits: [], sources: [], degraded: false } }) }));
vi.mock("./jev", () => ({ reviewWithJev: f.review }));
vi.mock("@/lib/security/rate-limit", () => ({ consumeRequestLimit: f.limit, rateLimitHeaders: () => ({}) }));
import { POST } from "@/app/api/ask/route";
const request = (body: unknown, origin = "http://localhost:8911") => new NextRequest("http://localhost:8911/api/ask", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("PAC_CLONE_AGENTS", "on"); vi.stubEnv("PAC_PUBLIC_ORIGIN", "http://localhost:8911");
  f.paused.mockResolvedValue(false); f.limit.mockResolvedValue({ allowed: true }); f.review.mockResolvedValue("pass");
  f.ask.mockResolvedValue({ kind: "answer", answer: { shortAnswer: "Consider another perspective.", whyItMatters: "", limits: [], sources: [], degraded: false } });
});
it("keeps typed Ask closed without clone opt-in", async () => { vi.stubEnv("PAC_CLONE_AGENTS", "off"); expect((await POST(request({ question: "hello" }))).status).toBe(403); expect(f.ask).not.toHaveBeenCalled(); });
it("blocks cross-origin requests before any agent call", async () => { expect((await POST(request({ question: "hello" }, "https://other.example"))).status).toBe(403); expect(f.ask).not.toHaveBeenCalled(); });
it("honors stop before calling any provider, still answering from the library", async () => { f.paused.mockResolvedValue(true); const response = await POST(request({ question: "hello" })); expect(response.status).toBe(200); expect((await response.json()).answer.shortAnswer).toBe(LIBRARY); expect(f.ask).not.toHaveBeenCalled(); });
it("rejects browser-supplied work identifiers", async () => { expect((await POST(request({ question: "hello", cloneRunId: "spoofed" }))).status).toBe(400); expect(f.ask).not.toHaveBeenCalled(); });
it("past the request limit answers from the library without a model call", async () => { f.limit.mockResolvedValue({ allowed: false }); const response = await POST(request({ question: "hello" })); expect(response.status).toBe(200); expect((await response.json()).answer.shortAnswer).toBe(LIBRARY); expect(f.ask).not.toHaveBeenCalled(); });
it("does not send privacy-refused answers for external review", async () => { f.ask.mockResolvedValue({ kind: "refusal", safety: { message: "Remove private details." } }); expect((await POST(request({ question: "hello" }))).status).toBe(200); expect(f.review).not.toHaveBeenCalled(); });
it("rechecks stop before releasing a response and gives the library answer instead", async () => { f.paused.mockResolvedValueOnce(false).mockResolvedValueOnce(true); const body = await (await POST(request({ question: "hello" }))).json(); expect(body.error).toBeUndefined(); expect(body.answer.shortAnswer).toBe(LIBRARY); });
it("answers from the library when the answer fails, with no error and no request content", async () => { f.ask.mockRejectedValue(new Error("synthetic")); const body = await (await POST(request({ question: "hello" }))).json(); expect(body.error).toBeUndefined(); expect(body.answer.shortAnswer).toBe(LIBRARY); expect(JSON.stringify(body)).not.toContain("synthetic"); });
it("opens the connection before the answer is ready", async () => { let finish: (value: unknown) => void = () => {}; f.ask.mockReturnValue(new Promise(resolve => { finish = resolve; })); const response = await POST(request({ question: "hello" })); const reader = response.body!.getReader(); expect(new TextDecoder().decode((await reader.read()).value)).toBe(" "); finish({ kind: "answer", answer: { shortAnswer: "Done.", whyItMatters: "", limits: [], sources: [], degraded: false } }); let text = ""; for (;;) { const chunk = await reader.read(); if (chunk.done) break; text += new TextDecoder().decode(chunk.value); } expect(JSON.parse(text).answer.shortAnswer).toBe("Done."); });
it("releases a reviewed answer with server-controlled context and no-store", async () => { const response = await POST(request({ question: "hello", contextPreference: DEFAULT_PRODUCT_CONTEXT === "one_dsd" ? "one_dhs" : "one_dsd" })); expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toContain("no-store"); await response.text(); expect(f.ask.mock.calls[0][0]).toMatchObject({ contextPreference: DEFAULT_PRODUCT_CONTEXT }); expect(f.ask.mock.calls[0][0].cloneRunId).toMatch(/^[0-9a-f-]{36}$/); });
it.each([undefined, "text", "spoken"])("accepts response preference %s", async responseMode => {
  const response = await POST(request({ question: "How can I make a meeting accessible?", responseMode }));
  expect(response.status).toBe(200);
  expect(f.ask.mock.calls[0][0].responseMode).toBe(responseMode);
});
it.each(["short", true, null, { mode: "spoken" }])("rejects invalid response preference %s before admission", async responseMode => {
  expect((await POST(request({ question: "hello", responseMode }))).status).toBe(400);
  expect(f.ask).not.toHaveBeenCalled();
});

// A page that asks for progress gets it one line at a time, ending with the finished answer.
const progressRequest = (body: unknown) => new NextRequest("http://localhost:8911/api/ask", { method: "POST", headers: { origin: "http://localhost:8911", "content-type": "application/json", accept: "application/x-ndjson, application/json" }, body: JSON.stringify(body) });
const progressLines = async (response: Response) => (await response.text()).split("\n").filter(Boolean).map(line => JSON.parse(line) as { type: string; stage?: string; text?: string; result?: { answer?: { shortAnswer: string }; error?: string } });
it("sends progress line by line to a page that asks for it, then the finished answer", async () => {
  f.ask.mockImplementation(async (input: { onProgress?: (event: unknown) => void }) => {
    input.onProgress?.({ type: "stage", stage: "reading" });
    input.onProgress?.({ type: "stage", stage: "writing" });
    input.onProgress?.({ type: "text", text: "Consider" });
    input.onProgress?.({ type: "text", text: "Consider another perspective." });
    return { kind: "answer", answer: { shortAnswer: "Consider another perspective.", whyItMatters: "", limits: [], sources: [], degraded: false } };
  });
  const response = await POST(progressRequest({ question: "hello" }));
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/x-ndjson");
  expect(response.headers.get("cache-control")).toContain("no-store");
  const lines = await progressLines(response);
  expect(lines.map(line => line.type)).toEqual(["wait", "stage", "stage", "text", "text", "done"]);
  expect(lines.at(-1)!.result!.answer!.shortAnswer).toBe("Consider another perspective.");
});
it("never passes a progress hook to a request that did not ask for one", async () => {
  await (await POST(request({ question: "hello" }))).json();
  expect(f.ask.mock.calls[0][0].onProgress).toBeUndefined();
});
it("does not accept a progress hook from the browser", async () => {
  expect((await POST(progressRequest({ question: "hello", onProgress: "x" }))).status).toBe(400);
  expect(f.ask).not.toHaveBeenCalled();
});
it("ends with the library answer when the answer fails during progress", async () => {
  f.ask.mockRejectedValue(new Error("synthetic"));
  const lines = await progressLines(await POST(progressRequest({ question: "hello" })));
  expect(lines.at(-1)!.type).toBe("done");
  expect(lines.at(-1)!.result!.error).toBeUndefined();
  expect(lines.at(-1)!.result!.answer!.shortAnswer).toBe(LIBRARY);
});
it("finishes quietly when the page has gone away", async () => {
  let finish: (value: unknown) => void = () => {};
  let settled = false;
  f.ask.mockImplementation((input: { onProgress?: (event: unknown) => void }) => new Promise(resolve => { finish = value => { input.onProgress?.({ type: "text", text: "late" }); resolve(value); settled = true; }; }));
  const response = await POST(progressRequest({ question: "hello" }));
  await response.body!.cancel();
  finish({ kind: "answer", answer: { shortAnswer: "Consider another perspective.", whyItMatters: "", limits: [], sources: [], degraded: false } });
  await vi.waitFor(() => expect(settled).toBe(true));
});
it("keeps the stop control in force for a page that follows progress", async () => {
  f.paused.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const lines = await progressLines(await POST(progressRequest({ question: "hello" })));
  expect(lines.at(-1)!.result!.error).toBeUndefined();
  expect(lines.at(-1)!.result!.answer!.shortAnswer).toBe(LIBRARY);
});

it.each(["program_only", "current_web", "deep_research"])("honors the research choice %s", async researchMode => {
  await (await POST(request({ question: "Explain seasons.", researchMode }))).json();
  expect(f.ask.mock.calls[0][0].researchMode).toBe(researchMode);
});

it.each(["provider_request_failed", "generated_evidence_rejected", "answer_review_failed"])("never releases a failed answer; gives the library answer instead: %s", async failureCode => {
  f.ask.mockResolvedValue({ kind: "answer", answer: { shortAnswer: "Unrelated fallback.", degraded: true, failureCode } });
  const body = await (await POST(request({ question: "Explain the requested policy." }))).json();
  expect(body.error).toBeUndefined();
  expect(body.answer.shortAnswer).toBe(LIBRARY);
  expect(JSON.stringify(body)).not.toContain("Unrelated fallback");
});

it("clears partial streamed text when the final answer failed verification", async () => {
  f.ask.mockResolvedValue({ kind: "answer", answer: { shortAnswer: "Unverified.", degraded: true, failureCode: "generated_evidence_rejected" } });
  const lines = await progressLines(await POST(progressRequest({ question: "Explain the policy." })));
  expect(lines.map(line => line.type)).toEqual(["wait", "reset", "done"]);
  expect(lines.at(-1)?.result?.error).toBeUndefined();
  expect(lines.at(-1)?.result?.answer?.shortAnswer).toBe(LIBRARY);
});
