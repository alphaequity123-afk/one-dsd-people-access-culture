import { describe, expect, it } from "vitest";
import { canonicalizeGeneratedEvidenceClaims, CitedStatementsSchema, GeneratedEvidenceClaimsSchema, resolveCitedStatements, sourceRef } from "./generated-evidence";
import { evidenceReferencesMatch } from "@/lib/content/ask-evidence";
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

describe("citing supplied sources by label", () => {
  const passage = supplied[0].evidence!.excerpt;
  const sources = [supplied[0], { ...supplied[0], id: "no-evidence", evidence: undefined } as unknown as Citation];

  it("labels only sources that carry evidence", () => {
    expect(sourceRef(sources, 0)).toBe("S1");
    expect(sourceRef(sources, 1)).toBeUndefined();
    expect(sourceRef(sources, 5)).toBeUndefined();
  });
  it("attaches the whole supplied passage to a statement, as an inference", () => {
    const statements = [{ text: "Leaders check who gets visible work.", refs: ["S1"] }];
    expect(CitedStatementsSchema.safeParse(statements).success).toBe(true);
    const { claims, dropped } = resolveCitedStatements(statements, sources);
    expect(dropped).toBe(0);
    expect(claims).toEqual([{ kind: "inference", text: "Leaders check who gets visible work.",
      references: [{ evidenceId, start: passage.start, end: passage.start + Array.from(passage.quote).length, quote: passage.quote }] }]);
    expect(evidenceReferencesMatch(claims, [supplied[0].evidence!])).toBe(true);
  });
  it("treats a statement that repeats the passage as a quotation of it", () => {
    const { claims } = resolveCitedStatements([{ text: quote.replace(/[“”]/g, "\"").replace("’", "'").replace("—", "-"), refs: ["s1"] }], sources);
    expect(claims[0].kind).toBe("source_excerpt");
    expect(claims[0].text).toBe(passage.quote);
  });
  it("drops a statement whose labels name no supplied source, and keeps the rest", () => {
    const { claims, dropped } = resolveCitedStatements([
      { text: "Supported.", refs: ["S1", "S9", "S1"] }, { text: "Made up.", refs: ["S7"] }, { text: "No evidence behind it.", refs: ["S2"] }, { text: "", refs: ["S1"] }, "not a statement",
    ], sources);
    expect(claims.map(claim => claim.text)).toEqual(["Supported."]);
    expect(claims[0].references).toHaveLength(1);
    expect(dropped).toBe(4);
  });
  it("still resolves a statement in the earlier format, and drops one that does not match exactly", () => {
    const exact = "a leader doesn’t assume — they check.";
    const start = passage.start + Array.from(quote.slice(0, quote.indexOf("a leader"))).length;
    const { claims, dropped } = resolveCitedStatements([
      { kind: "source_excerpt", text: exact, references: [{ evidenceId, start, end: start + Array.from(exact).length, quote: exact }] },
      { kind: "source_excerpt", text: "a leader does not assume.", references: [{ evidenceId, start: 0, end: 25, quote: "a leader does not assume." }] },
    ], sources);
    expect(claims).toHaveLength(1);
    expect(claims[0].kind).toBe("source_excerpt");
    expect(dropped).toBe(1);
  });
  it("returns nothing for a reply without statements", () => {
    expect(resolveCitedStatements(undefined, sources)).toEqual({ claims: [], dropped: 0 });
    expect(resolveCitedStatements(null, sources)).toEqual({ claims: [], dropped: 0 });
  });
});

