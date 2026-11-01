import "server-only";
import type { Doc, SearchHit } from "./search";

/** For a video-example question, present a real transcript scenario as the
 * citation excerpt. The writer also receives transcript text as program
 * knowledge; citing only a general style summary cannot support that example. */
export function videoScenarioEvidenceHits(hits: SearchHit[], docs: Doc[], question: string): SearchHit[] {
  if (!/\b(?:example|examples|scenario|scenarios|illustration|illustrate)\b/i.test(question)) return hits;
  const byId = new Map(docs.map(doc => [doc.id, doc]));
  return hits.map(hit => {
    const doc = byId.get(hit.id);
    if (!doc || doc.kind !== hit.kind || doc.href !== hit.href || doc.type !== "leadership_video_transcript") return hit;
    // Match actual source text, with exactly the same whitespace normalization
    // used by the citation and evidence validators. Prefer an authored scenario
    // cue over an incidental use of the word "example" elsewhere in a video.
    const text = doc.text.replace(/\s+/g, " ").trim();
    const match = /\b(?:imagine|scenario)\b/i.exec(text) ?? /\bexamples?\b/i.exec(text);
    if (!match) return hit;
    const window = text.slice(match.index, match.index + 850);
    const sentenceEnd = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "), window.lastIndexOf("! "));
    const quote = (match.index + window.length < text.length && sentenceEnd >= 120 ? window.slice(0, sentenceEnd + 1) : window).trim();
    return quote ? { ...hit, excerpt: quote } : hit;
  });
}
