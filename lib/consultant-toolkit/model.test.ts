import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ADAPTED_SCAN, FULL_ANALYSIS, getQuestions, recommendTrack, TOOLKIT_VERSION } from "./instrument";
import { casePayloadSchema, toolkitCaseSchema, toolkitRequestSchema, toolkitResponseSchema, validateToolkitResponse, type ToolkitResponse } from "./schema";

function request(track: "scan" | "full" = "scan") {
  return toolkitRequestSchema.parse({ title: "Appointment access", question: "Review the proposed appointment process.", track,
    sources: [{ id: "source-1", title: "Supplied proposal", text: "The proposal offers telephone appointments. Community engagement has not yet occurred." }] });
}
function response(track: "scan" | "full" = "scan"): ToolkitResponse {
  return { summary: "The supplied proposal needs further evidence and community input.",
    answers: getQuestions(track).map(question => ({ questionId: question.id, text: "The supplied material does not establish this. Confirm with the process owner.", kind: "gap", citations: [] })),
    alternatives: [], actions: [{ action: "Invite affected people to review the proposed appointment process.", responsibleRole: "Process owner to confirm", dueDate: "To agree", resources: "Accessible participation support to confirm", measure: "Document which perspectives influenced the proposal.", followUp: "Review before making the final decision." }],
    limitations: ["The supplied document contains no completed community engagement findings."], questionsForReview: ["Who should participate before the proposal is settled?"] };
}

describe("consultant toolkit evidence contract", () => {
  it("can produce a closed JSON schema for structured generation", () => {
    const schema = z.toJSONSchema(toolkitResponseSchema);
    expect(schema.type).toBe("object");
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toContain("answers");
  });
  it("keeps complete full and scan instruments distinct with explicit adapted provenance", () => {
    expect(FULL_ANALYSIS.stages).toHaveLength(6);
    expect(FULL_ANALYSIS.stages[4].title).toBe("Implementation");
    expect(getQuestions("full")).toHaveLength(34);
    expect(getQuestions("scan")).toHaveLength(10);
    expect(ADAPTED_SCAN.authorityNote).toContain("not a reproduction");
    expect(new Set(getQuestions("full").map(q => q.id)).size).toBe(34);
  });
  it("accepts complete explicit gaps without inventing evidence", () => {
    const input = request("full");
    input.sources = [];
    expect(validateToolkitResponse(input, response("full")).answers).toHaveLength(34);
  });
  it("accepts exact quotations and preserves evidence classification", () => {
    const result = response();
    result.answers[0] = { questionId: "prep-1", kind: "evidence", text: "Community engagement has not yet occurred in the supplied proposal.", citations: [{ sourceId: "source-1", excerpt: "Community engagement has not yet occurred." }] };
    expect(validateToolkitResponse(request(), result).answers[0].kind).toBe("evidence");
  });
  it("rejects fabricated quotations, unknown sources, and unsupported evidence", () => {
    for (const citations of [
      [{ sourceId: "source-1", excerpt: "Community engagement is complete." }],
      [{ sourceId: "source-not-supplied", excerpt: "Community engagement has not yet occurred." }],
      [],
    ]) {
      const result = response();
      result.answers[0] = { questionId: "prep-1", kind: "evidence", text: "Engagement is complete.", citations };
      expect(() => validateToolkitResponse(request(), result)).toThrow();
    }
  });
  it("rejects duplicate source IDs even when their texts differ", () => {
    const input = request();
    input.sources.push({ id: "source-1", title: "Different document", text: "Another claim." });
    expect(toolkitRequestSchema.safeParse(input).success).toBe(false);
  });
  it("preserves explicit source origin without relabeling older supplied evidence", () => {
    const input = request();
    expect(input.sources[0].origin).toBeUndefined();
    input.sources.push({ id: "program-context-1", title: "Published reference", text: "Current program guidance.", origin: "application-context" });
    const parsed = toolkitRequestSchema.parse(input);
    expect(parsed.sources[1].origin).toBe("application-context");
    expect(toolkitRequestSchema.safeParse({ ...input, sources: [{ ...input.sources[0], origin: "official-certified" }] }).success).toBe(false);
  });
  it("rejects missing, duplicated, and unrelated answers", () => {
    const missing = response(); missing.answers.pop();
    const duplicate = response(); duplicate.answers[1] = duplicate.answers[0];
    const unrelated = response(); unrelated.answers[0].questionId = "full-1-1";
    for (const result of [missing, duplicate, unrelated]) expect(() => validateToolkitResponse(request(), result)).toThrow();
  });
  it("requires limitations for evidence gaps and rejects report markup", () => {
    const noLimits = response(); noLimits.limitations = [];
    expect(() => validateToolkitResponse(request(), noLimits)).toThrow();
    for (const summary of ["## Approved", "**No disparity**", "<script>alert(1)</script>", "[source](https://example.org)", "- Reviewed"]) {
      expect(() => validateToolkitResponse(request(), { ...response(), summary })).toThrow();
    }
  });
  it("does not treat time pressure as automatic scan permission", () => {
    const routing = { priorAnalysisIntegrated: false, materialChange: false, knownDisparities: false, timeLimited: true };
    expect(recommendTrack(routing).track).toBe("full");
    expect(recommendTrack(routing).advisoryOnly).toBe(true);
    expect(recommendTrack({ ...routing, priorAnalysisIntegrated: true }).track).toBe("scan");
    expect(recommendTrack({ ...routing, priorAnalysisIntegrated: true, knownDisparities: true }).track).toBe("full");
  });
  it("validates persisted evidence and prevents a final case without an analysis", () => {
    const input = request(); const result = response();
    expect(casePayloadSchema.safeParse({ request: input, result }).success).toBe(true);
    result.answers[0].citations.push({ sourceId: "other-case-source", excerpt: "Secret source" });
    expect(casePayloadSchema.safeParse({ request: input, result }).success).toBe(false);
    expect(toolkitCaseSchema.safeParse({ id: "case-1", version: 1, status: "final", title: input.title,
      request: input, result: null, createdAt: "2026-10-15T15:00:00.000Z", updatedAt: "2026-10-15T15:00:00.000Z", finalizedAt: "2026-10-15T15:00:00.000Z" }).success).toBe(false);
  });
  it("pins the instrument version and rejects an unsupported saved instrument", () => {
    const input = request();
    const value = { id: "case-1", version: 1, status: "draft", title: input.title, request: input, result: null,
      createdAt: "2026-10-15T15:00:00.000Z", updatedAt: "2026-10-15T15:00:00.000Z", finalizedAt: null };
    expect(toolkitCaseSchema.parse(value).instrumentVersion).toBe(TOOLKIT_VERSION);
    const incompatible = toolkitCaseSchema.safeParse({ ...value, instrumentVersion: "unsupported-version" });
    expect(incompatible.success).toBe(false);
    if (!incompatible.success) expect(incompatible.error.issues[0].message).toContain("compatible version");
  });
});
