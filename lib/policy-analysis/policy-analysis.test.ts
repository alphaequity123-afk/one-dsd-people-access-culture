// @vitest-environment node
import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getQuestions, TOOLKIT_VERSION } from "@/lib/consultant-toolkit/instrument";
import { toolkitRequestSchema, type ToolkitCase } from "@/lib/consultant-toolkit/schema";

const mocks = vi.hoisted(() => ({ rows: new Map<string, Record<string, unknown>>(), revisions: [] as unknown[][], owner: true }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/owner-client", () => {
  const sql = Object.assign(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.join("?").replace(/\s+/g, " ").trim();
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
      mocks.rows.delete(String(values[0])); return [{ id: row.id }];
    }
    if (query.includes("where id=")) { const row = mocks.rows.get(String(values[0])); return row ? [{ ...row }] : []; }
    if (query.includes("order by updated_at")) return [...mocks.rows.values()].slice(Number(values[0]), Number(values[0]) + 101);
    throw new Error("Unrecognized synthetic SQL");
  }, { begin: async <T>(work: (tx: unknown) => Promise<T>) => work(sql) });
  return { ownerDatabase: async () => sql };
});
vi.mock("@/lib/auth/request", () => ({ ownerFromCookies: async () => mocks.owner, ownerFromRequest: async () => mocks.owner }));
vi.mock("@/lib/consultant-toolkit/service", () => ({ readiness: async () => ({ available: false, reason: "off" }), ToolkitServiceError: class extends Error {} }));
vi.mock("@/lib/auth/team-request", () => ({ teamMemberFromCookies: async () => null, teamMemberFromRequest: async () => null }));

import { caseRowKind, decodeToolkitRowOrSkip, decryptToolkitCase, encryptToolkitCase, listToolkitCases, getToolkitCase, type CaseRow } from "@/lib/consultant-toolkit/cases";
import { FORMALIZATION_STATEMENT, type PolicyCase, type PolicySource } from "./contract";
import { decodePolicyRow, decryptPolicyCase, encryptPolicyCase, createPolicyCase, deletePolicyCase, getPolicyCase, listPolicyCases, mutatePolicyCase } from "./store";
import {
  applyDecision, applyFormalize, applyRecommendationDraft, applyReopen, applySendForDecisions, applyUpdate,
  assignRecommendationIds, citationOccurs, manualAnalysis, newPolicyCase, policyReviewQuestions, sanitizeAnalysis, sanitizeRecommendation, RESPONSIBLE_FALLBACK, type AnalysisDraft,
} from "./service";
import { buildPolicyDocument, changeHeading, renderPolicyExport } from "./export";
import { EQUITY_PRINCIPLES } from "./principles";
import { fetchCatalogSource, hostFamily, htmlToReadableText, truncateSourceText } from "./fetch-source";
import { privateStructuredCall } from "./provider";
import { recommendationDraftSchema } from "./contract";
import { NextRequest } from "next/server";
import { GET as availabilityRoute } from "@/app/api/equity-workspace/policy-analysis/route";
import { GET as listRoute, POST as createRoute } from "@/app/api/equity-workspace/policy-analysis/cases/route";
import { GET as getRoute, PUT as putRoute } from "@/app/api/equity-workspace/policy-analysis/cases/[id]/route";
import { POST as analyzeRoute } from "@/app/api/equity-workspace/policy-analysis/analyze/route";
import { POST as sendRoute } from "@/app/api/equity-workspace/policy-analysis/send-for-decisions/route";
import { POST as decideRoute } from "@/app/api/equity-workspace/policy-analysis/decide/route";
import { POST as formalizeRoute } from "@/app/api/equity-workspace/policy-analysis/formalize/route";
import { POST as reopenRoute } from "@/app/api/equity-workspace/policy-analysis/reopen/route";
import { POST as exportRoute } from "@/app/api/equity-workspace/policy-analysis/export/route";

const CATALOG_ID = "subminimum-wage-annual-reporting-requirement";
const NOW = "2026-11-05T15:00:00.000Z";
const SOURCE_TEXT = "Providers must report annually to the Department about each person they paid a subminimum wage.\nNotices are sent in English only.";
const sources = (): PolicySource[] => [{ id: "source-1", title: "Reporting bulletin", text: SOURCE_TEXT, origin: "user" }];

function draftCase(): PolicyCase {
  return newPolicyCase({ title: "Subminimum wage reporting review", policy: { catalogId: CATALOG_ID, title: "Annual reporting by providers that pay subminimum wages", programs: ["Developmental Disabilities Waiver"] }, sources: sources(), context: "" }, "89deee4a-5edb-4d36-aec5-27119cb03a68", NOW);
}

function recommendation(overrides: Record<string, unknown> = {}) {
  return {
    type: "policy-wording" as const, title: "Offer notices in more languages", change: "Send notices in the languages people use.",
    currentWording: "Notices are sent in English only.", proposedWording: "Notices are sent in the person's preferred language.",
    equityConsideration: "People with limited English cannot act on an English-only notice.", principleIds: ["language-access"],
    evidence: [{ sourceId: "source-1", excerpt: "Notices are sent in English only." }], affectedPolicies: [CATALOG_ID], responsibleRole: "Program manager", effort: "medium" as const, reviewDate: "2027-05-01",
    ...overrides,
  };
}

function analysisDraft(overrides: Partial<AnalysisDraft> = {}): AnalysisDraft {
  return {
    summary: "The policy requires annual reports.",
    answers: policyReviewQuestions().map(question => ({ questionId: question.id, kind: "inference" as const, text: "Reasoned answer.", citations: [] })),
    principles: [], limitations: [], ...overrides,
  };
}

function reviewCase(): PolicyCase {
  const withAnalysis = { ...draftCase(), analysis: sanitizeAnalysis(analysisDraft(), sources(), NOW) };
  return applyRecommendationDraft(withAnalysis, { recommendations: [recommendation(), recommendation({ type: "training", title: "Train staff", currentWording: undefined, proposedWording: undefined })], notes: [] });
}

function toolkitCase(id: string): ToolkitCase {
  const request = toolkitRequestSchema.parse({ title: "Toolkit case", question: "Analyze this internal draft", track: "scan", sources: [{ id: "source-1", title: "Private draft", text: "Synthetic proposal text." }] });
  const result = { summary: "This proposal needs evidence and consultant review.", answers: getQuestions("scan").map(question => ({ questionId: question.id, text: "Further evidence is needed for this question.", kind: "gap" as const, citations: [] })), alternatives: [], actions: [], limitations: ["Community engagement evidence was not supplied."], questionsForReview: ["What engagement evidence is available?"] };
  return { id, version: 1, instrumentVersion: TOOLKIT_VERSION, status: "draft", title: request.title, request, result, createdAt: NOW, updatedAt: NOW, finalizedAt: null } as ToolkitCase;
}

const rowFor = (id: string, version: number, envelope: string, status = "draft"): CaseRow => ({ id, version, status: status as CaseRow["status"], encrypted_payload: envelope, created_at: NOW, updated_at: NOW, finalized_at: null });

beforeEach(() => {
  mocks.rows.clear(); mocks.revisions = []; mocks.owner = true;
  vi.stubEnv("PAC_PUBLIC_ORIGIN", undefined); vi.stubEnv("RAILWAY_DEPLOYMENT_ID", undefined);
  vi.stubEnv("PAC_CONSULTANT_CASE_KEY", randomBytes(32).toString("base64"));
  vi.stubEnv("PAC_CONSULTANT_CASE_PREVIOUS_KEY", undefined);
});

describe("policy case encryption", () => {
  it("round-trips and binds the envelope to case, version and key", () => {
    const key = randomBytes(32), value = draftCase(), envelope = encryptPolicyCase(value, key);
    expect(envelope.startsWith("v1:")).toBe(true);
    expect(envelope).not.toContain("Subminimum");
    expect(decryptPolicyCase(envelope, value.id, 1, key)).toEqual(value);
    expect(decryptPolicyCase(envelope, value.id, 2, key)).toBeNull();
    expect(decryptPolicyCase(envelope, value.id, 1, randomBytes(32))).toBeNull();
    const previous = randomBytes(32);
    expect(decryptPolicyCase(encryptPolicyCase(value, previous), value.id, 1, randomBytes(32), previous)).toEqual(value);
  });

  it("keeps policy and toolkit envelopes apart", () => {
    const key = randomBytes(32), id = "54e64f83-feb9-4ef5-a8bf-47342f8d4a23";
    const policy = { ...draftCase(), id };
    const policyEnvelope = encryptPolicyCase(policy, key);
    const toolkitEnvelope = encryptToolkitCase(toolkitCase(id), key);
    expect(() => decryptToolkitCase(policyEnvelope, id, 1, key)).toThrow();
    expect(decryptPolicyCase(toolkitEnvelope, id, 1, key)).toBeNull();
    expect(caseRowKind(rowFor(id, 1, policyEnvelope), key)).toBe("policy-change");
    expect(caseRowKind(rowFor(id, 1, toolkitEnvelope), key)).toBe("toolkit");
    expect(caseRowKind(rowFor(id, 1, toolkitEnvelope), randomBytes(32))).toBe("unreadable");
    expect(decodeToolkitRowOrSkip(rowFor(id, 1, policyEnvelope), key)).toBeNull();
    expect(decodePolicyRow(rowFor(id, 1, toolkitEnvelope), key)).toBeNull();
    expect(() => decodeToolkitRowOrSkip(rowFor(id, 1, policyEnvelope), randomBytes(32))).toThrow();
    expect(() => decodePolicyRow(rowFor(id, 1, policyEnvelope), randomBytes(32))).toThrow();
  });
});

describe("shared case table", () => {
  it("lists each kind only in its own list and keeps the toolkit working", async () => {
    const policy = await createPolicyCase({ title: "Policy case", policy: { title: "A policy", programs: [] }, sources: sources(), context: "" });
    const toolkitId = "0f0e6a52-1d7c-4f55-9a43-58d3b2b8b0a1";
    const key = Buffer.from(process.env.PAC_CONSULTANT_CASE_KEY!, "base64");
    mocks.rows.set(toolkitId, { ...rowFor(toolkitId, 1, encryptToolkitCase(toolkitCase(toolkitId), key)) });
    expect((await listToolkitCases()).cases.map(item => item.id)).toEqual([toolkitId]);
    expect((await listPolicyCases()).cases.map(item => item.id)).toEqual([policy.id]);
    expect(await getToolkitCase(policy.id)).toBeNull();
    expect(await getPolicyCase(toolkitId)).toBeNull();
    await expect(deletePolicyCase(toolkitId, 1)).rejects.toMatchObject({ code: "not_found" });
    expect(mocks.rows.has(toolkitId)).toBe(true);
    expect(mocks.revisions).toHaveLength(1);
  });

  it("applies changes with optimistic concurrency and mirrors revisions", async () => {
    const created = await createPolicyCase({ title: "Policy case", policy: { title: "A policy", programs: [] }, sources: sources(), context: "" });
    const updated = await mutatePolicyCase(created.id, 1, current => applyUpdate(current, { expectedVersion: 1, context: "Added context" }));
    expect(updated.version).toBe(2);
    expect(updated.context).toBe("Added context");
    await expect(mutatePolicyCase(created.id, 1, current => current)).rejects.toMatchObject({ code: "conflict", status: 409 });
    expect(mocks.revisions).toHaveLength(2);
    await deletePolicyCase(created.id, 2);
    expect(await getPolicyCase(created.id)).toBeNull();
  });
});

describe("citation validation", () => {
  it("keeps verbatim quotations, drops others, and marks evidence without a quotation as missing information", () => {
    const [first, second, third] = policyReviewQuestions();
    const draft = analysisDraft({
      answers: [
        { questionId: first.id, kind: "evidence", text: "Notices are English only.", citations: [{ sourceId: "source-1", excerpt: "Notices are sent in English only." }] },
        { questionId: second.id, kind: "evidence", text: "Invented.", citations: [{ sourceId: "source-1", excerpt: "Notices are sent in twelve languages." }] },
        { questionId: third.id, kind: "inference", text: "Reasoned.", citations: [{ sourceId: "missing-source", excerpt: "Notices are sent in English only." }] },
        { questionId: "unknown-question", kind: "evidence", text: "Ignored.", citations: [] },
      ],
      principles: [
        { principleId: "language-access", kind: "evidence", finding: "English only.", citations: [{ sourceId: "source-1", excerpt: "Notices  are sent in\nEnglish only." }] },
        { principleId: "not-a-principle", kind: "gap", finding: "Dropped.", citations: [] },
      ],
    });
    const analysis = sanitizeAnalysis(draft, sources(), NOW);
    expect(analysis.answers.map(answer => answer.questionId)).toEqual(policyReviewQuestions().map(question => question.id));
    expect(analysis.answers[0]).toMatchObject({ kind: "evidence", citations: [{ excerpt: "Notices are sent in English only." }] });
    expect(analysis.answers[1]).toMatchObject({ kind: "gap", citations: [] });
    expect(analysis.answers[2]).toMatchObject({ kind: "inference", citations: [] });
    expect(analysis.answers[3]).toMatchObject({ kind: "gap", text: "Not yet answered." });
    expect(analysis.principles.map(item => item.principleId)).toEqual(["language-access"]);
    expect(analysis.principles[0].kind).toBe("evidence");
    expect(analysis.limitations.some(item => item.includes("marked as missing information until checked"))).toBe(true);
    expect(analysis.limitations.some(item => item.includes("not answered in this draft"))).toBe(true);
    expect(citationOccurs({ sourceId: "source-1", excerpt: "paid a subminimum wage." }, sources())).toBe(true);
  });

  it("drops unknown catalog and principle ids, unverified current wording, and an office as the responsible party", () => {
    const { value, wordingRemoved } = sanitizeRecommendation(recommendation({ affectedPolicies: [CATALOG_ID, "not-in-catalog"], principleIds: ["language-access", "invented"], currentWording: "Not in any source.", responsibleRole: "Compliance Office", evidence: [{ sourceId: "source-1", excerpt: "made up" }] }), sources());
    expect(value.affectedPolicies).toEqual([CATALOG_ID]);
    expect(value.principleIds).toEqual(["language-access"]);
    expect(value.currentWording).toBeUndefined();
    expect(wordingRemoved).toBe(true);
    expect(value.responsibleRole).toBe(RESPONSIBLE_FALLBACK);
    expect(value.evidence).toEqual([]);
  });
});

describe("recommendation ids", () => {
  it("assigns rec-N ids that never reuse an existing id", () => {
    expect(assignRecommendationIds([], 3)).toEqual(["rec-1", "rec-2", "rec-3"]);
    expect(assignRecommendationIds([{ id: "rec-2" }, { id: "custom" }], 2)).toEqual(["rec-3", "rec-4"]);
  });

  it("keeps decided changes when drafting again and gives new changes fresh ids", () => {
    const review = reviewCase();
    expect(review.status).toBe("review");
    expect(review.recommendations.map(item => item.id)).toEqual(["rec-1", "rec-2"]);
    const decided = applyDecision(review, { recommendationId: "rec-1", outcome: "approved", reason: "Clear benefit." }, "consultant", NOW);
    const again = applyRecommendationDraft(decided, { recommendations: [recommendation({ title: "Another change" })], notes: [] });
    expect(again.recommendations.map(item => item.id)).toEqual(["rec-1", "rec-3"]);
    expect(again.recommendations[0].decision?.outcome).toBe("approved");
  });
});

describe("decisions and formalization", () => {
  it("moves a hand-written draft to review with a minimal analysis", () => {
    const manual = applyUpdate(draftCase(), { expectedVersion: 1, recommendations: [{ id: "rec-1", ...recommendation() }] });
    expect(manual.status).toBe("draft");
    expect(() => applySendForDecisions(draftCase(), NOW)).toThrow(/at least one/);
    const review = applySendForDecisions(manual, NOW);
    expect(review.status).toBe("review");
    expect(review.analysis?.answers.every(answer => answer.kind === "gap" && answer.text === "Not yet answered.")).toBe(true);
    expect(review.analysis?.summary).toMatch(/written by hand/);
    expect(manualAnalysis(NOW).limitations).toHaveLength(1);
  });

  it("records decisions by role, keeps history, and requires a date to defer", () => {
    expect(() => applyDecision(draftCase(), { recommendationId: "rec-1", outcome: "approved", reason: "Yes." }, "team", NOW)).toThrow(/Send the case/);
    const review = reviewCase();
    expect(() => applyDecision(review, { recommendationId: "rec-1", outcome: "deferred", reason: "Later." }, "team", NOW)).toThrow(/date/);
    expect(() => applyDecision(review, { recommendationId: "rec-9", outcome: "approved", reason: "Yes." }, "team", NOW)).toThrowError(expect.objectContaining({ code: "not_found" }));
    const deferred = applyDecision(review, { recommendationId: "rec-1", outcome: "deferred", reason: "Needs budget.", deferredUntil: "2027-01-15" }, "team", NOW);
    const approved = applyDecision(deferred, { recommendationId: "rec-1", outcome: "approved", reason: "Budget found.", deferredUntil: "2027-01-15" }, "consultant", NOW);
    const target = approved.recommendations[0];
    expect(target.decision).toMatchObject({ outcome: "approved", role: "consultant" });
    expect(target.decision?.deferredUntil).toBeUndefined();
    expect(target.history.map(entry => entry.outcome)).toEqual(["deferred", "approved"]);
  });

  it("clears a decision when the change's text is edited, keeping history", () => {
    const decided = applyDecision(reviewCase(), { recommendationId: "rec-1", outcome: "approved", reason: "Yes." }, "team", NOW);
    const { decision: _d, history: _h, ...unchanged } = decided.recommendations[0];
    const same = applyUpdate(decided, { expectedVersion: 1, recommendations: [unchanged, ...decided.recommendations.slice(1).map(({ decision: _x, history: _y, ...rest }) => rest)] });
    expect(same.recommendations[0].decision?.outcome).toBe("approved");
    const edited = applyUpdate(decided, { expectedVersion: 1, recommendations: [{ ...unchanged, change: "A different change." }] });
    expect(edited.recommendations[0].decision).toBeUndefined();
    expect(edited.recommendations[0].history).toHaveLength(1);
    expect(() => applyUpdate(decided, { expectedVersion: 1, recommendations: [{ ...unchanged, currentWording: "Not in the source." }] })).toThrow(/word for word/);
  });

  it("formalizes only when every change is decided and one is approved, then reopens", () => {
    const review = reviewCase();
    const one = applyDecision(review, { recommendationId: "rec-1", outcome: "approved", reason: "Yes." }, "consultant", NOW);
    expect(() => applyFormalize(one, "Proposal", "consultant", NOW)).toThrowError(expect.objectContaining({ code: "transition" }));
    const both = applyDecision(one, { recommendationId: "rec-2", outcome: "rejected", reason: "Not now." }, "team", NOW);
    const final = applyFormalize(both, "Language access proposal", "team", NOW);
    expect(final).toMatchObject({ status: "final", finalizedAt: NOW, formalization: { role: "team", approvedRecommendationIds: ["rec-1"], documentTitle: "Language access proposal", statement: FORMALIZATION_STATEMENT } });
    expect(() => applyDecision(final, { recommendationId: "rec-1", outcome: "rejected", reason: "No." }, "team", NOW)).toThrow(/Reopen/);
    expect(() => applyUpdate(final, { expectedVersion: 1, context: "x" })).toThrow(/Reopen/);
    const reopened = applyReopen(final);
    expect(reopened).toMatchObject({ status: "review", formalization: null, finalizedAt: null });
    expect(reopened.recommendations[0].history).toHaveLength(1);
    expect(() => applyReopen(reopened)).toThrow();
  });
});

describe("exports", () => {
  function finalCase(): PolicyCase {
    const review = reviewCase();
    const decided = applyDecision(applyDecision(review, { recommendationId: "rec-1", outcome: "approved", reason: "Yes.", conditions: "Start with the three most used languages." }, "consultant", NOW), { recommendationId: "rec-2", outcome: "deferred", reason: "After budget.", deferredUntil: "2027-03-01" }, "team", NOW);
    return applyFormalize(decided, "Language access in subminimum wage reporting", "consultant", NOW);
  }

  it("builds every document kind as Word and PDF", async () => {
    const value = finalCase();
    for (const kind of ["analysis", "recommendations", "decision-record", "formal-policy-proposal"] as const) {
      for (const format of ["docx", "pdf"] as const) {
        const file = await renderPolicyExport(value, kind, format);
        expect(file.data.length).toBeGreaterThan(1000);
        expect(file.fileName.endsWith(`.${format}`)).toBe(true);
      }
    }
    const json = await renderPolicyExport(value, "decision-record", "json");
    expect(JSON.parse(json.data.toString("utf8")).id).toBe(value.id);
  }, 120000);

  it("writes plain labels, change names and the formalization statement, without acronyms for the roles", () => {
    const value = finalCase();
    const formal = JSON.stringify(buildPolicyDocument(value, "formal-policy-proposal"));
    expect(formal).toContain(FORMALIZATION_STATEMENT);
    expect(formal).toContain("Equity and Inclusion Operations Consultant");
    expect(formal).toContain("Policy wording change: Offer notices in more languages");
    expect(formal).not.toMatch(/\bAI\b/);
    expect(changeHeading({ type: "procedure", title: "X" })).toBe("Procedure change: X");
    const analysis = JSON.stringify(buildPolicyDocument(value, "analysis"));
    expect(analysis).toContain("Reasoned from the sources");
  });

  it("refuses the formal proposal for a case that is not final", async () => {
    await expect(renderPolicyExport(reviewCase(), "formal-policy-proposal", "docx")).rejects.toMatchObject({ code: "transition", status: 409 });
    await expect(renderPolicyExport(reviewCase(), "formal-policy-proposal", "json")).rejects.toMatchObject({ code: "transition" });
    expect(() => buildPolicyDocument(reviewCase(), "formal-policy-proposal")).toThrow();
  });
});

describe("principles", () => {
  it("lists 8 to 12 principles with sources and no acronyms in titles", () => {
    expect(EQUITY_PRINCIPLES.length).toBeGreaterThanOrEqual(8);
    expect(EQUITY_PRINCIPLES.length).toBeLessThanOrEqual(12);
    for (const principle of EQUITY_PRINCIPLES) {
      expect(principle.source.url.startsWith("https://")).toBe(true);
      expect(`${principle.title} ${principle.plainMeaning} ${principle.source.title}`).not.toMatch(/\b(ADA|CLAS|HCBS|DHS|DSD|LEP|MHRA|AI)\b/);
    }
  });
});

describe("official source fetching", () => {
  it("turns a page into readable text and shortens long text visibly", () => {
    const text = htmlToReadableText("<html><head><style>x{}</style><script>alert(1)</script></head><body><nav>Menu</nav><main><h1>Title &amp; rule</h1><p>First   line.</p><ul><li>Item</li></ul></main></body></html>");
    expect(text).toBe("Title & rule\n\nFirst line.\n\nItem");
    expect(truncateSourceText("a".repeat(500), 200)).toMatch(/shortened here/);
    expect(truncateSourceText("a".repeat(500), 200).length).toBe(200);
    expect(hostFamily("edocs.dhs.state.mn.us")).toBe("state.mn.us");
    expect(hostFamily("www.revisor.mn.gov")).toBe("mn.gov");
  });

  it("fetches only the catalog address and refuses redirects to another site", async () => {
    const page = new Response("<main><h2>Reporting</h2><p>Providers report each year.</p></main>", { headers: { "content-type": "text/html; charset=utf-8" } });
    const fetcher = vi.fn(async () => page);
    const source = await fetchCatalogSource(CATALOG_ID, fetcher as unknown as typeof fetch, new Date(NOW));
    expect(source).toMatchObject({ id: `catalog-${CATALOG_ID}`, origin: "catalog", text: "Reporting\n\nProviders report each year.", note: "Text retrieved from the official source on 2026-11-05." });
    expect((fetcher.mock.calls[0] as unknown[])[0]).toBe(source.url);
    const away = vi.fn(async () => new Response(null, { status: 302, headers: { location: "https://example.com/elsewhere" } }));
    await expect(fetchCatalogSource(CATALOG_ID, away as unknown as typeof fetch)).rejects.toMatchObject({ code: "source_unreadable", status: 502 });
    await expect(fetchCatalogSource("not-a-policy", fetcher as unknown as typeof fetch)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("private drafting adapter", () => {
  it("sends store:false with a strict schema and removes widened nulls before validation", async () => {
    const reply = { recommendations: [{ ...recommendation(), currentWording: null, proposedWording: null, reviewDate: null }], notes: [] };
    const fetcher = vi.fn(async () => Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(reply) }] }] }));
    const value = await privateStructuredCall(recommendationDraftSchema, "test", "synthetic", "system", "user", "key", fetcher as unknown as typeof fetch);
    expect(value.recommendations[0].currentWording).toBeUndefined();
    const body = JSON.parse(String((fetcher.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body.store).toBe(false);
    expect(body.text.format.strict).toBe(true);
  });

  it("never exposes provider failure bodies", async () => {
    const fetcher = vi.fn(async () => new Response("private echo", { status: 400 }));
    await expect(privateStructuredCall(recommendationDraftSchema, "test", "synthetic", "system", "user", "key", fetcher as unknown as typeof fetch)).rejects.toMatchObject({ code: "provider_failed", message: expect.not.stringContaining("private") });
  });
});

describe("routes", () => {
  const BASE = "https://example.test/api/equity-workspace/policy-analysis";
  const post = (path: string, body: unknown, origin = "https://example.test", method = "POST") => new NextRequest(`${BASE}${path}`, { method, headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
  const get = (path: string) => new NextRequest(`${BASE}${path}`);
  const params = (id: string) => ({ params: Promise.resolve({ id }) });

  it("requires a sign-in and a same-origin mutation", async () => {
    mocks.owner = false;
    const denied = await availabilityRoute(get(""));
    expect(denied.status).toBe(401);
    expect((await denied.json()).error).toBe("Sign in to the Consultant Workspace or the One DSD Team to continue.");
    mocks.owner = true;
    const available = await (await availabilityRoute(get(""))).json();
    expect(available).toMatchObject({ role: "consultant", roleLabel: "Equity and Inclusion Operations Consultant", analysisAvailable: false });
    expect((await createRoute(post("/cases", {}, "https://elsewhere.test"))).status).toBe(403);
  });

  it("supports the hand-written path from draft to formal proposal, and reports drafting as unavailable", async () => {
    const created = await createRoute(post("/cases", { title: "Notice review", policy: { catalogId: CATALOG_ID, title: "Annual reporting", programs: [] }, sources: sources() }));
    expect(created.status).toBe(201);
    const value = (await created.json()).case as PolicyCase;
    const unavailable = await analyzeRoute(post("/analyze", { caseId: value.id, expectedVersion: 1, step: "both" }));
    expect(unavailable.status).toBe(503);
    expect(await unavailable.json()).toEqual({ error: "Drafting is not available in this deployment. You can still write the analysis notes and recommended changes yourself and record decisions.", code: "unavailable" });
    const put = await putRoute(post(`/cases/${value.id}`, { expectedVersion: 1, recommendations: [{ id: "rec-1", ...recommendation() }] }, "https://example.test", "PUT"), params(value.id));
    expect(put.status).toBe(200);
    const sent = await sendRoute(post("/send-for-decisions", { caseId: value.id, expectedVersion: 2 }));
    expect((await sent.json()).case.status).toBe("review");
    const stale = await decideRoute(post("/decide", { caseId: value.id, expectedVersion: 2, recommendationId: "rec-1", outcome: "approved", reason: "Yes." }));
    expect(stale.status).toBe(409);
    const decided = await decideRoute(post("/decide", { caseId: value.id, expectedVersion: 3, recommendationId: "rec-1", outcome: "approved", reason: "Yes." }));
    expect((await decided.json()).case.recommendations[0].decision.role).toBe("consultant");
    const early = await exportRoute(post("/export", { caseId: value.id, expectedVersion: 4, kind: "formal-policy-proposal", format: "docx" }));
    expect(early.status).toBe(409);
    const formal = await formalizeRoute(post("/formalize", { caseId: value.id, expectedVersion: 4, documentTitle: "Notice language proposal" }));
    expect((await formal.json()).case.status).toBe("final");
    const file = await exportRoute(post("/export", { caseId: value.id, expectedVersion: 5, kind: "formal-policy-proposal", format: "pdf" }));
    expect(file.status).toBe(200);
    expect(file.headers.get("content-disposition")).toMatch(/^attachment; filename=".+\.pdf"$/);
    expect(file.headers.get("content-security-policy")).toBe("sandbox");
    expect((await file.arrayBuffer()).byteLength).toBeGreaterThan(1000);
    const reopened = await reopenRoute(post("/reopen", { caseId: value.id, expectedVersion: 5 }));
    expect((await reopened.json()).case).toMatchObject({ status: "review", formalization: null, finalizedAt: null });
    const list = await (await listRoute(get("/cases"))).json();
    expect(list.cases[0]).toMatchObject({ id: value.id, version: 6, status: "review", policyTitle: "Annual reporting", catalogId: CATALOG_ID, recommendationCount: 1, approvedCount: 1 });
    expect((await getRoute(get(`/cases/${value.id}`), params(value.id))).status).toBe(200);
    expect((await getRoute(get("/cases/00000000-0000-4000-8000-000000000000"), params("00000000-0000-4000-8000-000000000000"))).status).toBe(404);
  }, 120000);
});
