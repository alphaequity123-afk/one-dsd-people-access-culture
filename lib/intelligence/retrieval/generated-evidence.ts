import "server-only";
import { z } from "zod";
import { EvidenceClaimSchema, EvidenceClaimsSchema, EvidenceReferenceSchema, type EvidenceClaim } from "@/lib/content/ask-evidence";
import type { Citation } from "./search";

// Model transport keeps every reference field and bound. Only the relationship
// between its numeric offsets and exact quote is deferred to server resolution.
const TransportReferenceSchema = z.object(EvidenceReferenceSchema.shape).strict();
// The claim-level rule (a source_excerpt must equal its one quote) is also deferred:
// enforcing it here rejected the whole written answer and forced a full rewrite for a
// paraphrase. canonicalizeGeneratedEvidenceClaims applies it after resolution instead.
export const GeneratedEvidenceClaimsSchema = z.array(z.object({
  ...EvidenceClaimSchema.shape,
  references: z.array(TransportReferenceSchema).min(1).max(4),
}).strict()).max(12);

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
    && plainTypography(claim.text) === plainTypography(claim.references[0].quote) ? { ...claim, text: claim.references[0].quote } : claim)
    // Text that is not the exact passage is a paraphrase of it. Keep it, with its exact
    // basis passages, as an inference rather than presenting it as a quotation.
    .map(claim => claim.kind === "source_excerpt" && (claim.references.length !== 1 || claim.text !== claim.references[0].quote)
      ? { ...claim, kind: "inference" as const } : claim);
  // The authoritative evidence contract is unchanged. The caller must also
  // validate these references against the fresh current-publication projection.
  return EvidenceClaimsSchema.parse(canonical);
}

/**
 * What the writer returns for each supported statement: its text and the labels of the
 * supplied sources behind it. The passages are attached here from what was supplied, so
 * the writer never copies them back and a retyped passage can never fail to match.
 */
export const CitedStatementsSchema = z.array(z.object({
  text: z.string().min(1).max(4000),
  refs: z.array(z.string().min(1).max(40)).min(1).max(4),
})).max(12);

/** The label a supplied source is cited by, or undefined when it carries no evidence to cite. */
export function sourceRef(supplied: Citation[], index: number): string | undefined {
  return supplied[index]?.evidence ? `S${index + 1}` : undefined;
}

/**
 * Turn the writer's statements into evidence claims. Each statement stands or falls on its own:
 * a label that names no supplied source is left out, and a statement with no valid label is
 * dropped. Nothing is repaired or guessed. A statement in the earlier format, with its own
 * quoted passage, is resolved by the exact-match rules above.
 * The caller still validates every claim against the current publication.
 */
export function resolveCitedStatements(value: unknown, supplied: Citation[]): { claims: EvidenceClaim[]; dropped: number } {
  if (!Array.isArray(value)) return { claims: [], dropped: 0 };
  const byRef = new Map<string, NonNullable<Citation["evidence"]>>(supplied.flatMap((source, index) => source.evidence ? [[`S${index + 1}`, source.evidence] as const] : []));
  const claims: EvidenceClaim[] = [];
  let dropped = 0;
  for (const raw of value.slice(0, 12)) {
    try {
      const statement = raw as { text?: unknown; refs?: unknown };
      if (!raw || typeof raw !== "object" || !Array.isArray(statement.refs)) {
        claims.push(...canonicalizeGeneratedEvidenceClaims([raw], supplied));
        continue;
      }
      const text = typeof statement.text === "string" ? statement.text.trim().slice(0, 4000) : "";
      const labels = Array.from(new Set(statement.refs.flatMap(ref => typeof ref === "string" ? [ref.trim().toUpperCase()] : [])));
      const references = labels.flatMap(label => {
        const snapshot = byRef.get(label);
        if (!snapshot) return [];
        // The whole supplied passage, or its opening when it is longer than a reference may be.
        let characters = Array.from(snapshot.excerpt.quote);
        while (characters.join("").length > 1500) characters = characters.slice(0, -1);
        if (!characters.length) return [];
        return [{ evidenceId: snapshot.evidenceId, start: snapshot.excerpt.start, end: snapshot.excerpt.start + characters.length, quote: characters.join("") }];
      }).slice(0, 4);
      if (!text || !references.length) { dropped += 1; continue; }
      const quoted = references.length === 1 && plainTypography(text) === plainTypography(references[0].quote);
      claims.push(...EvidenceClaimsSchema.parse([quoted
        ? { kind: "source_excerpt", text: references[0].quote, references }
        : { kind: "inference", text, references }]));
    } catch {
      dropped += 1;
    }
  }
  return { claims, dropped };
}

