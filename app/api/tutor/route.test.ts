// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { getStore, resetStoreForTests } from "@/lib/intelligence/memory/store";
import { readTutorTotals, recordTutorRound, tutorScopes } from "@/lib/tutor/counter-store";
import { tutorItem } from "@/lib/tutor/items";
import { fallbackReply } from "@/lib/tutor/prompt";
import { PRACTICE_COUNTERS_ENABLED } from "@/lib/practice/equity-review-count";

const provider = vi.hoisted(() => ({ generative: true, complete: vi.fn() }));
vi.mock("@/lib/intelligence/providers", () => ({
  resolveBinding: () => ({
    generative: provider.generative,
    model: { model_id: "mdl_test", provider_id: "fixture", provider_model_ref: "test" },
    adapter: { id: "fixture", generative: provider.generative, complete: provider.complete },
    reason: "test",
  }),
}));

import {GET, POST} from "./route";
import { type TutorResponse } from "@/lib/tutor/request";

const ORIGIN = "https://example.test";
const URL_PATH = `${ORIGIN}/api/tutor`;
function post(body: unknown, origin: string | null = ORIGIN, raw = false) {
  return new NextRequest(URL_PATH, {
    method: "POST",
    headers: { "content-type": "application/json", ...(origin ? { origin } : {}) },
    body: raw ? String(body) : JSON.stringify(body),
  });
}
const item = tutorItem("01", "01")!;
const wrong = item.options.findIndex((_, n) => n !== item.correctIndex);
const right = item.correctIndex;
const base = { lessonId: "01", itemId: "01", chosenIndex: wrong, attemptNumber: 1, strategy: "socratic-hint" };
const GOOD_REPLY = { restatement: "You chose to send the notice again, which means repeating the same message.", guidance: "What would tell you whether the first notice was understood?", nextStep: "Re-read the lesson section on the working example, then try again." };
const read = async (response: Response) => (await response.json()) as TutorResponse;

beforeEach(() => {
  vi.stubEnv("PAC_PUBLIC_ORIGIN", ORIGIN);
  resetStoreForTests();
  provider.generative = true;
  provider.complete.mockReset();
  provider.complete.mockResolvedValue({ parsed: GOOD_REPLY, model_id: "mdl_test" });
});
afterEach(() => { vi.unstubAllEnvs(); });

describe("guidance endpoint", () => {
  it("rejects cross-origin and origin-less requests before reading the body", async () => {
    expect((await POST(post(base, "https://other.test"))).status).toBe(403);
    expect((await POST(post(base, null))).status).toBe(403);
    expect(provider.complete).not.toHaveBeenCalled();
  });

  it("accepts only POST", async () => {
    const response = await GET();
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });

  it.each([
    ["a client claim of correctness", { ...base, correct: true }],
    ["a client feedback field", { ...base, feedback: "well done" }],
    ["a user id", { ...base, userId: "u-1" }],
    ["a name", { ...base, name: "Pat" }],
    ["a bad lesson id", { ...base, lessonId: "1" }],
    ["a bad item id", { ...base, itemId: "1" }],
    ["a fractional option", { ...base, chosenIndex: 0.5 }],
    ["a negative option", { ...base, chosenIndex: -1 }],
    ["attempt 0", { ...base, attemptNumber: 0 }],
    ["attempt 6", { ...base, attemptNumber: 6 }],
    ["an unknown strategy", { ...base, strategy: "answer" }],
    ["a long message", { ...base, learnerMessage: "x".repeat(501) }],
    ["a non-object body", [1]],
  ])("rejects %s", async (_label, body) => {
    expect((await POST(post(body))).status).toBe(400);
    expect(provider.complete).not.toHaveBeenCalled();
  });

  it("rejects malformed and oversized bodies, unknown items and options outside the question", async () => {
    expect((await POST(post("{not json", ORIGIN, true))).status).toBe(400);
    expect((await POST(post({ ...base, learnerMessage: "y".repeat(5000) }))).status).toBe(413);
    expect((await POST(post({ ...base, itemId: "02" }))).status).toBe(404);
    expect((await POST(post({ ...base, chosenIndex: item.options.length }))).status).toBe(400);
    expect(provider.complete).not.toHaveBeenCalled();
  });

  it("re-scores on the server from the content engine and returns the deterministic feedback", async () => {
    const wrongReply = await read(await POST(post(base)));
    expect(wrongReply.correct).toBe(false);
    expect(wrongReply.feedback).toBe(item.options[wrong].feedback);
    const rightReply = await read(await POST(post({ ...base, chosenIndex: right, strategy: "stop" })));
    expect(rightReply.correct).toBe(true);
    expect(rightReply.feedback).toBe(item.options[right].feedback);
    expect(rightReply.strategy).toBe("stop");
  });

  it("calls the generation provider with the three-part structure, the strategy and lesson grounding, and returns the parts in order", async () => {
    const response = await read(await POST(post({ ...base, learnerMessage: "Why does the format matter?" })));
    expect(provider.complete).toHaveBeenCalledTimes(1);
    const [request] = provider.complete.mock.calls[0];
    expect(request.system).toContain("(a) restatement");
    expect(request.system).toContain("(b) guidance");
    expect(request.system).toContain("(c) nextStep");
    expect(request.system).toContain("Never state, imply or rank which option is correct");
    expect(request.user).toContain("Strategy socratic-hint");
    expect(request.user).toContain(item.options[wrong].text);
    expect(request.user).not.toContain(item.options[right].text);
    expect(request.user).toContain("Standard 1:");
    expect(request.user).toContain('"""Why does the format matter?"""');
    expect(request.schema).toBeTruthy();
    expect(request.trace_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.parts).toEqual(GOOD_REPLY);
    expect(response.tutor).toBe(`${GOOD_REPLY.restatement}\n\n${GOOD_REPLY.guidance}\n\n${GOOD_REPLY.nextStep}`);
    expect(response.grounding.some(link => link.href === "/learn/clas/curriculum/01/job-aid")).toBe(true);
    expect(response.grounding.every(link => typeof link.title === "string" && link.href.startsWith("/"))).toBe(true);
  });

  it("replaces a reply that leaks the correct option with a safe fallback built from the chosen option", async () => {
    provider.complete.mockResolvedValue({ parsed: { ...GOOD_REPLY, guidance: `Consider this: ${item.options[right].text}` }, model_id: "mdl_test" });
    const leaked = await read(await POST(post(base)));
    expect(leaked.parts).toEqual(fallbackReply(item, wrong, false));
    expect(leaked.tutor).not.toContain(item.options[right].text);
    expect(leaked.tutor).toContain(item.options[wrong].feedback);
    provider.complete.mockResolvedValue({ parsed: { ...GOOD_REPLY, nextStep: item.options[right].feedback }, model_id: "mdl_test" });
    const leakedFeedback = await read(await POST(post(base)));
    expect(leakedFeedback.parts).toEqual(fallbackReply(item, wrong, false));
  });

  it("rejects a reply without the three parts and falls back to lesson feedback only", async () => {
    provider.complete.mockResolvedValue({ parsed: { restatement: "You chose to resend.", guidance: "Think about it." }, model_id: "mdl_test" });
    const response = await read(await POST(post(base)));
    expect(response.tutor).toBeNull();
    expect(response.parts).toBeNull();
    expect(response.feedback).toBe(item.options[wrong].feedback);
  });

  it("returns the deterministic feedback with no guidance when the provider is down or not generative", async () => {
    provider.complete.mockRejectedValue(new Error("provider_request_failed"));
    const down = await POST(post(base));
    expect(down.status).toBe(200);
    const body = await read(down);
    expect(body).toMatchObject({ correct: false, feedback: item.options[wrong].feedback, tutor: null, parts: null, strategy: "socratic-hint" });
    expect(body.grounding.length).toBeGreaterThan(0);
    provider.generative = false;
    provider.complete.mockReset();
    const notGenerative = await read(await POST(post(base)));
    expect(notGenerative.tutor).toBeNull();
    expect(provider.complete).not.toHaveBeenCalled();
  });

  it("counts nothing while One DSD's database cannot hold practice totals", async () => {
    const counter = vi.spyOn(getStore(), "counter");
    const request = post({ ...base, learnerMessage: "My name is Pat and I work in Hennepin." });
    request.headers.set("x-forwarded-for", "203.0.113.9");
    expect((await POST(request)).status).toBe(200);
    expect((await POST(post({ ...base, chosenIndex: right, attemptNumber: 2, strategy: "stop" }))).status).toBe(200);
    expect(counter).not.toHaveBeenCalled();
    expect(PRACTICE_COUNTERS_ENABLED).toBe(false);
    expect(await recordTutorRound({ lessonId: "01", itemId: "01", attemptNumber: 1, correct: true, strategy: "stop" })).toBe(false);
    expect(await readTutorTotals()).toBeNull();
    for (const kind of ["consult_request", "decision", "eval_result", "collaboration_workspace"] as const) expect(await getStore().list(kind)).toEqual([]);
    expect(await getStore().listAudit()).toEqual([]);
    counter.mockRestore();
  });

  it("uses the already registered request limit and refuses once it is spent", async () => {
    for (let index = 0; index < 30; index++) expect((await POST(post(base))).status).toBe(200);
    const refused = await POST(post(base));
    expect(refused.status).toBe(429);
    expect(refused.headers.get("retry-after")).toBeTruthy();
  });
});

describe("guidance counter contract", () => {
  it("stays off because the One DSD counter table accepts only consultation reference numbers", async () => {
    const sql = await readFile(path.join(process.cwd(), "db/standalone/bootstrap.sql"), "utf8");
    const block = sql.slice(sql.lastIndexOf("add constraint runtime_counters_registered_scope"));
    const patterns = [...block.slice(0, block.indexOf(";")).matchAll(/scope ~ '([^']+)'/g)].map(match => new RegExp(match[1]));
    expect(patterns.length).toBeGreaterThan(0);
    const allowed = (scope: string) => patterns.some(pattern => pattern.test(scope));
    expect(allowed("cr:20261103")).toBe(true);
    const scopes = tutorScopes({ lessonId: "01", itemId: "01", attemptNumber: 1, correct: true, strategy: "nudge" }, new Date());
    expect(scopes.length).toBe(4);
    // If the database starts accepting these keys, counting can be turned on.
    for (const scope of scopes) expect(allowed(scope), scope).toBe(PRACTICE_COUNTERS_ENABLED);
  });
});
