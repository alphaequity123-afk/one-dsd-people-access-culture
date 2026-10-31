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
