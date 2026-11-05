// Keyword matching for guidance links. Shared by the server (next steps for gaps)
// and the instrument helpers, so both match the same way.
//
// A keyword matches only as whole words: "format" does not match "information",
// "nation" does not match "explanation", "source" does not match "resources".
// Keywords are lowercase words or phrases; the text is compared case-insensitively.

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const cache = new Map<string, RegExp>();

function patternFor(keyword: string): RegExp {
  let pattern = cache.get(keyword);
  if (!pattern) {
    const body = escapeRegExp(keyword.trim()).replace(/\s+/g, "\\s+");
    // A boundary is required only where the keyword starts or ends with a word character.
    const start = /^\w/.test(keyword) ? "(?<![\\p{L}\\p{N}_])" : "";
    const end = /\w$/.test(keyword) ? "(?![\\p{L}\\p{N}_])" : "";
    pattern = new RegExp(`${start}${body}${end}`, "iu");
    cache.set(keyword, pattern);
  }
  return pattern;
}

/** True when the keyword occurs in the text as a whole word or phrase, case-insensitively. */
export function keywordMatches(keyword: string, text: string): boolean {
  if (!keyword || !keyword.trim()) return false;
  return patternFor(keyword).test(text);
}

/** True when any of the keywords occurs in the text as a whole word or phrase. */
export function anyKeywordMatches(keywords: readonly string[], text: string): boolean {
  return keywords.some(keyword => keywordMatches(keyword, text));
}
