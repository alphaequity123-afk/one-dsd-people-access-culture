// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ANALYSIS_NOTICE } from "@/lib/analysis/contract";

vi.mock("server-only", () => ({}));
const f = vi.hoisted(() => ({ paused: vi.fn(), analyze: vi.fn(), tooLarge: vi.fn(), finish: vi.fn(), close: vi.fn(), admit: vi.fn(), limit: vi.fn() }));
vi.mock("@/lib/intelligence/orchestrator", () => ({ paused: f.paused }));
vi.mock("@/lib/intelligence/clone/ledger", () => ({ openLedger: () => ({ close: f.close }), admitRun: f.admit, finishRun: f.finish }));
vi.mock("@/lib/security/rate-limit", () => ({ consumeRequestLimit: f.limit, rateLimitHeaders: () => ({ "retry-after": "60" }) }));
vi.mock("@/lib/analysis/service", () => ({
  analyze: f.analyze,
  promptTooLarge: f.tooLarge,
  isRefusal: (outcome: { refusal?: boolean }) => outcome.refusal === true,
}));

import { POST } from "./route";

const ORIGIN = "http://localhost:8911";
const valid = { instrumentId: "equity-analysis", sources: [{ id: "doc-1", title: "Program description", text: "The Disability Services Division serves adults." }], context: "Who is reached?" };
const request = (body: unknown, origin = ORIGIN) => new NextRequest(`${ORIGIN}/api/analyze`, { method: "POST", headers: { origin, "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
const result = { instrumentId: "equity-analysis", summary: "Summary.", answers: [], limitations: [], nextSteps: [], counts: { evidence: 0, inference: 0, gap: 0 }, unavailable: false, notice: ANALYSIS_NOTICE };
const readBody = async (response: Response) => JSON.parse(await response.text());

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("PAC_CLONE_AGENTS", "on");
  vi.stubEnv("PAC_PUBLIC_ORIGIN", ORIGIN);
  f.paused.mockResolvedValue(false);
  f.admit.mockReturnValue("server-run");
  f.limit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: new Date(Date.now() + 60_000).toISOString() });
  f.analyze.mockResolvedValue(result);
  f.tooLarge.mockReturnValue(undefined);
});

describe("POST /api/analyze", () => {
  it("returns 403 for a cross-origin request before any work", async () => {
    expect((await POST(request(valid, "https://other.example"))).status).toBe(403);
    expect(f.analyze).not.toHaveBeenCalled();
    expect(f.admit).not.toHaveBeenCalled();
  });
  it("returns 503 while paused", async () => {
    f.paused.mockResolvedValue(true);
    expect((await POST(request(valid))).status).toBe(503);
    expect(f.analyze).not.toHaveBeenCalled();
  });
  it("fails closed without the deployment opt-in", async () => {
    vi.stubEnv("PAC_CLONE_AGENTS", "off");
    expect((await POST(request(valid))).status).toBe(403);
    expect(f.analyze).not.toHaveBeenCalled();
  });
  it("returns 400 with a plain message on a bad body", async () => {
    const noSources = await POST(request({ instrumentId: "equity-analysis", sources: [] }));
    expect(noSources.status).toBe(400);
    expect((await readBody(noSources)).error).toBe("Add at least one source to analyze.");
    const badInstrument = await POST(request({ ...valid, instrumentId: "something-else" }));
    expect(badInstrument.status).toBe(400);
    expect((await readBody(badInstrument)).error).toBe("Choose one of the analysis types on the page.");
    const duplicateIds = await POST(request({ ...valid, sources: [valid.sources[0], valid.sources[0]] }));
    expect(duplicateIds.status).toBe(400);
    expect((await readBody(duplicateIds)).error).toBe("Each source needs its own id.");
    expect((await POST(request("not json"))).status).toBe(400);
    expect(f.analyze).not.toHaveBeenCalled();
    expect(f.admit).not.toHaveBeenCalled();
  });
  it("answers sources too large for one analysis before the request limit and the ledger are charged", async () => {
    f.tooLarge.mockReturnValue("The sources together hold too much text for one analysis. Remove a source or paste shorter excerpts, then try again.");
    const response = await POST(request(valid));
    expect(response.status).toBe(413);
    expect((await readBody(response)).error).toContain("too much text");
    expect(f.limit).not.toHaveBeenCalled();
    expect(f.admit).not.toHaveBeenCalled();
    expect(f.analyze).not.toHaveBeenCalled();
  });
  it("returns 429 when the request limit is spent", async () => {
    f.limit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: new Date(Date.now() + 60_000).toISOString() });
    expect((await POST(request(valid))).status).toBe(429);
    expect(f.limit.mock.calls[0][1]).toEqual({ scope: "staff-equity-analysis", limit: 10, windowSeconds: 600 });
    expect(f.analyze).not.toHaveBeenCalled();
  });
  it("streams the result with no-store and finishes the run as completed", async () => {
    const response = await POST(request(valid));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const text = await response.text();
    expect(text.startsWith(" ")).toBe(true);
    expect(JSON.parse(text)).toEqual(result);
    expect(f.analyze).toHaveBeenCalledWith(expect.objectContaining({ instrumentId: "equity-analysis" }));
    expect(f.finish).toHaveBeenCalledWith(expect.anything(), "server-run", "completed");
    expect(f.close).toHaveBeenCalled();
  });
  it("returns the privacy refusal as 200 and finishes the run as refused", async () => {
    f.analyze.mockResolvedValue({ refusal: true, message: "Remove private details." });
    const response = await POST(request(valid));
    expect(response.status).toBe(200);
    expect(await readBody(response)).toEqual({ refusal: true, message: "Remove private details." });
    expect(f.finish).toHaveBeenCalledWith(expect.anything(), "server-run", "refused");
  });
  it("reports a failure in the body without request content and finishes the run as failed", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    f.analyze.mockRejectedValue(new Error("The Disability Services Division serves adults."));
    const body = await readBody(await POST(request(valid)));
    expect(body.error).toBeTruthy();
    expect(JSON.stringify(body)).not.toContain("serves adults");
    expect(f.finish).toHaveBeenCalledWith(expect.anything(), "server-run", "failed");
    expect(error).toHaveBeenCalledWith("analyze_failed", "Error");
    expect(JSON.stringify(error.mock.calls)).not.toContain("serves adults");
    expect(f.close).toHaveBeenCalled();
    error.mockRestore();
  });
  it("still closes the response with the result when the ledger cannot record the finish", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    f.finish.mockImplementation(() => { throw new Error("SQLITE_BUSY"); });
    f.close.mockImplementation(() => { throw new Error("closed"); });
    const response = await POST(request(valid));
    expect(response.status).toBe(200);
    expect(JSON.parse(await response.text())).toEqual(result);
    expect(error).toHaveBeenCalledWith("analyze_ledger_failed", "Error");
    error.mockRestore();
  });
  it("closes the response with a plain error when the work itself rejects after the analysis", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    f.analyze.mockRejectedValue(new Error("boom"));
    f.finish.mockImplementation(() => { throw new Error("SQLITE_BUSY"); });
    const body = await readBody(await POST(request(valid)));
    expect(body.error).toContain("could not be finished");
    expect(JSON.stringify(body)).not.toContain("boom");
    error.mockRestore();
  });
  it("rechecks the stop before releasing a result", async () => {
    f.paused.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const body = await readBody(await POST(request(valid)));
    expect(body.error).toContain("paused");
    expect(body.answers).toBeUndefined();
    expect(f.finish).toHaveBeenCalledWith(expect.anything(), "server-run", "failed");
  });
  it("answers 503, not a server error, when the request limit store cannot be reached", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    f.limit.mockRejectedValue(new Error("connection refused"));
    const response = await POST(request(valid));
    expect(response.status).toBe(503);
    expect(f.admit).not.toHaveBeenCalled();
    expect(f.analyze).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
