import { tokens } from "./search";

/** Contiguous source passages, kept at sentence boundaries. Selection never
 * rewrites the source or joins disjoint passages into an apparent quotation. */
export function evidencePassages(text: string, question: string, title = "", limit = 3, maxChars = 1500): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean || limit < 1 || maxChars < 1) return [];
  if (clean.length <= maxChars) return [clean];
  const terms = new Set(tokens(question));
  const titleTerms = new Set(tokens(title));
  const sentences = [...new Intl.Segmenter("en", { granularity: "sentence" }).segment(clean)]
    .map(part => ({ start: part.index, end: part.index + part.segment.trimEnd().length }));
  const candidates = sentences.flatMap((sentence, index) => {
    let end = sentence.end;
    // A single overlong sentence is not shortened into an apparently complete
    // rule. Other complete passages remain available for citation.
    if (end - sentence.start > maxChars) return [];
    for (let next = index + 1; next < sentences.length && sentences[next].end - sentence.start <= maxChars; next++) end = sentences[next].end;
    const quote = clean.slice(sentence.start, end);
    const matched = new Set(tokens(quote).filter(term => terms.has(term)));
    const specific = [...matched].filter(term => !titleTerms.has(term)).length;
    return [{ start: sentence.start, end, quote, relevance: specific * 10 + matched.size * 3 }];
  });
  const selected: typeof candidates = [];
  for (let round = 0; round < limit; round++) {
    const ranked = candidates.filter(candidate => !selected.some(other => other.quote === candidate.quote)).map(candidate => {
      const ranges = selected.map(other => ({ start: Math.max(candidate.start, other.start), end: Math.min(candidate.end, other.end) })).filter(range => range.end > range.start).sort((a, b) => a.start - b.start);
      let covered = 0, lastEnd = candidate.start;
      for (const range of ranges) { covered += Math.max(0, range.end - Math.max(lastEnd, range.start)); lastEnd = Math.max(lastEnd, range.end); }
      const length = candidate.end - candidate.start, fresh = length - covered;
      return { candidate, fresh, score: candidate.relevance + fresh / maxChars * 5 - covered / length * 30 };
    }).filter(row => row.fresh >= Math.min(80, row.candidate.quote.length));
    ranked.sort((a, b) => b.score - a.score || b.fresh - a.fresh || a.candidate.start - b.candidate.start);
    if (!ranked.length) break;
    selected.push(ranked[0].candidate);
  }
  return selected.map(candidate => candidate.quote);
}
