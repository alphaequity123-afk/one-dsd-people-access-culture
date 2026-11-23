/**
 * Owner decision 2026-11-22: no system language anywhere staff read. Researchers' working notes ("could not be
 * opened", "unavailable when checked", "this search did not reach"...) are removed from the text staff see.
 * Works sentence by sentence on Markdown, so the facts around a note stay; a line left empty is dropped.
 */
const NOTE = /\b(?:could not be (?:opened|confirmed|found|reached|verified|located|loaded)|could not (?:confirm|find|verify|open|reach|locate|load)|(?:was|were) (?:unavailable|not (?:found|confirmed|reachable|available))|(?:pages?|sites?|websites?) (?:was|were) unavailable|unavailable (?:when checked|at its listed address)|when (?:we )?checked|repeated refusals|blocked or unavailable|this (?:search|review|research) (?:did not|could not)|not (?:independently )?confirmed|no (?:current )?(?:page|listing|record) (?:was|could be) found)\b/i;

/** Headings such as "**Unavailable sites.**" that introduce only notes. */
const NOTE_LEAD = /^\s*(?:[-*]\s*)?\*\*(?:unavailable sites|blocked or unavailable[^*]*|not confirmed|could not confirm[^*]*)\.?\*\*/i;

/** Periods that do not end a sentence: inside links and web addresses, in abbreviations and in numbers. */
const ABBREVIATIONS = /\b(?:St|Mt|Ft|Dr|Ave|Blvd|Rd|No|Nos|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec|Mr|Mrs|Ms|Jr|Sr|Inc|Co|Corp|Ltd|vs|etc|approx|Rev|Gov|Sen|Rep|Hon|Prof|Univ|Dept|e\.g|i\.e|U\.S|D\.C|P\.O)\./g;
const PROTECTED = "\u0000";
function protect(text: string): string {
  return text
    .replace(/\]\([^)]*\)/g, match => match.replace(/[.!?]/g, PROTECTED))
    .replace(/https?:\/\/[^\s)\]]*[^\s)\].,;:!?]/g, match => match.replace(/[.!?]/g, PROTECTED))
    .replace(/\b[\w-]+(?:\.[\w-]+)+\.(?:com|org|net|gov|edu|us|io)\b/gi, match => match.replace(/\./g, PROTECTED))
    .replace(ABBREVIATIONS, match => match.replace(/\./g, PROTECTED))
    // single-letter initials and street directions: "W. Lake Dr.", "J. K. Sports"
    .replace(/(^|[\s(])([A-Z])\.(?=\s+[A-Z0-9])/g, `$1$2${PROTECTED}`)
    .replace(/(\d)\.(\d)/g, `$1${PROTECTED}$2`);
}
const restore = (text: string) => text.replace(/\u0000/g, ".");

function cleanLine(line: string): string {
  if (!line.trim() || /^\s*#/.test(line)) return line;
  if (NOTE_LEAD.test(line)) return "";
  const lead = line.match(/^\s*(?:[-*]\s+|\d+[.)]\s+)?/)?.[0] ?? "";
  const body = protect(line.slice(lead.length));
  const sentences = body.match(/[^.!?]+(?:[.!?]+["”’)\]*]*|$)\s*/g) ?? [body];
  const kept = restore(sentences.filter(sentence => !NOTE.test(restore(sentence))).join("").trim());
  return kept && /[A-Za-z0-9]/.test(kept.replace(/\*\*[^*]*\*\*/g, "")) ? lead + kept : "";
}

/** A note tucked into a clause ("..., but that page could not be opened") is removed on its own, keeping the facts around it. */
const NOTE_CLAUSE = /(?:\s*[,;]\s*(?:but|and|though|although)?|\s+(?:but|though|although))\s*(?:that|its|the|this|their)\s+(?:own\s+)?(?:page|pages|site|sites|website|websites|listing|listings|link)\b[^.;()]*?\b(?:could not be (?:opened|confirmed|verified|loaded|reached)|(?:was|were) (?:unavailable|not available|not reachable)|did not load)\b/gi;

export function withoutResearchNotes(markdown: string): string {
  if (!markdown) return markdown;
  return markdown.replace(NOTE_CLAUSE, "").split(/\r?\n/).map(cleanLine)
    .filter((line, index, lines) => line !== "" || (index > 0 && lines[index - 1] !== ""))
    .join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
