import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { EvidenceClaimsSchema } from "@/lib/content/ask-evidence";
import { canonicalizeGeneratedEvidenceClaims, GeneratedEvidenceClaimsSchema } from "../retrieval/generated-evidence";
import { evidenceForDoc, validateEvidenceClaims } from "../retrieval/evidence";
import type { Citation, Doc } from "../retrieval/search";

const doc: Doc = { kind: "content", id: "ref-test-pdf-page-3", title: "Public guide — PDF page 3", href: "/documents/test.pdf#page=3",
  authority: "guidance", type: "reference", status: "approved", reviewDate: "", scope: "agencywide", summary: "",
  text: "Plan access 🙂 with transportation, childcare, and interpretation.", tags: [], intents: [] };
const source: Citation = { id: doc.id, title: doc.title, href: doc.href, authority: doc.authority, authorityLabel: "Guidance", reviewDate: "",
  excerpt: doc.text, citeable: true, evidence: evidenceForDoc(doc, doc.text) };
const fullClaim = () => ({ kind: "source_excerpt" as const, text: source.evidence!.excerpt.quote,
  references: [{ evidenceId: source.evidence!.evidenceId, ...source.evidence!.excerpt }] });

describe("generated evidence coordinate resolution", () => {
  it("repairs only numeric coordinates for an exact supplied quote then passes unchanged strict validation", () => {
    const claim = fullClaim(); claim.references[0].start = 1; claim.references[0].end = 2;
    expect(EvidenceClaimsSchema.safeParse([claim]).success).toBe(false);
    expect(GeneratedEvidenceClaimsSchema.safeParse([claim]).success).toBe(true);
    const canonical = canonicalizeGeneratedEvidenceClaims([claim], [source]);
    expect(canonical).toEqual([fullClaim()]);
    expect(validateEvidenceClaims(canonical, [source], [doc])).toEqual(canonical);
  });
  it("resolves a unique exact subquote using Unicode coordinates", () => {
    const quote = "with transportation, childcare";
    const claim = { kind: "inference", text: "Plan participation supports.", references: [{ evidenceId: source.evidence!.evidenceId, start: 0, end: 1, quote }] };
    const canonical = canonicalizeGeneratedEvidenceClaims([claim], [source]);
    expect(canonical[0].references[0].start).toBe(source.evidence!.excerpt.start + Array.from("Plan access 🙂 ").length);
    expect(validateEvidenceClaims(canonical, [source], [doc])).toEqual(canonical);
  });
  it.each(["unknown-id", "altered-quote", "mismatched-excerpt-text", "invalid-number", "extra-field"])("rejects %s instead of silently normalizing it", change => {
    const claim = fullClaim() as ReturnType<typeof fullClaim> & { references: { approved?: boolean }[] };
    if (change === "unknown-id") claim.references[0].evidenceId = "0".repeat(64);
    if (change === "altered-quote") claim.text = claim.references[0].quote = doc.text.replace("childcare", "housing");
    if (change === "mismatched-excerpt-text") claim.text = "An invented quotation.";
    if (change === "invalid-number") claim.references[0].start = -1;
    if (change === "extra-field") claim.references[0].approved = true;
    expect(() => canonicalizeGeneratedEvidenceClaims([claim], [source])).toThrow();
  });
  it("rejects a repeated subquote whose location is ambiguous", () => {
    const repeatedDoc = { ...doc, text: "Access matters. Access matters." };
    const repeated = { ...source, evidence: evidenceForDoc(repeatedDoc, repeatedDoc.text) };
    const claim = { kind: "inference", text: "Consider access.", references: [{ evidenceId: repeated.evidence.evidenceId, start: 0, end: 1, quote: "Access matters." }] };
    expect(() => canonicalizeGeneratedEvidenceClaims([claim], [repeated])).toThrow("generated_evidence_rejected");
  });
  it("preserves an already-valid repeated quote without guessing a different occurrence", () => {
    const repeatedDoc = { ...doc, text: "Access matters. Access matters." };
    const repeated = { ...source, evidence: evidenceForDoc(repeatedDoc, repeatedDoc.text) };
    const quote = "Access matters.";
    const start = repeated.evidence.excerpt.start + Array.from(repeatedDoc.text.slice(0, repeatedDoc.text.lastIndexOf(quote))).length;
    const claim = { kind: "inference", text: "Consider access.", references: [{ evidenceId: repeated.evidence.evidenceId, start, end: start + Array.from(quote).length, quote }] };
    const canonical = canonicalizeGeneratedEvidenceClaims([claim], [repeated]);
    expect(canonical).toEqual([claim]);
    expect(validateEvidenceClaims(canonical, [repeated], [repeatedDoc])).toEqual(canonical);
  });
  it("still rejects stale or withdrawn evidence at the unchanged fresh-document validation boundary", () => {
    const claim = fullClaim(); claim.references[0].start = 1; claim.references[0].end = 2;
    const canonical = canonicalizeGeneratedEvidenceClaims([claim], [source]);
    expect(() => validateEvidenceClaims(canonical, [source], [{ ...doc, text: doc.text + " Revised." }])).toThrow("generated_evidence_rejected");
    expect(() => validateEvidenceClaims(canonical, [source], [])).toThrow("generated_evidence_rejected");
  });
});
