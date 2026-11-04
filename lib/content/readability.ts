/**
 * Flesch-Kincaid grade level for plain-language checks on program text.
 *
 * Grade = 0.39 × (words per sentence) + 11.8 × (syllables per word) − 15.59.
 *
 * Official names (a program name such as "Equity Analysis Toolkit", or a
 * race label such as "American Indian or Alaska Native") are fixed by the owner and cannot be shortened. They are
 * treated the way a reader treats a proper noun: one word of two syllables.
 * Pass them in `properNouns`. Everything else is counted word by word.
 */

const PROPER_NOUN_SYLLABLES = 2;

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return /\d/.test(word) ? 1 : 0;
  if (w.length <= 3) return 1;
  const stripped = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = stripped.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\$(\d[\d,]*)\.(\d+)/g, "$$$1POINT$2")
    .replace(/(\d)\.(\d)/g, "$1POINT$2")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/)
    .map(s => s.replace(/POINT/g, ".").trim())
    .filter(Boolean);
}

export function fleschKincaidGrade(sentence: string, properNouns: readonly string[] = []): number {
  let text = sentence;
  let properWords = 0;
  for (const noun of [...properNouns].sort((a, b) => b.length - a.length)) {
    const parts = text.split(noun);
    properWords += parts.length - 1;
    text = parts.join(" ");
  }
  const words = text.split(/\s+/).map(w => w.replace(/^[^a-zA-Z0-9$]+|[^a-zA-Z0-9%]+$/g, "")).filter(Boolean);
  const wordCount = words.length + properWords;
  if (wordCount === 0) return 0;
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0) + properWords * PROPER_NOUN_SYLLABLES;
  return Math.round((0.39 * wordCount + 11.8 * (syllables / wordCount) - 15.59) * 10) / 10;
}

/** Highest grade among the sentences of a passage. */
export function passageGrade(text: string, properNouns: readonly string[] = []): number {
  return Math.max(0, ...splitSentences(text).map(s => fleschKincaidGrade(s, properNouns)));
}
