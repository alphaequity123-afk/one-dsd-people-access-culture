// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { getStore, resetStoreForTests } from "@/lib/intelligence/memory/store";
import { readEquityReviewTotals, recordEquityReviewCompletion } from "@/lib/practice/equity-review-count-store";
import { PRACTICE_COUNTERS_ENABLED, practiceScopes } from "@/lib/practice/equity-review-count";

const ORIGIN = "https://example.test";
const URL_PATH = `${ORIGIN}/api/practice/equity-review-completed`;
function post(body: unknown, origin: string | null = ORIGIN) {
  return new NextRequest(URL_PATH, {
    method: "POST",
    headers: { "content-type": "application/json", ...(origin ? { origin } : {}) },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("PAC_PUBLIC_ORIGIN", ORIGIN);
  resetStoreForTests();
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("anonymous equity review count endpoint", () => {
  it("rejects cross-origin and origin-less requests", async () => {
    expect((await POST(post({ tool: "structural" }, "https://other.test"))).status).toBe(403);
    expect((await POST(post({ tool: "structural" }, null))).status).toBe(403);
  });

  it("accepts only POST", async () => {
    const response = await GET();
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });

  it.each([
    ["an extra field", { tool: "structural", name: "Pat" }],
    ["a county", { tool: "structural", county: "Hennepin" }],
    ["free text", { tool: "structural", notes: "what I wrote" }],
    ["an unknown tool", { tool: "other" }],
    ["goal 7", { tool: "general", goals: [7] }],
    ["a repeated goal", { tool: "general", goals: [2, 2] }],
    ["an unknown decision type", { tool: "hcbs", decisionType: "budget" }],
  ])("rejects %s", async (_label, body) => {
    expect((await POST(post(body))).status).toBe(400);
  });

  it("accepts a valid count and keeps nothing while One DSD's database cannot hold it", async () => {
    // The store has no counter at all (owner rule 2026-11-16: not even anonymous totals).
    expect("counter" in getStore()).toBe(false);
    const response = await POST(post({ tool: "structural", goals: [3, 1], decisionType: "policy" }));
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(PRACTICE_COUNTERS_ENABLED).toBe(false);
    expect(await recordEquityReviewCompletion({ tool: "structural" })).toBe(false);
    expect(await readEquityReviewTotals()).toBeNull();
    expect(await getStore().listAudit()).toEqual([]);
  });

  it("stays off because the One DSD counter table accepts only consultation reference numbers", async () => {
    const sql = await readFile(path.join(process.cwd(), "db/standalone/bootstrap.sql"), "utf8");
    const block = sql.slice(sql.lastIndexOf("add constraint runtime_counters_registered_scope"));
    const patterns = [...block.slice(0, block.indexOf(";")).matchAll(/scope ~ '([^']+)'/g)].map(match => new RegExp(match[1]));
    const allowed = (scope: string) => patterns.some(pattern => pattern.test(scope));
    expect(allowed("cr:20261103")).toBe(true);
    for (const scope of practiceScopes({ tool: "structural", goals: [1], decisionType: "policy" }, new Date())) expect(allowed(scope), scope).toBe(PRACTICE_COUNTERS_ENABLED);
  });
});
