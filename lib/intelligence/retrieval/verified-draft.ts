import "server-only";
import { inspectGeneratedSourceLinks } from "@/lib/ask/source-links";
import { parseAnswerEvidenceReview, type AnswerEvidenceReview } from "./answer-review";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Remove addresses that were not supplied as sources, keeping the words around them. */
export function withoutUnverifiedLinks(draft: unknown, urls: readonly string[]): unknown {
  const unique = Array.from(new Set(urls.filter(Boolean))).sort((a, b) => b.length - a.length);
  if (!unique.length) return draft;
  const clean = (text: string) => unique.reduce((value, url) => {
    const address = escapeRegExp(url);
    return value
      .replace(new RegExp(`\\[([^\\]]*)\\]\\(\\s*${address}[^)]*\\)`, "g"), "$1")
      .replace(new RegExp(`\\s*\\(\\s*${address}\\s*\\)`, "g"), "")
      .replace(new RegExp(address, "g"), "");
  }, text).replace(/[ \t]{2,}/g, " ").replace(/ +([.,;:!?])/g, "$1");
  const walk = (node: unknown): unknown => {
    if (typeof node === "string") return clean(node);
    if (Array.isArray(node)) return node.filter(item => !(typeof item === "string" && unique.includes(item))).map(walk);
    if (node && typeof node === "object") return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, walk(value)]));
    return node;
  };
  return walk(draft);
}

/**
 * Check the draft, and correct it once when the check finds a problem. A written answer is never
 * discarded here: when the check cannot run, or a problem remains after the single correction, the
 * draft is returned with unsupplied addresses removed and the open findings listed in `unresolved`.
 */
export async function verifyAnswerDraft(options: {
  draft: unknown;
  allowedHrefs: string[];
  origin?: string;
  needsReview: (draft: unknown) => boolean;
  review: (draft: unknown) => Promise<unknown>;
  repair: (draft: unknown, findings: AnswerEvidenceReview) => Promise<unknown>;
}): Promise<{ draft: unknown; repaired: boolean; reviewed: boolean; unresolved: AnswerEvidenceReview["issues"] }> {
  let draft = options.draft;
  let mustReview = options.needsReview(draft);
  let reviewed = true;
  for (let round = 0; round < 2; round++) {
    const links = inspectGeneratedSourceLinks(draft, options.allowedHrefs, { origin: options.origin });
    let review: AnswerEvidenceReview = { verdict: "pass", issues: [] };
    mustReview ||= options.needsReview(draft);
    if (mustReview) {
      try { review = parseAnswerEvidenceReview(await options.review(draft)); }
      catch { reviewed = false; }
    }
    const issues: AnswerEvidenceReview["issues"] = [
      ...links.violations.map(violation => ({
        location: violation.path.slice(0, 180), problem: "unverified_link" as const,
        explanation: `This address was not supplied as a source: ${violation.url.slice(0, 500)}. Remove it or use an exact address from the supplied sources. Sources are attached separately to downloads.`, sourceRefs: [],
      })), ...review.issues,
    ].slice(0, 8);
    if (review.verdict === "pass" && !issues.length) return { draft, repaired: round > 0, reviewed, unresolved: [] };
    const keep = () => ({ draft: withoutUnverifiedLinks(draft, links.violations.map(violation => violation.url)), repaired: round > 0, reviewed, unresolved: issues });
    if (round === 1) return keep();
    try { draft = await options.repair(draft, { verdict: "revise", issues }); }
    catch { return keep(); }
  }
  return { draft, repaired: true, reviewed, unresolved: [] };
}
