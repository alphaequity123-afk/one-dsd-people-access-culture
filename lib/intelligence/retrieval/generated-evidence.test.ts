import { describe, expect, it } from "vitest";
import { canonicalizeGeneratedEvidenceClaims, GeneratedEvidenceClaimsSchema } from "./generated-evidence";
import type { Citation } from "./search";

const quote = "In the common scenario “Who gets the visible work?,” a leader doesn’t assume — they check.";
const evidenceId = "a".repeat(64);
const supplied = [{ id: "leadership-pathway-style-servant", evidence: { version: 1, evidenceId, documentId: "leadership-pathway-style-servant", contentHash: "b".repeat(64), revisions: [{ sourceId: "leadership-pathway-style-servant", revisionId: null, payloadHash: "c".repeat(64), scope: "dsd" }], excerpt: { start: 40, end: 40 + Array.from(quote).length, quote } } }] as unknown as Citation[];
const claim = (text: string) => [{ kind: "source_excerpt", text, references: [{ evidenceId, start: 0, end: Array.from(text).length, quote: text }] }];

describe("generated evidence canonicalization", () => {
  it("resolves a quote retyped with plain quotation marks and dashes to the source's own characters", () => {
    const [resolved] = canonicalizeGeneratedEvidenceClaims(claim("a leader doesn't assume - they check."), supplied);
    expect(resolved.text).toBe("a leader doesn’t assume — they check.");
    expect(resolved.references[0].quote).toBe("a leader doesn’t assume — they check.");
    expect(resolved.references[0].start).toBe(40 + Array.from(quote.slice(0, quote.indexOf("a leader"))).length);
  });
  it("still rejects any other difference in wording", () => {
    expect(() => canonicalizeGeneratedEvidenceClaims(claim("a leader does not assume - they check."), supplied)).toThrow("generated_evidence_rejected");
  });
  it("keeps exact quotes unchanged", () => {
    const [resolved] = canonicalizeGeneratedEvidenceClaims(claim("“Who gets the visible work?,”"), supplied);
    expect(resolved.references[0].quote).toBe("“Who gets the visible work?,”");
    expect(resolved.kind).toBe("source_excerpt");
  });

  // Live 2026-11-04 and 2026-11-06: a paraphrase labeled source_excerpt failed the transport
  // schema, which forced a full rewrite (ask_format_retry) or lost the answer entirely.
  const exact = "a leader doesn’t assume — they check.";
  const exactRef = { evidenceId, start: 40 + Array.from(quote.slice(0, quote.indexOf("a leader"))).length, end: 0, quote: exact };
  exactRef.end = exactRef.start + Array.from(exact).length;
  it("accepts a paraphrased source excerpt in the writer's reply format", () => {
    const paraphrase = [{ kind: "source_excerpt", text: "Leaders check rather than assume.", references: [exactRef] }];
    expect(GeneratedEvidenceClaimsSchema.safeParse(paraphrase).success).toBe(true);
  });
  it("keeps a paraphrase with its exact passage as an inference, not a quotation", () => {
    const [resolved] = canonicalizeGeneratedEvidenceClaims([{ kind: "source_excerpt", text: "Leaders check rather than assume.", references: [exactRef] }], supplied);
    expect(resolved.kind).toBe("inference");
    expect(resolved.text).toBe("Leaders check rather than assume.");
    expect(resolved.references).toEqual([exactRef]);
  });
  it("labels an excerpt with more than one passage as an inference", () => {
    const [resolved] = canonicalizeGeneratedEvidenceClaims([{ kind: "source_excerpt", text: exact, references: [exactRef, exactRef] }], supplied);
    expect(resolved.kind).toBe("inference");
  });
  it("still rejects a paraphrase whose passage is not in the supplied text", () => {
    const invented = { evidenceId, start: 0, end: 12, quote: "never checks" };
    expect(() => canonicalizeGeneratedEvidenceClaims([{ kind: "source_excerpt", text: "Leaders never check.", references: [invented] }], supplied)).toThrow("generated_evidence_rejected");
  });
});
