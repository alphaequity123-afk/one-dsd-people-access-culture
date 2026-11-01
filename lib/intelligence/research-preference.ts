/** Explicit user constraints on external research. A normal question remains
 * automatic; asking for internal material only must not send it to web research. */
export function asksForProgramSourcesOnly(question: string): boolean {
  const text = question.toLowerCase().replace(/[’‘]/g, "'");
  return /\b(?:only|just|exclusively)\s+(?:use|search|consult|cite|look|rely|retrieve)\b.{0,55}\b(?:this (?:app|application|site|program)|(?:internal|program|application) (?:sources|content|materials|documents))\b/.test(text)
    || /\b(?:only|exclusively)\s+(?:the\s+)?(?:internal|program|application)\s+(?:sources|content|materials|documents|information)\b/.test(text)
    || /\b(?:only|exclusively)\s+(?:the\s+)?(?:information|sources|content|materials|documents)\s+(?:from|in|on|within)\s+(?:this\s+)?(?:app|application|site|program)\b/.test(text)
    || /\b(?:use|search|consult)\b.{0,20}\b(?:only|exclusively)\b.{0,35}\b(?:internal|program|application|site|app)\b/.test(text)
    || /\b(?:use|search|consult|cite|rely on)\s+(?:the\s+)?(?:(?:internal|program|application|app|site)\s+(?:sources|content|materials|documents|information)|(?:this|the)\s+(?:app|application|site|program)(?:'s)?\s+(?:sources|content|materials|documents|information))\s+(?:only|exclusively)\b/.test(text)
    || /\b(?:use|search|consult)\s+(?:this\s+)?(?:app|application|site|program)\s+(?:only|exclusively)\b/.test(text)
    || /\b(?:do not|don't|never|without)\b.{0,30}\b(?:search|searching|use|using|access|accessing|consult|consulting|browse|browsing|go)\b.{0,35}\b(?:web|internet|online|external|outside)\b/.test(text)
    || /\b(?:no|without|don't want|do not want)\s+(?:outside|external|web|internet|online)\s+(?:research|sources|search|information|access)\b/.test(text);
}
