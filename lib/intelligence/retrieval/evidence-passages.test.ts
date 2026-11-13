import { describe, expect, it } from "vitest";
import { evidenceReferencesMatch } from "@/lib/content/ask-evidence";
import { citationEvidenceFromDocs, referencedEvidenceSources, validateEvidenceClaims } from "./evidence";
import { evidencePassages } from "./evidence-passages";
import { canonicalizeGeneratedEvidenceClaims, resolveCitedStatements } from "./generated-evidence";
import { sourceReadingDocs } from "./source-reading-docs";
import { searchDocs, type Doc } from "./search";

describe("complete citable source passages", () => {
  it("supplies both companion definitions and all interpreter conditions from the actual ADA reading", async () => {
    const docs = await sourceReadingDocs();
    const doc = docs.find(item => item.id === "asset-source-reading-229c48a437e8a56b030c-4")!;
    const question = "What does the ADA Effective Communication reading say about companions and auxiliary aids?";
    const sources = citationEvidenceFromDocs(searchDocs(question, [doc]), [doc], { question });
    expect(sources.length).toBeGreaterThan(1);
    const quotes = sources.map(source => source.evidence!.excerpt.quote);
    expect(quotes.some(quote => quote.includes("family member, friend, or associate"))).toBe(true);
    expect(quotes.some(quote => quote.includes("imminent threat to the safety or welfare") && quote.includes("only when a qualified interpreter is not available"))).toBe(true);
    expect(quotes.some(quote => quote.includes("the individual requests this") && quote.includes("the accompanying adult agrees") && quote.includes("appropriate under the circumstances") && quote.includes("This exception does not apply to minor children"))).toBe(true);
    expect(quotes.some(quote => quote.includes("reason to doubt the person’s impartiality or effectiveness"))).toBe(true);
    expect(quotes.every(quote => quote.length <= 1500 && doc.text.includes(quote))).toBe(true);
    const selected = quotes.findIndex(quote => quote.includes("only when a qualified interpreter is not available"));
    const statement = { text: "An accompanying adult or child may interpret only in an imminent-threat emergency when a qualified interpreter is unavailable.", refs: [`S${selected + 1}`] };
    const { claims } = resolveCitedStatements([statement], sources);
    expect(validateEvidenceClaims(claims, sources, [doc])).toEqual(claims);
    expect(claims[0].references[0].quote).toContain("imminent threat to the safety or welfare");
    expect(claims[0].references[0].quote).toContain("only when a qualified interpreter is not available");
    expect(referencedEvidenceSources(claims, sources)).toEqual([sources[selected]]);
  });

  it("retains separate exact windows of one source and rejects changed or withdrawn publications", () => {
    const doc: Doc = { id: "conditions", kind: "content", title: "Eligibility policy", href: "/policy/conditions", authority: "official", type: "policy", status: "published", scope: "dsd", reviewDate: "", summary: "Eligibility conditions.", tags: [], intents: [],
      text: "A person may use the service only after documented consent. " + "General explanatory context remains relevant. ".repeat(45) + "An emergency exception applies only if delay threatens immediate safety. An adviser’s approval is still required. 😀" };
    const question = "Eligibility consent emergency conditions approval";
    const sources = citationEvidenceFromDocs(searchDocs(question, [doc]), [doc], { question });
    expect(sources.length).toBeGreaterThan(1);
    expect(new Set(sources.map(source => source.evidence!.evidenceId)).size).toBe(1);
    const { claims } = resolveCitedStatements(sources.map((source, index) => ({ text: source.evidence!.excerpt.quote, refs: [`S${index + 1}`] })), sources);
    expect(evidenceReferencesMatch(claims, sources.map(source => source.evidence!))).toBe(true);
    expect(validateEvidenceClaims(claims, sources, [doc])).toEqual(claims);
    expect(canonicalizeGeneratedEvidenceClaims(claims, sources)).toEqual(claims);
    expect(() => validateEvidenceClaims(claims, sources, [{ ...doc, text: doc.text + " Revised." }])).toThrow("generated_evidence_rejected");
    expect(() => validateEvidenceClaims(claims, sources, [])).toThrow("generated_evidence_rejected");
    const forged = claims.map(claim => ({ ...claim, references: claim.references.map(reference => ({ ...reference, quote: reference.quote.replace("only", "also") })) }));
    expect(() => validateEvidenceClaims(forged, sources, [doc])).toThrow();
  });

  it("reserves qualifying passages for lead matches when fourteen long documents compete for context", async () => {
    const actual = (await sourceReadingDocs()).find(item => item.id === "asset-source-reading-229c48a437e8a56b030c-4")!;
    const docs = Array.from({ length: 14 }, (_, index) => index === 1 ? actual : { ...actual, id: `other-${index}`, title: `Other relevant resource ${index}`, href: `/other-${index}`, text: "This long resource explains related background for communication planning. ".repeat(45) });
    const question = "What does the ADA Effective Communication reading say about companions and auxiliary aids?";
    const hits = docs.map(doc => ({ ...searchDocs(question, [actual])[0], id: doc.id, href: doc.href, title: doc.title, excerpt: doc.text.slice(0, 100) }));
    const sources = citationEvidenceFromDocs(hits, docs, { question });
    expect(sources.reduce((sum, source) => sum + source.evidence!.excerpt.quote.length, 0)).toBeLessThanOrEqual(18_000);
    expect(new Set(sources.map(source => source.id)).size).toBeGreaterThanOrEqual(8);
    const quotes = sources.filter(source => source.id === actual.id).map(source => source.evidence!.excerpt.quote);
    expect(quotes.length).toBeGreaterThan(1);
    expect(quotes.some(quote => quote.includes("imminent threat to the safety or welfare") && quote.includes("only when a qualified interpreter is not available"))).toBe(true);
    expect(quotes.some(quote => quote.includes("the individual requests this") && quote.includes("This exception does not apply to minor children"))).toBe(true);
  });

  it("keeps whole sentences, honors the shared budget, and does not fabricate a shortened rule", () => {
    const text = "The agency reviews the request. " + "Background about available options. ".repeat(60) + "An exception requires consent and approval. The standard rule still applies otherwise.";
    const passages = evidencePassages(text, "exception consent approval", "Policy", 3, 500);
    expect(passages.every(quote => quote.length <= 500 && text.includes(quote) && /[.!?]$/.test(quote))).toBe(true);
    expect(passages.some(quote => quote.includes("An exception requires consent and approval."))).toBe(true);
    expect(evidencePassages("A".repeat(2000), "rule")).toEqual([]);
    const doc: Doc = { id: "budget", kind: "content", title: "Policy", href: "/policy", authority: "official", type: "policy", status: "published", scope: "dsd", reviewDate: "", summary: "Policy", text, tags: [], intents: [] };
    const sources = citationEvidenceFromDocs(searchDocs("exception consent approval", [doc]), [doc], { question: "exception consent approval", totalChars: 1600 });
    expect(sources.reduce((sum, source) => sum + source.evidence!.excerpt.quote.length, 0)).toBeLessThanOrEqual(1600);
  });
});
