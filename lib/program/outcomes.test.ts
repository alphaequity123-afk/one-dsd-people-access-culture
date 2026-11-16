// @vitest-environment node
import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getStore, resetStoreForTests } from "@/lib/intelligence/memory/store";
import { listProgramOutcomes, outcomeThemes, saveProgramOutcome } from "./outcomes";
import { PROGRAM_OUTCOME_STORED_FIELDS, ProgramOutcomeInputSchema, ProgramOutcomeRecordSchema, outcomeMonth, outcomeReviewDay } from "./outcome-schema";
import { POST } from "@/app/api/program/outcomes/route";

vi.mock("server-only", () => ({}));

const ORIGIN = "http://localhost:3000";
const input = () => ({
  submissionId: randomUUID(), programScope: "one-dhs" as const,
  problem: "A general appointment notice was hard to act on.", action: "Rewrote the notice with the next step first.",
  adoptedChange: "The unit now uses the clearer notice.", observedResult: "Fewer callers asked what to do next.",
  followUp: "Use the same approach for the other notices.", decision: "revise" as const, consent: true as const,
  outcomeId: "access" as const, goalActionIds: ["ADSA-6.3", "ADSA-6.1"],
});
const IDENTITY = /"(?:name|email|phone|role|unit|ip|userAgent|createdAt|updatedAt|submittedAt|timestamp|sourceRoute|sessionId|userId|employeeId)"\s*:/i;
const stored = async () => (await getStore().list<Record<string, unknown>>("decision")).filter(row => String(row.id ?? "").startsWith("program-outcome-"));
const post = (body: unknown, extra: Record<string, string> = {}) => POST(new NextRequest(`${ORIGIN}/api/program/outcomes`, {
  method: "POST", headers: { origin: ORIGIN, "content-type": "application/json", ...extra }, body: JSON.stringify(body),
}));

beforeEach(() => {
  resetStoreForTests();
  vi.unstubAllEnvs();
  vi.stubEnv("PAC_PUBLIC_ORIGIN", ORIGIN);
});

describe("voluntary outcome record keeps no identity and the month only", () => {
  it("stores only the allowed fields, with a month and no timestamp", async () => {
    const record = await saveProgramOutcome(input(), new Date("2026-11-16T15:42:10.123Z"));
    expect(record.month).toBe("2026-11");
    const [row] = await stored();
    expect(Object.keys(row).every(key => (PROGRAM_OUTCOME_STORED_FIELDS as readonly string[]).includes(key))).toBe(true);
    const json = JSON.stringify(row);
    expect(json).not.toMatch(IDENTITY);
    expect(json).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    expect(json).not.toMatch(/2026-11-16|15:42/);
    expect(row.goalActionIds).toEqual(["ADSA-6.1", "ADSA-6.3"]);
  });
  it("refuses identity fields, a page path and a missing consent before anything is kept", async () => {
    for (const extra of [{ name: "A colleague" }, { email: "someone@example.org" }, { ip: "10.0.0.1" }, { userAgent: "Browser" }, { sourceRoute: "/support/share-result" }, { createdAt: new Date().toISOString() }, { unit: "Unit A" }]) {
      expect(ProgramOutcomeInputSchema.safeParse({ ...input(), ...extra }).success).toBe(false);
    }
    expect(ProgramOutcomeInputSchema.safeParse({ ...input(), consent: false }).success).toBe(false);
    await expect(saveProgramOutcome({ ...input(), observedResult: "Case number TESTONLY-1 improved after the change." })).rejects.toThrow(/remove names|private/i);
    await expect(saveProgramOutcome({ ...input(), observedResult: "Rank staff by their equity readiness and beliefs." })).rejects.toThrow();
    expect(await stored()).toEqual([]);
  });
  it("a retry with the same submission keeps one record", async () => {
    const once = input();
    await saveProgramOutcome(once);
    await saveProgramOutcome(once);
    expect(await stored()).toHaveLength(1);
  });
  it("still reads records shared before sharing closed, by month only", () => {
    const legacy = ProgramOutcomeRecordSchema.parse({ schemaVersion: 1, id: `program-outcome-${randomUUID()}`, createdAt: "2026-08-14T10:00:00.000Z", evidenceStatus: "self_reported", programScope: "dsd", problem: "p", action: "a", adoptedChange: "c", observedResult: "o", followUp: "f", decision: "retain", consent: true, reviewDate: "2026-12-01" });
    expect(outcomeMonth(legacy)).toBe("2026-08");
    expect(outcomeReviewDay(legacy)).toBe("2026-12-01");
  });
});

describe("POST /api/program/outcomes", () => {
  it("keeps the account and nothing from the request headers", async () => {
    const response = await post(input(), { "x-forwarded-for": "203.0.113.9", "x-real-ip": "203.0.113.9", "user-agent": "SentinelBrowser/9.9", referer: `${ORIGIN}/support/share-result`, cookie: "pac_family=sentinel-cookie" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ shared: true });
    expect(response.headers.get("cache-control")).toBe("no-store");
    const json = JSON.stringify(await stored());
    for (const leak of ["203.0.113.9", "SentinelBrowser", "share-result", "sentinel-cookie"]) expect(json).not.toContain(leak);
    expect(json).not.toMatch(IDENTITY);
  });
  it("refuses another site, missing consent, extra identity and private details without keeping anything", async () => {
    const crossSite = await POST(new NextRequest(`${ORIGIN}/api/program/outcomes`, { method: "POST", headers: { origin: "https://other.example", "content-type": "application/json" }, body: JSON.stringify(input()) }));
    expect(crossSite.status).toBe(403);
    expect((await post({ ...input(), consent: false })).status).toBe(400);
    expect((await post({ ...input(), email: "someone@example.org" })).status).toBe(400);
    expect((await post({ ...input(), problem: "Call Jane Doe at 651-555-0100 about her case." })).status).toBe(422);
    expect(await stored()).toEqual([]);
  });
});

describe("owner review groups accounts as themes, with no totals", () => {
  it("groups by goal and outcome and leaves empty groups out", async () => {
    await saveProgramOutcome(input());
    await saveProgramOutcome({ ...input(), outcomeId: undefined, goalActionIds: undefined });
    const themes = outcomeThemes(await listProgramOutcomes());
    expect(themes.byGoal.map(g => g.heading)).toEqual(["Goal 6: Communication and Accessibility"]);
    expect(themes.byOutcome.map(g => g.key)).toEqual(["access"]);
    expect(themes.unlinked).toHaveLength(1);
    expect(Object.keys(themes)).toEqual(["byGoal", "byOutcome", "unlinked"]);
  });
});
