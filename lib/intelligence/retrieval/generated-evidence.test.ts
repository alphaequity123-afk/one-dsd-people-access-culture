import { describe, expect, it } from "vitest";
import { canonicalizeGeneratedEvidenceClaims } from "./generated-evidence";
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
  });
});
