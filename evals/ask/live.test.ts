/**
 * The live Ask eval's scoring, run against a small in-process stand-in for POST /api/ask (no app, no model, no network).
 * Checks that the eval reads progress lines, times the first text, and catches stock text, wording and missing sources.
 */
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { run } from "./live.ts";

const GOOD = "Send the purpose and materials ahead of time, offer accommodation to everyone without asking anyone to disclose a disability, and give people several ways to take part, spoken and written. The person or area responsible for the meeting confirms captions and interpretation in advance and shares decisions, owners and next steps afterward in an accessible note.";
let server: Server;
let base = "";
let seen = 0;

beforeAll(async () => {
  server = createServer((request, response) => {
    if (request.method === "GET") { response.writeHead(request.url?.startsWith("/missing") ? 404 : 200, { "content-type": "text/html" }); response.end("<title>ok</title>"); return; }
    let body = "";
    request.on("data", chunk => { body += chunk; });
    request.on("end", () => {
      const { question } = JSON.parse(body) as { question: string };
      seen += 1;
      const stocky = /seasons/i.test(question);
      const answer = stocky
        ? { kind: "answer", answer: { shortAnswer: "We could not put together an answer just now. Please try again in a moment.", whyItMatters: "", limits: [], sources: [], nextActions: [] } }
        : { kind: "answer", answer: { shortAnswer: GOOD + (/quorum/i.test(question) ? " Ask your office manager." : ""), whyItMatters: "", limits: [], sources: [{ title: "Accessible meetings", href: "/library/ja-accessible-meetings" }, ...(/pivot/i.test(question) ? [{ title: "Gone", href: "/missing/page" }] : [])], nextActions: [{ label: "Open", href: "/practice/gp-8" }] } };
      response.writeHead(200, { "content-type": "application/x-ndjson" });
      response.write(JSON.stringify({ type: "wait" }) + "\n");
      response.write(JSON.stringify({ type: "text", text: answer.answer.shortAnswer.slice(0, 20) }) + "\n");
      response.end(JSON.stringify({ type: "done", result: answer }) + "\n");
    });
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => { server.close(); vi.unstubAllEnvs(); });

describe("live Ask eval scoring", () => {
  it("scores a stand-in Ask and names concrete failures", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("EVALS_ASK_CONCURRENCY_SAMPLE", "5");
    const result = await run({ baseUrl: base, maxModelCalls: 0 });
    const byName = (prefix: string) => result.measures.find(m => m.name.startsWith(prefix))!;
    expect(result.cadence).toBe("live");
    expect(result.passed).toBe(false);
    // The stand-in answers the seasons question with stock text.
    expect(byName("A2 answers in words").pass).toBe(false);
    expect(byName("A2 answers in words").failures?.join(" ")).toContain("gen-001");
    // It says "office" once and cites a missing page once.
    expect(byName("Wording").failures?.join(" ")).toContain("gen-008");
    expect(byName("A1(a) citation validity").failures?.join(" ")).toContain("gen-006");
    // The same answer is given for every family, so A4 holds.
    expect(byName("A4 same required facts").pass).toBe(true);
    expect(byName("A4 related resources equal as sets").pass).toBe(true);
    expect(byName("A4 statements profiling").pass).toBe(true);
    // Streamed text is timed before the whole reply.
    expect(Number(byName("A3 first text p50").value)).toBeLessThan(5);
    expect(result.skipped?.some(s => s.includes("model graded"))).toBe(true);
    // 1 probe + 150 golden + 5 at concurrency 5 + 220 family pairs + 10 private prompts.
    expect(seen).toBe(1 + 150 + 5 + 220 + 10);
  }, 120_000);
});
