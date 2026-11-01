// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
import { toolkitRequestSchema, type ToolkitCase, type ToolkitResponse } from "./schema";
import { getQuestions, TOOLKIT_VERSION } from "./instrument";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ owner: true, policyAllowed: true, modelApproved: true, rows: new Map<string, Record<string, unknown>>(), revisions: [] as unknown[][], sentSql: [] as unknown[][] }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/request", () => ({ ownerFromCookies: async () => mocks.owner, ownerFromRequest: async () => mocks.owner }));
vi.mock("@/lib/auth/mutation", () => ({ isSameOriginMutation: (request: Request) => request.headers.get("origin") === "https://example.test" }));
vi.mock("@/lib/db/owner-client", () => {
  const sql = Object.assign(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.join("?").replace(/\s+/g, " ").trim(); mocks.sentSql.push(values);
    if (query.includes("limit 0")) return [];
    if (query.startsWith("insert into pac_dsd.consultant_toolkit_cases")) {
      mocks.rows.set(String(values[0]), { id: values[0], version: 1, status: "draft", encrypted_payload: values[1], created_at: values[2], updated_at: values[3], finalized_at: null }); return [];
    }
    if (query.startsWith("insert into pac_dsd.consultant_toolkit_case_revisions")) { mocks.revisions.push(values); return []; }
    if (query.startsWith("update pac_dsd.consultant_toolkit_cases")) {
      const row = mocks.rows.get(String(values[5]));
      if (!row || row.version !== values[6]) return [];
      Object.assign(row, { version: values[0], status: values[1], encrypted_payload: values[2], updated_at: values[3], finalized_at: values[4] }); return [{ id: row.id }];
    }
    if (query.startsWith("delete from pac_dsd.consultant_toolkit_cases")) {
      const row = mocks.rows.get(String(values[0])); if (!row || row.version !== values[1]) return [];
      mocks.rows.delete(String(values[0])); mocks.revisions = mocks.revisions.filter(entry => entry[0] !== values[0]); return [{ id: row.id }];
    }
    if (query.includes("where id=")) { const row = mocks.rows.get(String(values[0])); return row ? [{ ...row }] : []; }
    if (query.includes("order by updated_at")) return [...mocks.rows.values()].slice(Number(values[0]), Number(values[0]) + 101);
    throw new Error("Unrecognized synthetic SQL");
  }, { begin: async <T>(work: (tx: unknown) => Promise<T>) => work(sql) });
  return { ownerDatabase: async () => { if (!mocks.owner) throw new Error("An active owner session is required."); return sql; } };
});
vi.mock("@/lib/intelligence/orchestrator", () => ({ contextFor: () => ({ agent: { agent_id: "ask_concierge", tools_allowlist: ["answer.structured_draft"], scope: { environments: ["local"], roles: ["owner"] } }, role: "owner" }) }));
vi.mock("@/lib/intelligence/registry/models", () => ({ STAFF_GENERATION_MODEL_ID: "synthetic", getModel: () => ({ provider_id: "openai", model_id: "synthetic", provider_model_ref: "synthetic", approval_state: mocks.modelApproved ? "approved" : "candidate", supports_json_schema: true, allowed_agent_ids: ["ask_concierge"], scope: { environments: ["local"], data_classes: ["staff_public_corpus"] } }) }));
vi.mock("@/lib/intelligence/policy", () => ({ getPolicy: async () => ({}), agentAllowed: () => ({ ok: mocks.policyAllowed }), effectiveCeiling: () => "A2" }));
vi.mock("@/lib/intelligence/tools/catalog", () => ({ getTool: () => ({ enabled: true, min_autonomy: "A2" }) }));
vi.mock("@/lib/intelligence/tools/runtime", () => ({ runTool: async (_context: unknown, _name: string, work: () => unknown) => work() }));
vi.mock("./program-context", () => ({ toolkitProgramContext: async (request: { sources: unknown[] }) => ({ sources: request.sources, note: "Synthetic local sources" }) }));

import { createToolkitCase, decodeCaseKey, decryptToolkitCase, deleteToolkitCase, encryptToolkitCase, getToolkitCase, listToolkitCases, nextCaseStatus, updateToolkitCase, toolkitCaseSavingAvailability } from "./cases";
import { privateStructuredDraft, prepareToolkitDraft } from "./service";
import { POST as createCaseRoute, GET as listCaseRoute } from "@/app/api/consultant/toolkit/cases/route";
import { POST as uploadRoute } from "@/app/api/consultant/toolkit/upload/route";

const request = () => toolkitRequestSchema.parse({ title: "Sensitive draft example", question: "Analyze this internal draft", track: "scan", sources: [{ id: "source-1", title: "Private draft", text: "Confidential proposal: the new process adds one office visit." }] });
const result = (): ToolkitResponse => ({ summary: "This proposal needs evidence and consultant review.", answers: getQuestions("scan").map(question => ({ questionId: question.id, text: "Further evidence is needed for this question.", kind: "gap", citations: [] })), alternatives: [], actions: [], limitations: ["Community engagement evidence was not supplied."], questionsForReview: ["What engagement evidence is available?"] });
const sampleCase = (): ToolkitCase => ({ id: "89deee4a-5edb-4d36-aec5-27119cb03a68", version: 1, instrumentVersion: TOOLKIT_VERSION, status: "draft", title: request().title, request: request(), result: result(), createdAt: "2026-10-15T12:00:00.000Z", updatedAt: "2026-10-15T12:00:00.000Z", finalizedAt: null });

beforeEach(() => { vi.stubEnv("PAC_CONSULTANT_CASE_PREVIOUS_KEY", undefined); mocks.owner = true; mocks.policyAllowed = true; mocks.modelApproved = true; mocks.rows.clear(); mocks.revisions = []; mocks.sentSql = []; vi.stubEnv("PAC_CONSULTANT_CASE_KEY", randomBytes(32).toString("base64")); vi.stubEnv("PAC_CONSULTANT_ANALYSIS_ENABLED", "on"); vi.stubEnv("PAC_CONSULTANT_OPENAI_API_KEY", ""); vi.stubEnv("OPENAI_API_KEY", "synthetic-test-only"); vi.stubEnv("PAC_GENERATIVE_PILOT", "off"); });

describe("authenticated private case encryption", () => {
  it("encrypts every private field and binds ciphertext to case and version", () => {
    const key = randomBytes(32), value = sampleCase(), encrypted = encryptToolkitCase(value, key);
    expect(encrypted).not.toContain("Sensitive"); expect(encrypted).not.toContain("Confidential");
    expect(decryptToolkitCase(encrypted, value.id, value.version, key)).toEqual(value);
    expect(() => decryptToolkitCase(encrypted, value.id, 2, key)).toThrow();
    expect(() => decryptToolkitCase(encrypted, "54e64f83-feb9-4ef5-a8bf-47342f8d4a23", 1, key)).toThrow();
    expect(() => decryptToolkitCase(encrypted, value.id, 1, randomBytes(32))).toThrow();
    const parts = encrypted.split(":"); parts[3] = `${parts[3][0] === "A" ? "B" : "A"}${parts[3].slice(1)}`;
    expect(() => decryptToolkitCase(parts.join(":"), value.id, 1, key)).toThrow();
  });
  it("requires a strong separately configured key and uses fresh nonces", () => {
    expect(() => decodeCaseKey(undefined)).toThrow(); expect(() => decodeCaseKey("00".repeat(32))).toThrow();
    const key = randomBytes(32); expect(decodeCaseKey(key.toString("hex"))).toEqual(key);
    expect(encryptToolkitCase(sampleCase(), key)).not.toEqual(encryptToolkitCase(sampleCase(), key));
  });
  it("pins the saved instrument and rejects incompatible versions without leaking content", () => {
    const key = randomBytes(32), value = sampleCase();
    const incompatible = { ...value, instrumentVersion: "future-incompatible-version" } as unknown as ToolkitCase;
    expect(() => decryptToolkitCase(encryptToolkitCase(incompatible, key), value.id, value.version, key)).toThrowError(expect.objectContaining({ code: "instrument_version", status: 409 }));
    const { instrumentVersion: _instrumentVersion, ...legacy } = value;
    expect(decryptToolkitCase(encryptToolkitCase(legacy as ToolkitCase, key), value.id, value.version, key).instrumentVersion).toBe(TOOLKIT_VERSION);
  });
});

describe("private persistent case lifecycle", () => {
  it("persists only encrypted bodies, creates versions and rejects stale updates", async () => {
    const payload = { request: request(), result: result() };
    const created = await createToolkitCase(payload);
    expect(await getToolkitCase(created.id)).toEqual(created);
    expect(JSON.stringify(mocks.sentSql)).not.toContain("Confidential");
    expect((await listToolkitCases()).cases[0].title).toBe(payload.request.title);
    const review = await updateToolkitCase(created.id, 1, payload, "review"); expect(review.status).toBe("review");
    await expect(updateToolkitCase(created.id, 1, payload, "draft")).rejects.toMatchObject({ code: "conflict" });
    await expect(updateToolkitCase(created.id, 2, payload, "final")).rejects.toMatchObject({ code: "transition" });
    const final = await updateToolkitCase(created.id, 2, payload, "final", true); expect(final.finalizedAt).toBeTruthy();
    await expect(updateToolkitCase(created.id, 3, payload, "review")).rejects.toMatchObject({ code: "transition" });
    const reopened = await updateToolkitCase(created.id, 3, payload, "draft"); expect(reopened.version).toBe(4); expect(reopened.finalizedAt).toBeNull();
    expect(mocks.revisions).toHaveLength(4);
    await deleteToolkitCase(created.id, 4); expect(await getToolkitCase(created.id)).toBeNull(); expect(mocks.revisions).toHaveLength(0);
  });
  it("requires saved unchanged content for review and active owner for reads", async () => {
    expect(() => nextCaseStatus("draft", "final", false, true, true)).toThrow();
    expect(() => nextCaseStatus("draft", "review", true, true, false)).toThrow();
    expect(() => nextCaseStatus("draft", "review", false, false, false)).toThrow();
    const created = await createToolkitCase({ request: request(), result: null });
    mocks.owner = false; await expect(getToolkitCase(created.id)).rejects.toThrow(); await expect(listToolkitCases()).rejects.toThrow();
  });
});

describe("private provider boundary", () => {
  it("sends structured input with store:false and no public research tools", async () => {
    const fetcher = vi.fn(async () => Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(result()) }] }] }));
    expect(await privateStructuredDraft("synthetic", "system", "Confidential text", "test", fetcher)).toEqual(result());
    const call = fetcher.mock.calls[0] as unknown as [string, RequestInit]; const body = JSON.parse(String(call[1].body));
    expect(call[0]).toBe("https://api.openai.com/v1/responses"); expect(body.store).toBe(false); expect(body.tools).toBeUndefined(); expect(body.input[1].content).toBe("Confidential text");
  });
  it("never logs or exposes provider failure bodies", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetcher = vi.fn(async () => new Response("Confidential client detail echoed by upstream", { status: 400 }));
    await expect(privateStructuredDraft("synthetic", "system", "private", "test", fetcher)).rejects.toMatchObject({ code: "provider_failed", message: "The drafting service could not complete this request. Your saved case is unchanged." });
    expect(spy).not.toHaveBeenCalled(); spy.mockRestore();
  });
  it("accepts confidential subject matter only through the authenticated consultant workflow", async () => {
    const fetcher = vi.fn(async () => Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(result()) }] }] }));
    vi.stubGlobal("fetch", fetcher);
    const generated = await prepareToolkitDraft(request()); expect(generated.analysis.answers).toHaveLength(getQuestions("scan").length); expect(fetcher).toHaveBeenCalledOnce();
    mocks.owner = false; await expect(prepareToolkitDraft(request())).rejects.toMatchObject({ code: "unauthorized" }); expect(fetcher).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
  it("uses the dedicated consultant credential independently of the staff generation flag", async () => {
    const fetcher = vi.fn(async () => Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(result()) }] }] }));
    vi.stubGlobal("fetch", fetcher); vi.stubEnv("OPENAI_API_KEY", ""); vi.stubEnv("PAC_CONSULTANT_OPENAI_API_KEY", "synthetic-consultant-only");
    await prepareToolkitDraft(request());
    const call = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect((call[1].headers as Record<string, string>).authorization).toBe("Bearer synthetic-consultant-only");
    expect(process.env.PAC_GENERATIVE_PILOT).toBe("off");
    vi.stubEnv("OPENAI_API_KEY", "synthetic-staff-only"); await prepareToolkitDraft(request());
    const second = fetcher.mock.calls[1] as unknown as [string, RequestInit];
    expect((second[1].headers as Record<string, string>).authorization).toBe("Bearer synthetic-consultant-only");
    vi.unstubAllGlobals();
  });
  it("fails closed for a disabled private capability, policy stop, or unapproved model", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    vi.stubEnv("PAC_CONSULTANT_ANALYSIS_ENABLED", "off");
    await expect(prepareToolkitDraft(request())).rejects.toMatchObject({ code: "unavailable" });
    vi.stubEnv("PAC_CONSULTANT_ANALYSIS_ENABLED", "on"); mocks.policyAllowed = false;
    await expect(prepareToolkitDraft(request())).rejects.toMatchObject({ code: "unavailable" });
    mocks.policyAllowed = true; mocks.modelApproved = false;
    await expect(prepareToolkitDraft(request())).rejects.toMatchObject({ code: "unavailable" });
    expect(fetcher).not.toHaveBeenCalled(); vi.unstubAllGlobals();
  });
});

describe("consultant route boundaries", () => {
  it("denies unsigned and cross-origin writes before reading private bodies", async () => {
    mocks.owner = false;
    const unsigned = new NextRequest("https://example.test/api/consultant/toolkit/cases", { method: "POST", body: "private material" });
    expect((await createCaseRoute(unsigned)).status).toBe(401); expect(unsigned.bodyUsed).toBe(false);
    mocks.owner = true;
    const crossOrigin = new NextRequest("https://example.test/api/consultant/toolkit/cases", { method: "POST", headers: { origin: "https://other.test" }, body: "private material" });
    expect((await createCaseRoute(crossOrigin)).status).toBe(403); expect(crossOrigin.bodyUsed).toBe(false);
    expect(mocks.rows.size).toBe(0);
  });
  it("returns private no-store case responses and saves encrypted documents", async () => {
    const response = await createCaseRoute(new NextRequest("https://example.test/api/consultant/toolkit/cases", { method: "POST", headers: { origin: "https://example.test", "content-type": "application/json" }, body: JSON.stringify({ payload: { request: request(), result: null } }) }));
    expect(response.status).toBe(201); expect(response.headers.get("cache-control")).toContain("no-store");
    const listed = await listCaseRoute(new NextRequest("https://example.test/api/consultant/toolkit/cases"));
    expect((await listed.json()).cases).toHaveLength(1); expect(JSON.stringify([...mocks.rows.values()])).not.toContain("Confidential");
  });
  it("extracts confidential text locally without a provider call", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const form = new FormData(); form.set("file", new File(["Confidential internal draft for consultant review."], "internal.txt", { type: "text/plain" }));
    const response = await uploadRoute(new NextRequest("https://example.test/api/consultant/toolkit/upload", { method: "POST", headers: { origin: "https://example.test" }, body: form }));
    expect(response.status).toBe(200); expect((await response.json()).source.text).toContain("Confidential internal draft"); expect(fetcher).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("controlled private-case key transition", () => {
  it("reads both keys during transition but new ciphertext authenticates only with the current key", () => {
    const current = randomBytes(32), previous = randomBytes(32), value = sampleCase();
    const oldEnvelope = encryptToolkitCase(value, previous);
    expect(decryptToolkitCase(oldEnvelope, value.id, value.version, current, previous)).toEqual(value);
    const newEnvelope = encryptToolkitCase(value, current);
    expect(decryptToolkitCase(newEnvelope, value.id, value.version, current, previous)).toEqual(value);
    expect(() => decryptToolkitCase(newEnvelope, value.id, value.version, previous)).toThrowError(expect.objectContaining({ code: "unavailable", status: 503 }));
    expect(() => decryptToolkitCase(oldEnvelope, value.id, value.version, current, randomBytes(32))).toThrowError(expect.objectContaining({ code: "unavailable", status: 503 }));
    const parts = oldEnvelope.split(":");
    parts[3] = `${parts[3][0] === "A" ? "B" : "A"}${parts[3].slice(1)}`;
    expect(() => decryptToolkitCase(parts.join(":"), value.id, value.version, current, previous)).toThrow();
    expect(() => decryptToolkitCase(oldEnvelope, value.id, value.version + 1, current, previous)).toThrow();
  });
  it("preserves instrument and record validation after either key authenticates", () => {
    const current = randomBytes(32), previous = randomBytes(32), value = sampleCase();
    for (const encryptionKey of [current, previous]) {
      const incompatible = { ...value, instrumentVersion: "future-incompatible-version" } as unknown as ToolkitCase;
      expect(() => decryptToolkitCase(encryptToolkitCase(incompatible, encryptionKey), value.id, value.version, current, previous)).toThrowError(expect.objectContaining({ code: "instrument_version", status: 409 }));
      const invalid = { ...value, status: "invalid-status" } as unknown as ToolkitCase;
      expect(() => decryptToolkitCase(encryptToolkitCase(invalid, encryptionKey), value.id, value.version, current, previous)).toThrowError(expect.objectContaining({ code: "unavailable", status: 503 }));
    }
  });
  it("lists and updates old rows using the previous key while writing only the current key", async () => {
    const previous = randomBytes(32), current = randomBytes(32), payload = { request: request(), result: result() };
    vi.stubEnv("PAC_CONSULTANT_CASE_KEY", previous.toString("base64"));
    const created = await createToolkitCase(payload);
    vi.stubEnv("PAC_CONSULTANT_CASE_KEY", current.toString("base64"));
    vi.stubEnv("PAC_CONSULTANT_CASE_PREVIOUS_KEY", previous.toString("base64"));
    expect(await getToolkitCase(created.id)).toEqual(created);
    expect((await listToolkitCases()).cases[0].id).toBe(created.id);
    const updated = await updateToolkitCase(created.id, 1, payload, "review");
    const envelope = String(mocks.rows.get(created.id)?.encrypted_payload);
    expect(decryptToolkitCase(envelope, created.id, 2, current)).toEqual(updated);
    expect(() => decryptToolkitCase(envelope, created.id, 2, previous)).toThrow();
    const fresh = await createToolkitCase(payload);
    const freshEnvelope = String(mocks.rows.get(fresh.id)?.encrypted_payload);
    expect(decryptToolkitCase(freshEnvelope, fresh.id, 1, current)).toEqual(fresh);
    expect(() => decryptToolkitCase(freshEnvelope, fresh.id, 1, previous)).toThrow();
  });
  it("fails closed when an optional fallback is configured incorrectly", async () => {
    const created = await createToolkitCase({ request: request(), result: null });
    for (const malformed of ["", "not-a-key", "00".repeat(32)]) {
      vi.stubEnv("PAC_CONSULTANT_CASE_PREVIOUS_KEY", malformed);
      await expect(getToolkitCase(created.id)).rejects.toMatchObject({ code: "unavailable", status: 503 });
      await expect(listToolkitCases()).rejects.toMatchObject({ code: "unavailable", status: 503 });
      expect((await toolkitCaseSavingAvailability()).caseSavingAvailable).toBe(false);
    }
  });
});
