import { describe, expect, it } from "vitest";
import type { Citation } from "./search";
import { buildAnswerEvidenceReview, evidenceRepairInstruction, parseAnswerEvidenceReview } from "./answer-review";

const sources = [
  { id: "contact", title: "DSD contacts and Disability Hub MN", href: "/contacts", authorityLabel: "Program information", excerpt: "Contact DSD or Disability Hub MN.", evidence: undefined },
  { id: "ada", title: "Effective communication", href: "/readings/ada", authorityLabel: "DOJ guidance", evidence: {
    evidenceId: "a".repeat(64), revisions: [{ sourceId: "ada", revisionId: "v2", payloadHash: "b".repeat(64), scope: "dsd" }],
    excerpt: { start: 50, end: 250, quote: "A minor child may interpret only in an emergency involving an imminent threat to safety or welfare when no qualified interpreter is available." },
  }, sourceContext: { note: "Reviewed source status", sourceUrl: "https://www.ada.gov/resources/effective-communication/", checkedAt: "2026-11-13" } },
] as unknown as Citation[];
const publicSources = [{ title: "PACER areas of focus", url: "https://www.pacer.org/about/areas-of-focus/", domain: "www.pacer.org", snippet: "PACER offers support to families of children and young adults with disabilities." }];

describe("evidence-aware final answer review contract", () => {
  it("supplies the real main narrative, claim refs, full qualifications and export text to one reviewer", () => {
    const draft = { shortAnswer: "Children may interpret in emergencies.", evidenceClaims: [{ text: "PACER helps with transitions.", refs: ["S2"] }], workProduct: { sections: [{ paragraphs: ["See https://info-oneculture.mn.gov/briefs/water"] }] } };
    const result = buildAnswerEvidenceReview({ question: "Explain every condition and provide a guide.", draft, sources, sourceOnly: true });
    const payload = JSON.parse(result.user);
    expect(payload.proposedAnswer).toEqual(draft);
    expect(payload.programSources[1].ref).toBe("S2");
    expect(payload.programSources[1].exactPassage).toContain("imminent threat");
    expect(payload.programSources[1].exactPassage).toContain("no qualified interpreter");
    expect(payload.programSources[1].sourceContext.note).toBe("Reviewed source status");
    expect(payload.programSources[0].ref).toBeUndefined();
    expect(payload.programSources[0].navigationSummary).toContain("Contact DSD");
  });

  it("enforces only supplied program and public reference labels in review corrections", () => {
    const request = buildAnswerEvidenceReview({ question: "PACER?", draft: {}, sources, sourceOnly: false, research: { status: "used", answer: "Provider's synthesis", sources: publicSources } });
    const checks = { unitChecks: [], qualificationChecks: [{ id: "Q1", assessment: "not_applicable", answerQuotes: [], reason: "The ADA condition is outside the PACER question." }] };
    const issue = { location: "evidenceClaims[0]", problem: "wrong_reference", explanation: "The ADA passage does not establish PACER services.", sourceRefs: ["P1"] };
    expect(request.schema.safeParse({ ...checks, verdict: "revise", issues: [issue] }).success).toBe(true);
    expect(request.schema.safeParse({ ...checks, verdict: "revise", issues: [{ ...issue, sourceRefs: ["S1"] }] }).success).toBe(false);
    expect(request.schema.safeParse({ ...checks, verdict: "revise", issues: [{ ...issue, sourceRefs: ["https://invented.gov"] }] }).success).toBe(false);
    expect(JSON.parse(request.user).publicResearch.sources[0].snippet).toContain("families");
  });

  it("excludes outside research and its labels when the user chooses application-only sources", () => {
    const request = buildAnswerEvidenceReview({ question: "Use only application readings.", draft: {}, sources, sourceOnly: true, research: { status: "used", answer: "Outside claim", sources: publicSources } });
    expect(JSON.parse(request.user).publicResearch).toBeUndefined();
    expect(request.user).not.toContain("Outside claim");
    expect(request.schema.safeParse({ verdict: "revise", issues: [{ location: "shortAnswer", problem: "source_boundary", explanation: "Unsupported outside attribution.", sourceRefs: ["P1"] }] }).success).toBe(false);
  });

  it("can review general answers without fabricating reference labels", () => {
    const request = buildAnswerEvidenceReview({ question: "Why are there seasons?", draft: { shortAnswer: "Earth's axial tilt changes sunlight." }, sources: [], sourceOnly: false });
    const checks = { unitChecks: [{ id: "U1", assessment: "general_knowledge", sourceQuotes: [], finding: "This is stable general knowledge." }], qualificationChecks: [] };
    expect(request.schema.safeParse({ ...checks, verdict: "pass", issues: [] }).success).toBe(true);
    expect(request.schema.safeParse({ ...checks, verdict: "revise", issues: [{ location: "shortAnswer", problem: "unsupported_claim", explanation: "Review finding", sourceRefs: ["S1"] }] }).success).toBe(false);
  });

  it("does not accept a pass that simultaneously reports missing policy conditions", () => {
    const review = parseAnswerEvidenceReview({ verdict: "pass", issues: [{ location: "shortAnswer", problem: "missing_qualification", explanation: "Include imminent threat and no qualified interpreter available.", sourceRefs: ["S2"] }] });
    expect(review.verdict).toBe("revise");
    expect(evidenceRepairInstruction(review)).toContain("imminent threat");
    expect(evidenceRepairInstruction(review)).toContain("complete requested writer JSON");
  });

  it("rejects empty revision findings rather than pretending the review passed", () => {
    expect(() => parseAnswerEvidenceReview({ verdict: "revise", issues: [] })).toThrow("evidence_review_empty_revision");
  });

  it("fails explicitly when the whole evidence package cannot fit instead of cutting an exception", () => {
    expect(() => buildAnswerEvidenceReview({ question: "Review", draft: { shortAnswer: "x".repeat(210_000) }, sources, sourceOnly: true })).toThrow("evidence_review_input_too_large");
  });

  it("does not generate repair work after a clean review", () => {
    expect(evidenceRepairInstruction({ verdict: "pass", issues: [] })).toBe("");
  });
});
