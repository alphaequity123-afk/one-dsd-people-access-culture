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

/** Resolve coordinates from exact, unambiguous supplied text; never repair text or IDs. */
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
    if (offset < 0 || sourceText.indexOf(reference.quote, offset + 1) !== -1) throw new Error("generated_evidence_rejected");
    const start = snapshot.excerpt.start + Array.from(sourceText.slice(0, offset)).length;
    return { ...reference, start, end: start + Array.from(reference.quote).length };
  }) }));
  // The authoritative evidence contract is unchanged. The caller must also
  // validate these references against the fresh current-publication projection.
  return EvidenceClaimsSchema.parse(canonical);
}
