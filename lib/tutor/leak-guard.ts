/**
 * Answer-leak guard. The guide may discuss only the option the learner chose.
 * Before a reply is returned, it is checked against the text and feedback of
 * every other option (which includes the correct option whenever the learner
 * chose a different one). A normalized run of at least OVERLAP_WORDS words in
 * common counts as a leak, and the reply is replaced by a safe fallback built
 * from the chosen option's own feedback. Pure, so the route and tests share it.
 */
import type { TutorItem } from "./items";

export const OVERLAP_WORDS = 8;

export function normalizeForMatch(text: string): string[] {
  return text.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
}

/** True when any run of `overlap` consecutive words from `protectedText` appears in `reply`. */
export function sharesRun(reply: string, protectedText: string, overlap = OVERLAP_WORDS): boolean {
  const haystack = " " + normalizeForMatch(reply).join(" ") + " ";
  const tokens = normalizeForMatch(protectedText);
  // A protected text shorter than the window is matched whole, as long as it is not trivially short.
  const window = Math.min(overlap, tokens.length);
  if (window < 5) return false;
  for (let i = 0; i + window <= tokens.length; i++) {
    if (haystack.includes(" " + tokens.slice(i, i + window).join(" ") + " ")) return true;
  }
  return false;
}

/** The option texts and feedback the guide must never reproduce for this choice. */
export function protectedTexts(item: TutorItem, chosenIndex: number): string[] {
  return item.options.flatMap((option, n) => (n === chosenIndex ? [] : [option.text, option.feedback]));
}

export function leaksAnswer(reply: string, item: TutorItem, chosenIndex: number): boolean {
  return protectedTexts(item, chosenIndex).some(text => sharesRun(reply, text));
}
