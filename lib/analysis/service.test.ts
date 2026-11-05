// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalysisDraft, AnalysisRequest, Instrument } from "./contract";
import { ANALYSIS_NOTICE, analysisResponseSchema } from "./contract";
import { assertAuditEventPersistence } from "@/lib/trust/work-object-contract";

vi.mock("server-only", () => ({}));

const stubInstrument: Instrument = {
  id: "equity-analysis",
  title: "Equity analysis",
  whatToUpload: "Upload the program description or policy you are reviewing.",
  intro: "Questions about who a program reaches.",
  basis: "Minnesota Department of Human Services equity analysis method.",
  stages: [
    { id: "scope", title: "Scope", questions: [
      { id: "q1", prompt: "Who does the program serve?", help: "Name the groups the document describes." },
      { id: "q2", prompt: "Which counties or regions does it cover?" },
    ] },
    { id: "data", title: "Data", questions: [
      { id: "q3", prompt: "What data does the document rely on?", help: "Look for county data or survey results." },
    ] },
  ],
  guidance: [
    { keywords: ["county data", "county"], label: "Minnesota communities map", href: "/minnesota-communities", why: "County and community pages in this program hold population figures by area." },
    { keywords: ["library", "resource"], label: "Explore Resources", href: "/library", why: "Published resources on the topic." },
    { keywords: ["county"], label: "Minnesota communities map again", href: "/minnesota-communities", why: "Duplicate link to confirm no repeats." },
    { keywords: ["county"], label: "Outside page", href: "https://example.com/county", why: "Must never appear." },
  ],
};

const f = vi.hoisted(() => ({
  cloneAgentsEnabled: vi.fn(),
  contextFor: vi.fn(),
  resolveBinding: vi.fn(),
  runTool: vi.fn(),
  complete: vi.fn(),
}));

vi.mock("./instruments", () => ({ getInstrument: () => stubInstrument }));
vi.mock("@/lib/intelligence/clone/config", () => ({ cloneAgentsEnabled: f.cloneAgentsEnabled }));
vi.mock("@/lib/intelligence/orchestrator", () => ({ contextFor: f.contextFor }));
vi.mock("@/lib/intelligence/providers", () => ({ resolveBinding: f.resolveBinding }));
vi.mock("@/lib/intelligence/tools/runtime", () => ({ runTool: f.runTool }));

import { PROMPT_BYTE_LIMIT, TOO_MUCH_TEXT_MESSAGE, analyze, buildPrompt, effectiveCommunityId, isRefusal, nextSteps, privacyRefusal, promptTooLarge, validateDraft, writeNamesInFull } from "./service";

const sourceText = "The Disability Services Division serves adults with disabilities in Hennepin County.\nServices   are funded through the waiver program.";
const request = (overrides: Partial<AnalysisRequest> = {}): AnalysisRequest => ({
  instrumentId: "equity-analysis",
  sources: [{ id: "doc-1", title: "Program description", text: sourceText }],
  context: "Decide whether the program reaches rural counties.",
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
  f.cloneAgentsEnabled.mockReturnValue(true);
  f.contextFor.mockReturnValue({ trace_id: "f5ba7d21-9571-41e7-839f-75b13e09ba01", agent: { agent_id: "ask_concierge" }, dry_run: false, role: "staff" });
  f.resolveBinding.mockReturnValue({ generative: true, model: { model_id: "mdl_test" }, adapter: { complete: f.complete } });
  f.runTool.mockImplementation((_ctx: unknown, _tool: string, fn: () => unknown) => fn());
});

describe("privacy gate", () => {
  it("refuses a source holding a Social Security number before any model call", async () => {
    const outcome = await analyze(request({ sources: [{ id: "doc-1", title: "Case notes", text: "Applicant SSN 123-45-6789 requested services." }] }));
    expect(isRefusal(outcome)).toBe(true);
    if (isRefusal(outcome)) expect(outcome.message).toContain("social security number");
    expect(f.complete).not.toHaveBeenCalled();
    expect(f.runTool).not.toHaveBeenCalled();
  });
  it("refuses a context holding a personal email address", () => {
    expect(privacyRefusal(request({ context: "Send the result to someone@example.org" }))).toContain("email address");
    expect(privacyRefusal(request())).toBeUndefined();
  });
  it("refuses a source whose only private detail is in its title, with no model call", async () => {
    const outcome = await analyze(request({ sources: [{ id: "doc-1", title: "Case file SSN 123-45-6789.pdf", text: sourceText }] }));
    expect(isRefusal(outcome)).toBe(true);
    if (isRefusal(outcome)) expect(outcome.message).toContain("social security number");
    expect(f.complete).not.toHaveBeenCalled();
    expect(f.runTool).not.toHaveBeenCalled();
  });
  it("refuses a source whose only private detail is in its reading note, with no model call", async () => {
    const outcome = await analyze(request({ sources: [{ id: "doc-1", title: "Program description", text: sourceText, note: "Page 3 names the applicant; reach them at someone@example.org." }] }));
    expect(isRefusal(outcome)).toBe(true);
    if (isRefusal(outcome)) expect(outcome.message).toContain("email address");
    expect(f.complete).not.toHaveBeenCalled();
    expect(f.runTool).not.toHaveBeenCalled();
  });
});

describe("prompt size", () => {
  const filler = (characters: number) => "The program description continues. ".repeat(Math.ceil(characters / 36)).slice(0, characters);
  it("fits a normal request", () => {
    expect(promptTooLarge(request(), stubInstrument)).toBeUndefined();
  });
  it("refuses sources the model adapters would reject for size, before any model call and without echoing content", async () => {
    const sources = [
      { id: "doc-1", title: "Part one", text: filler(45_000) },
      { id: "doc-2", title: "Part two", text: filler(45_000) },
    ];
    const prompt = buildPrompt(stubInstrument, request({ sources }));
    expect(Buffer.byteLength(prompt.system + prompt.user, "utf8")).toBeGreaterThan(PROMPT_BYTE_LIMIT);
    expect(promptTooLarge(request({ sources }), stubInstrument)).toBe(TOO_MUCH_TEXT_MESSAGE);
    const outcome = await analyze(request({ sources }));
    expect(isRefusal(outcome)).toBe(true);
    if (isRefusal(outcome)) expect(outcome.message).toBe(TOO_MUCH_TEXT_MESSAGE);
    expect(f.complete).not.toHaveBeenCalled();
    expect(f.runTool).not.toHaveBeenCalled();
  });
  it("counts bytes, so multi-byte text reaches the limit sooner than its character count suggests", () => {
    // 30,000 characters of a three-byte script is 90,000 bytes, over the limit, while under the per-source character limit.
    const sources = [{ id: "doc-1", title: "Notice", text: "서".repeat(30_000) }];
    expect(promptTooLarge(request({ sources }), stubInstrument)).toBe(TOO_MUCH_TEXT_MESSAGE);
  });
});

describe("validateDraft", () => {
  const draft = (answers: AnalysisDraft["answers"]): AnalysisDraft => ({ summary: "Summary.", answers, limitations: [] });
  it("drops a fabricated excerpt and downgrades evidence to inference", () => {
    const answers = validateDraft(draft([
      { questionId: "q1", kind: "evidence", text: "Adults with disabilities.", citations: [{ sourceId: "doc-1", excerpt: "serves children in every county" }] },
      { questionId: "q2", kind: "evidence", text: "Hennepin County.", citations: [
        { sourceId: "doc-1", excerpt: "in  Hennepin\nCounty." },
        { sourceId: "doc-9", excerpt: "Hennepin County" },
        { sourceId: "doc-1", excerpt: "hennepin county" },
      ] },
      { questionId: "q3", kind: "gap", text: "No county data is cited.", citations: [] },
    ]), request(), stubInstrument);
    expect(answers.map(a => [a.questionId, a.kind, a.citations.length])).toEqual([["q1", "inference", 0], ["q2", "evidence", 1], ["q3", "gap", 0]]);
    expect(answers[1].citations[0].excerpt).toBe("in  Hennepin\nCounty.");
  });
  it("adds gap answers for missing questions, drops unknown questions and keeps instrument order", () => {
    const answers = validateDraft(draft([
      { questionId: "q3", kind: "inference", text: "Waiver data.", citations: [] },
      { questionId: "q-unknown", kind: "evidence", text: "Nothing.", citations: [] },
    ]), request(), stubInstrument);
    expect(answers.map(a => a.questionId)).toEqual(["q1", "q2", "q3"]);
    expect(answers[0]).toEqual({ questionId: "q1", kind: "gap", text: "The sources do not address this.", citations: [] });
    expect(answers[2].kind).toBe("inference");
  });
});

describe("nextSteps", () => {
  it("picks the county map link for a gap mentioning county data, never a duplicate or an outside page", () => {
    const steps = nextSteps(stubInstrument, [
      { questionId: "q1", kind: "evidence", text: "county data everywhere", citations: [] },
      { questionId: "q3", kind: "gap", text: "The document cites no county data.", citations: [] },
      { questionId: "q2", kind: "gap", text: "Not stated; see the county list and the resource library.", citations: [] },
    ]);
    expect(steps[0]).toEqual({ questionId: "q3", label: "Minnesota communities map", href: "/minnesota-communities", why: expect.any(String) });
    expect(steps.map(s => s.href)).toEqual(["/minnesota-communities", "/library"]);
    expect(steps.every(s => s.href.startsWith("/"))).toBe(true);
  });
  it("matches keywords only as whole words, so 'information' and 'explanation' attach no link", () => {
    const instrument: Instrument = {
      ...stubInstrument,
      guidance: [
        { keywords: ["format", "formats", "large print"], label: "Language and access checks", href: "/library/ja-access-checks", why: "Formats and languages." },
        { keywords: ["tribal nation", "nations", "consultation"], label: "Tribal consultation and referral", href: "/learn/tribal-referral", why: "Consultation." },
        { keywords: ["no source", "undated"], label: "Where the figures come from", href: "/community-outreach/sources", why: "Sources." },
        { keywords: ["trust"], label: "Community connections lesson", href: "/learn/community-connections", why: "Trust." },
      ],
    };
    const gap = (questionId: string, text: string) => ({ questionId, kind: "gap" as const, text, citations: [] });
    expect(nextSteps(instrument, [
      gap("q1", "The sources do not give this information."),
      gap("q2", "The document gives no explanation of unintended effects, and the trustee is not named."),
    ])).toEqual([]);
    expect(nextSteps(instrument, [
      gap("q1", "No large-print or audio format is offered."),
      gap("q2", "Consultation with each Tribal Nation is not planned; the figures are undated."),
    ]).map(step => step.href)).toEqual(["/library/ja-access-checks", "/learn/tribal-referral", "/community-outreach/sources"]);
    expect(nextSteps(instrument, [gap("q1", "Trust between the agency and families is not discussed.")]).map(step => step.href)).toEqual(["/learn/community-connections"]);
  });
});

describe("prompt and wording", () => {
  it("writes short forms in full, case-sensitively and only on whole words", () => {
    expect(writeNamesInFull("DHS and DSD fund HCBS; DHSX stays, dhs stays.")).toBe("Department of Human Services and Disability Services Division fund home and community-based services; DHSX stays, dhs stays.");
  });
  it("treats native community pages as no community", () => {
    expect(effectiveCommunityId("tribal-nations")).toBeUndefined();
    expect(effectiveCommunityId("native-american")).toBeUndefined();
    expect(effectiveCommunityId("alaska-native")).toBeUndefined();
    expect(effectiveCommunityId("somali")).toBe("somali");
    const prompt = buildPrompt(stubInstrument, request({ communityId: "tribal-nations" }));
    expect(prompt.user).toContain("COMMUNITY\n(none)");
    expect(prompt.user).toContain("id: q3");
    expect(prompt.user).toContain(sourceText);
    expect(prompt.system).toContain("by role");
    expect(prompt.system).not.toMatch(/\bAI\b/);
  });
});

describe("analyze", () => {
  it("returns unavailable when the binding is not generative", async () => {
    f.resolveBinding.mockReturnValue({ generative: false, model: { model_id: "mdl_fixture_v1" }, adapter: { complete: f.complete } });
    const outcome = await analyze(request());
    expect(isRefusal(outcome)).toBe(false);
    if (isRefusal(outcome)) return;
    expect(outcome.unavailable).toBe(true);
    expect(outcome.answers).toEqual([]);
    expect(outcome.counts).toEqual({ evidence: 0, inference: 0, gap: 0 });
    expect(outcome.notice).toBe(ANALYSIS_NOTICE);
    expect(analysisResponseSchema.safeParse(outcome).success).toBe(true);
    expect(f.complete).not.toHaveBeenCalled();
  });
  it("returns unavailable when the deployment has not opted in", async () => {
    f.cloneAgentsEnabled.mockReturnValue(false);
    const outcome = await analyze(request());
    expect(!isRefusal(outcome) && outcome.unavailable).toBe(true);
    expect(f.resolveBinding).not.toHaveBeenCalled();
  });
  it("validates the draft, counts kinds, adds next steps and audits only the instrument id", async () => {
    f.complete.mockResolvedValue({ parsed: {
      summary: "DSD serves adults in Hennepin County.",
      answers: [
        { questionId: "q1", kind: "evidence", text: "Adults with disabilities, per DHS.", citations: [{ sourceId: "doc-1", excerpt: "serves adults with disabilities" }] },
        { questionId: "q2", kind: "evidence", text: "Hennepin County.", citations: [{ sourceId: "doc-1", excerpt: "made up quotation" }] },
        { questionId: "q3", kind: "gap", text: "No county data is cited.", citations: [] },
      ],
      limitations: ["HCBS funding details are not given."],
    }, model_id: "mdl_test" });
    const outcome = await analyze(request());
    if (isRefusal(outcome)) throw new Error("unexpected refusal");
    expect(analysisResponseSchema.safeParse(outcome).success).toBe(true);
    expect(outcome.unavailable).toBe(false);
    expect(outcome.summary).toBe("Disability Services Division serves adults in Hennepin County.");
    expect(outcome.answers[0].text).toBe("Adults with disabilities, per Department of Human Services.");
    expect(outcome.answers[0].citations[0].excerpt).toBe("serves adults with disabilities");
    expect(outcome.limitations).toEqual(["home and community-based services funding details are not given."]);
    expect(outcome.counts).toEqual({ evidence: 1, inference: 1, gap: 1 });
    expect(outcome.nextSteps).toEqual([{ questionId: "q3", label: "Minnesota communities map", href: "/minnesota-communities", why: expect.any(String) }]);
    expect(f.runTool).toHaveBeenCalledTimes(1);
    expect(f.runTool.mock.calls[0][1]).toBe("answer.structured_draft");
    expect(f.runTool.mock.calls[0][3]).toEqual({ modelId: "mdl_test", contentIds: ["tool-analyze-equity-analysis"] });
    const call = f.complete.mock.calls[0][0];
    expect(call.timeoutMs).toBeLessThanOrEqual(75_000);
    expect(call.maxTokens).toBe(4000);
    expect(call.user).toContain(sourceText);
  });
  it("retries once when the draft does not match the shape, then fails without echoing content", async () => {
    f.complete.mockResolvedValueOnce({ parsed: { nonsense: true } }).mockResolvedValueOnce({ parsed: null });
    await expect(analyze(request())).rejects.toThrow("analysis_draft_invalid");
    expect(f.complete).toHaveBeenCalledTimes(2);
  });
});

describe("audit record", () => {
  it("accepts the analysis content id under the audit persistence rule", () => {
    const event = { trace_id: "f5ba7d21-9571-41e7-839f-75b13e09ba01", span_id: "0123abcd", at: "2026-11-05T00:00:00.000Z", agent_id: "ask_concierge", agent_version: "0.1.0", tool_name: "answer.structured_draft", autonomy_level_used: "A2", permission_mode: "with_preview", dry_run: false, content_ids_touched: ["tool-analyze-equity-analysis"], allowlist_hit: true, model_id: "mdl_test", latency_ms: 12, ok: true };
    expect(() => assertAuditEventPersistence(event)).not.toThrow();
    expect(() => assertAuditEventPersistence({ ...event, content_ids_touched: ["uploaded-document-text"] })).toThrow();
  });
});
