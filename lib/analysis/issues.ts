import type { ZodIssue } from "zod";
import { ANALYSIS_LIMITS } from "./contract";

// Plain-language wording for a request that does not match the analysis contract.
// Used by the route (400 responses) and by the page before it sends anything, so a
// person reads the same sentence on both sides. Never echoes the submitted text.

const limit = (value: number) => value.toLocaleString("en-US");

/** The first validation problem in plain words, naming the source by its position when there is one. */
export function plainIssue(issue: ZodIssue | undefined): string {
  if (!issue) return "The request was not complete.";
  const path = issue.path.map(String);
  const field = path[0];
  const detail = path.at(-1);
  if (issue.code === "custom") return issue.message;
  if (field === "instrumentId") return "Choose one of the analysis types on the page.";
  if (field === "sources") {
    if (path.length === 1) {
      if (issue.code === "too_small") return "Add at least one source to analyze.";
      if (issue.code === "too_big") return `Too many sources. Use up to ${ANALYSIS_LIMITS.sources} and try again.`;
      return "Check the sources and try again.";
    }
    const index = Number(path[1]);
    const which = Number.isInteger(index) && index >= 0 ? `Source ${index + 1}` : "One source";
    if (detail === "text") {
      if (issue.code === "too_big") return `${which} holds more than ${limit(ANALYSIS_LIMITS.sourceCharacters)} characters; shorten it.`;
      return `${which} has no text. Paste the text or remove the source.`;
    }
    if (detail === "title") {
      if (issue.code === "too_big") return `The title of ${which.toLowerCase()} is longer than ${ANALYSIS_LIMITS.titleCharacters} characters; shorten it.`;
      return `Give ${which.toLowerCase()} a title.`;
    }
    if (detail === "note") return `The reading note on ${which.toLowerCase()} is too long.`;
    if (detail === "id") return "Each source needs its own id.";
    return "Check the sources and try again.";
  }
  if (field === "context") return `Shorten what you want to know; it holds more than ${limit(ANALYSIS_LIMITS.contextCharacters)} characters.`;
  if (field === "communityId") return "The community was not recognized.";
  return "The request was not complete.";
}
