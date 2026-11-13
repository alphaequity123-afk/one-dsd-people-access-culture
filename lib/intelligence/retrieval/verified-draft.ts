import "server-only";
import { inspectGeneratedSourceLinks } from "@/lib/ask/source-links";
import { parseAnswerEvidenceReview, type AnswerEvidenceReview } from "./answer-review";

/** The final draft, including its exports, must pass again after the single correction. */
export async function verifyAnswerDraft(options: {
  draft: unknown;
  allowedHrefs: string[];
  origin?: string;
  needsReview: (draft: unknown) => boolean;
  review: (draft: unknown) => Promise<unknown>;
  repair: (draft: unknown, findings: AnswerEvidenceReview) => Promise<unknown>;
}) {
  let draft = options.draft;
  let mustReview = options.needsReview(draft);
  for (let round = 0; round < 2; round++) {
    const links = inspectGeneratedSourceLinks(draft, options.allowedHrefs, { origin: options.origin });
    let review: AnswerEvidenceReview = { verdict: "pass", issues: [] };
    mustReview ||= options.needsReview(draft);
    if (mustReview) {
      try { review = parseAnswerEvidenceReview(await options.review(draft)); }
      catch { throw new Error("answer_review_failed"); }
    }
    const issues: AnswerEvidenceReview["issues"] = [
      ...links.violations.map(violation => ({
        location: violation.path.slice(0, 180), problem: "unverified_link" as const,
        explanation: `This address was not supplied as a source: ${violation.url.slice(0, 500)}. Remove it or use an exact address from the supplied sources. Sources are attached separately to downloads.`, sourceRefs: [],
      })), ...review.issues,
    ].slice(0, 8);
    if (review.verdict === "pass" && !issues.length) return { draft, repaired: round > 0 };
    if (round === 1) throw new Error("generated_evidence_rejected");
    draft = await options.repair(draft, { verdict: "revise", issues });
  }
  throw new Error("generated_evidence_rejected");
}
