import { it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { DEFAULT_PRODUCT_CONTEXT } from "@/lib/product/federation";
vi.mock("server-only", () => ({}));
const f = vi.hoisted(() => ({ paused: vi.fn(), ask: vi.fn(), review: vi.fn(), finish: vi.fn(), close: vi.fn(), admit: vi.fn() }));
vi.mock("../orchestrator", () => ({ paused: f.paused, ask: f.ask, contextFor: () => ({}) }));
vi.mock("../agents/ask", () => ({ toStaffAskResult: (result: unknown) => result }));
vi.mock("./jev", () => ({ reviewWithJev: f.review }));
vi.mock("./ledger", () => ({ openLedger: () => ({ close: f.close }), admitRun: f.admit, finishRun: f.finish }));
vi.mock("@/lib/security/rate-limit", () => ({ consumeRequestLimit: async () => ({ allowed: true }), rateLimitHeaders: () => ({}) }));
import { POST } from "@/app/api/ask/route";
const request = (body: unknown, origin = "http://localhost:8911") => new NextRequest("http://localhost:8911/api/ask", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("PAC_CLONE_AGENTS", "on"); vi.stubEnv("PAC_PUBLIC_ORIGIN", "http://localhost:8911");
  f.paused.mockResolvedValue(false); f.admit.mockReturnValue("server-run"); f.review.mockResolvedValue("pass");
  f.ask.mockResolvedValue({ kind: "answer", answer: { shortAnswer: "Consider another perspective.", whyItMatters: "", limits: [], sources: [], degraded: false } });
});
it("keeps typed Ask closed without clone opt-in", async () => { vi.stubEnv("PAC_CLONE_AGENTS", "off"); expect((await POST(request({ question: "hello" }))).status).toBe(403); expect(f.ask).not.toHaveBeenCalled(); });
it("blocks cross-origin requests before any agent call", async () => { expect((await POST(request({ question: "hello" }, "https://other.example"))).status).toBe(403); expect(f.ask).not.toHaveBeenCalled(); });
it("honors stop before calling any provider", async () => { f.paused.mockResolvedValue(true); expect((await POST(request({ question: "hello" }))).status).toBe(503); expect(f.ask).not.toHaveBeenCalled(); });
it("rejects browser-supplied work identifiers", async () => { expect((await POST(request({ question: "hello", cloneRunId: "spoofed" }))).status).toBe(400); expect(f.ask).not.toHaveBeenCalled(); });
it("does not spend when the durable allowance is exhausted", async () => { f.admit.mockReturnValue(null); expect((await POST(request({ question: "hello" }))).status).toBe(429); expect(f.ask).not.toHaveBeenCalled(); });
it("does not send privacy-refused answers for external review", async () => { f.ask.mockResolvedValue({ kind: "refusal", safety: { message: "Remove private details." } }); expect((await POST(request({ question: "hello" }))).status).toBe(200); expect(f.review).not.toHaveBeenCalled(); });
it("rechecks stop before releasing a response", async () => { f.paused.mockResolvedValueOnce(false).mockResolvedValueOnce(true); const body = await (await POST(request({ question: "hello" }))).json(); expect(body.error).toContain("paused"); expect(body.answer).toBeUndefined(); });
it("reports a failure at answer time in the body and closes its records", async () => { f.ask.mockRejectedValue(new Error("synthetic")); const body = await (await POST(request({ question: "hello" }))).json(); expect(body.error).toBeTruthy(); expect(f.finish).toHaveBeenCalledWith(expect.anything(), "server-run", "failed"); expect(f.close).toHaveBeenCalled(); });
it("opens the connection before the answer is ready", async () => { let finish: (value: unknown) => void = () => {}; f.ask.mockReturnValue(new Promise(resolve => { finish = resolve; })); const response = await POST(request({ question: "hello" })); const reader = response.body!.getReader(); expect(new TextDecoder().decode((await reader.read()).value)).toBe(" "); finish({ kind: "answer", answer: { shortAnswer: "Done.", whyItMatters: "", limits: [], sources: [], degraded: false } }); let text = ""; for (;;) { const chunk = await reader.read(); if (chunk.done) break; text += new TextDecoder().decode(chunk.value); } expect(JSON.parse(text).answer.shortAnswer).toBe("Done."); });
it("releases a reviewed answer with server-controlled context and no-store", async () => { const response = await POST(request({ question: "hello", contextPreference: DEFAULT_PRODUCT_CONTEXT === "one_dsd" ? "one_dhs" : "one_dsd" })); expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toContain("no-store"); await response.text(); expect(f.ask.mock.calls[0][0]).toMatchObject({ contextPreference: DEFAULT_PRODUCT_CONTEXT, cloneRunId: "server-run" }); expect(f.close).toHaveBeenCalled(); });
it.each([undefined, "text", "spoken"])("accepts response preference %s", async responseMode => {
  const response = await POST(request({ question: "How can I make a meeting accessible?", responseMode }));
  expect(response.status).toBe(200);
  expect(f.ask.mock.calls[0][0].responseMode).toBe(responseMode);
});
it.each(["short", true, null, { mode: "spoken" }])("rejects invalid response preference %s before admission", async responseMode => {
  expect((await POST(request({ question: "hello", responseMode }))).status).toBe(400);
  expect(f.admit).not.toHaveBeenCalled();
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
  expect(f.finish).toHaveBeenCalledWith(expect.anything(), "server-run", "completed");
  expect(f.close).toHaveBeenCalledOnce();
});
it("never passes a progress hook to a request that did not ask for one", async () => {
  await (await POST(request({ question: "hello" }))).json();
  expect(f.ask.mock.calls[0][0].onProgress).toBeUndefined();
});
it("does not accept a progress hook from the browser", async () => {
  expect((await POST(progressRequest({ question: "hello", onProgress: "x" }))).status).toBe(400);
  expect(f.ask).not.toHaveBeenCalled();
});
it("reports a failure as the last line and closes its records", async () => {
  f.ask.mockRejectedValue(new Error("synthetic"));
  const lines = await progressLines(await POST(progressRequest({ question: "hello" })));
  expect(lines.at(-1)!.type).toBe("done");
  expect(lines.at(-1)!.result!.error).toBeTruthy();
  expect(f.finish).toHaveBeenCalledWith(expect.anything(), "server-run", "failed");
  expect(f.close).toHaveBeenCalledOnce();
});
it("finishes and records the answer even when the page has gone away", async () => {
  let finish: (value: unknown) => void = () => {};
  f.ask.mockImplementation((input: { onProgress?: (event: unknown) => void }) => new Promise(resolve => { finish = value => { input.onProgress?.({ type: "text", text: "late" }); resolve(value); }; }));
  const response = await POST(progressRequest({ question: "hello" }));
  await response.body!.cancel();
  finish({ kind: "answer", answer: { shortAnswer: "Consider another perspective.", whyItMatters: "", limits: [], sources: [], degraded: false } });
  await vi.waitFor(() => expect(f.close).toHaveBeenCalledOnce());
  expect(f.finish).toHaveBeenCalledWith(expect.anything(), "server-run", "completed");
});
it("keeps the stop control in force for a page that follows progress", async () => {
  f.paused.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const lines = await progressLines(await POST(progressRequest({ question: "hello" })));
  expect(lines.at(-1)!.result!.error).toContain("paused");
  expect(lines.at(-1)!.result!.answer).toBeUndefined();
});

it.each(["program_only", "current_web", "deep_research"])("honors the research choice %s", async researchMode => {
  await (await POST(request({ question: "Explain seasons.", researchMode }))).json();
  expect(f.ask.mock.calls[0][0].researchMode).toBe(researchMode);
});

it.each(["provider_request_failed", "generated_evidence_rejected", "answer_review_failed"])("never releases a failed answer as successful: %s", async failureCode => {
  f.ask.mockResolvedValue({ kind: "answer", answer: { shortAnswer: "Unrelated fallback.", degraded: true, failureCode } });
  const body = await (await POST(request({ question: "Explain the requested policy." }))).json();
  expect(body.error).toBeTruthy();
  expect(body.answer).toBeUndefined();
  expect(JSON.stringify(body)).not.toContain("Unrelated fallback");
  expect(f.finish).toHaveBeenCalledWith(expect.anything(), "server-run", "failed");
});

it("clears partial streamed text when the final answer failed verification", async () => {
  f.ask.mockResolvedValue({ kind: "answer", answer: { shortAnswer: "Unverified.", degraded: true, failureCode: "generated_evidence_rejected" } });
  const lines = await progressLines(await POST(progressRequest({ question: "Explain the policy." })));
  expect(lines.map(line => line.type)).toEqual(["wait", "reset", "done"]);
  expect(lines.at(-1)?.result?.error).toContain("verify");
  expect(lines.at(-1)?.result?.answer).toBeUndefined();
});

// The page Ask was opened from is a hint for finding sources: passed on when clean, left out when not.
it("passes a clean page hint on to Ask", async () => {
  await (await POST(request({ question: "What is this page about?", page: { path: "/minnesota-communities/somali/", title: " Somali  Minnesotans " } }))).json();
  expect(f.ask.mock.calls[0][0].page).toEqual({ path: "/minnesota-communities/somali", title: "Somali Minnesotans" });
});
it.each([
  { path: "https://example.org/page", title: "Elsewhere" },
  { path: "/library", title: 7 },
  { path: "/library", title: "Library", body: "text typed on the page" },
  "/library",
  42,
])("still answers, without the page, when the hint is malformed: %j", async page => {
  const response = await POST(request({ question: "What is this page about?", page }));
  expect(response.status).toBe(200);
  await response.json();
  expect(f.ask).toHaveBeenCalledOnce();
  expect(f.ask.mock.calls[0][0].page).toBeUndefined();
});
it("still sends no page when none was given", async () => {
  await (await POST(request({ question: "hello" }))).json();
  expect(f.ask.mock.calls[0][0].page).toBeUndefined();
});
// The run ledger is in the database now. A failed ledger write must never leave the connection open.
it("still sends the answer and ends the response when the ledger cannot record the finish", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  f.finish.mockRejectedValue(new Error("connection reset"));
  const body = await (await POST(request({ question: "hello" }))).json();
  expect(body.answer.shortAnswer).toBe("Consider another perspective.");
  expect(error).toHaveBeenCalledWith("ask_ledger_failed", "Error");
  expect(f.close).toHaveBeenCalledOnce();
  error.mockRestore();
});
it("ends a progress response with an error line when the answer fails and the ledger is down", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  f.ask.mockRejectedValue(new Error("synthetic"));
  f.finish.mockRejectedValue(new Error("connection reset"));
  const lines = await progressLines(await POST(progressRequest({ question: "hello" })));
  expect(lines.at(-1)!.type).toBe("done");
  expect(lines.at(-1)!.result!.error).toBeTruthy();
  expect(f.close).toHaveBeenCalledOnce();
  error.mockRestore();
});
