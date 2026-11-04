import "server-only";
import { z } from "zod";
import { EvidenceClaimSchema, EvidenceClaimsSchema, EvidenceReferenceSchema, type EvidenceClaim } from "@/lib/content/ask-evidence";
import type { Citation } from "./search";

// Model transport keeps every reference field and bound. Only the relationship
// between its numeric offsets and exact quote is deferred to server resolution.
const TransportReferenceSchema = z.object(EvidenceReferenceSchema.shape).strict();
export const GeneratedEvidenceClaimsSchema = z.array(EvidenceClaimSchema.safeExtend({
  references: z.array(TransportReferenceSchema).min(1).max(4),
})).max(12);

// One plain character for each typographic mark, so offsets are unchanged.
const TYPOGRAPHY: Record<string, string> = {
  "\u201C": "\"", "\u201D": "\"", "\u201E": "\"", "\u201F": "\"", "\u2033": "\"", "\u00AB": "\"", "\u00BB": "\"",
  "\u2018": "'", "\u2019": "'", "\u201A": "'", "\u201B": "'", "\u2032": "'",
  "\u2010": "-", "\u2011": "-", "\u2012": "-", "\u2013": "-", "\u2014": "-", "\u2015": "-", "\u2212": "-",
  "\u00A0": " ", "\u202F": " ", "\u2009": " ",
};
function plainTypography(text: string): string {
  return Array.from(text, character => TYPOGRAPHY[character] ?? character).join("");
}

/** Resolve coordinates from exact, unambiguous supplied text; never repair IDs. A quote
 * that differs only in typographic marks resolves to the source's exact characters. */
export function canonicalizeGeneratedEvidenceClaims(value: unknown, supplied: Citation[]): EvidenceClaim[] {
  const claims = GeneratedEvidenceClaimsSchema.parse(value ?? []);
  const snapshots = new Map(supplied.flatMap(source => source.evidence ? [[source.evidence.evidenceId, source.evidence] as const] : []));
  const canonical = claims.map(claim => ({ ...claim, references: claim.references.map(reference => {
    const snapshot = snapshots.get(reference.evidenceId);
    if (!snapshot) throw new Error("generated_evidence_rejected");
    const sourceText = snapshot.excerpt.quote;
    const characters = Array.from(sourceText);
    const relativeStart = reference.start - snapshot.excerpt.start;
    const relativeEnd = reference.end - snapshot.excerpt.start;
    // Preserve references the existing exact-span validator already accepts,
    // even if identical words occur elsewhere in the supplied excerpt.
    if (relativeStart >= 0 && relativeEnd <= characters.length && relativeEnd > relativeStart
      && characters.slice(relativeStart, relativeEnd).join("") === reference.quote) return reference;
    const offset = sourceText.indexOf(reference.quote);
    if (offset >= 0) {
      if (sourceText.indexOf(reference.quote, offset + 1) !== -1) throw new Error("generated_evidence_rejected");
      const start = snapshot.excerpt.start + Array.from(sourceText.slice(0, offset)).length;
      return { ...reference, start, end: start + Array.from(reference.quote).length };
    }
    // Writers often retype curly quotation marks, apostrophes and dashes as plain
    // keyboard characters. Find the one passage that differs only in those marks and
    // cite the source's own characters; any other difference is still rejected.
    const plainSource = plainTypography(sourceText), plainQuote = plainTypography(reference.quote);
    const plainOffset = plainSource.indexOf(plainQuote);
    if (plainOffset < 0 || plainSource.indexOf(plainQuote, plainOffset + 1) !== -1) throw new Error("generated_evidence_rejected");
    const relative = Array.from(plainSource.slice(0, plainOffset)).length;
    const quote = characters.slice(relative, relative + Array.from(reference.quote).length).join("");
    const start = snapshot.excerpt.start + relative;
    return { ...reference, quote, start, end: start + Array.from(quote).length };
  }) })).map(claim => claim.kind === "source_excerpt" && claim.references.length === 1 && claim.text !== claim.references[0].quote
    && plainTypography(claim.text) === plainTypography(claim.references[0].quote) ? { ...claim, text: claim.references[0].quote } : claim);
  // The authoritative evidence contract is unchanged. The caller must also
  // validate these references against the fresh current-publication projection.
  return EvidenceClaimsSchema.parse(canonical);
}
