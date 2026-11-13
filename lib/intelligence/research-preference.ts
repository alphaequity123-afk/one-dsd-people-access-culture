/** Explicit user constraints on external research. A normal question remains
 * automatic; asking for internal material only must not send it to web research. */
export function asksForProgramSourcesOnly(question: string): boolean {
  const text = question.toLowerCase().replace(/[’‘]/g, "'");
  // An explicit request to go beyond the application is not an internal-only
  // constraint, even if it mentions the words "use only" along the way.
  if (/\b(?:do not|don't|never|must not|should not|not)\s+(?:use|using|rely on|relying on|search|searching|consult|consulting)\s+(?:only|just|solely|exclusively)\b/.test(text)
    || /\bnot\s+only\s+(?:use|using|search|consult)\b/.test(text)
    || /\b(?:also|additionally|and|plus)\s+(?:please\s+)?(?:search|use|consult|include|consider|check)\s+(?:the\s+)?(?:web|internet|online|external|outside)\b/.test(text)
    || /\b(?:include|use|consult|search|consider)\s+(?:the\s+)?(?:web|internet|online|external|outside)\b.{0,30}\b(?:too|also|as well)\b/.test(text)) return false;
  return /\b(?:use|using|consult|cite|search)\s+(?:only|just|solely|exclusively)\s+(?:the\s+)?one dsd(?:['’]s)?\s+(?:sources|resources|readings|materials|documents|knowledge base)\b/.test(text)
    || /\b(?:use|using|consult|cite|search)\s+(?:the\s+)?one dsd(?:['’]s)?\s+(?:sources|resources|readings|materials|documents|knowledge base)\s+(?:only|exclusively)\b/.test(text)
    || /\b(?:using|use|searching|search|consulting|consult|citing|cite|relying on|rely on|based (?:solely |only |exclusively )?on)\s+(?:(?:only|just|solely|exclusively)\s+)?(?:(?:this|the)\s+)?(?:app|application|site|program)\s+(?:only|alone|exclusively)\b/.test(text)
    || /\b(?:using|use|consult|cite|drawing on|draw on)\s+(?:only|just|solely|exclusively)\s+[^.!?\n]{1,160}\b(?:reading|essay|brief|course|book|chapter|resource|document|material|section|collection)s?\s+(?:from|in|on|within|inside)\s+(?:this|the)\s+(?:application|app|site|program)\b/.test(text)
    || /\b(?:using|use|searching|search|consulting|consult|citing|cite|relying on|rely on|based\s+on)\s+(?:only|just|solely|exclusively)\s+(?:(?:this|the)\s+)(?:app|application|site|program)\b/.test(text)
    || /\b(?:based|drawing)\s+(?:only|solely|exclusively)\s+on\s+(?:(?:this|the)\s+)(?:app|application|site|program)\b/.test(text)
    || /\b(?:from|within|inside|in)\s+(?:only|just|solely|exclusively)\s+(?:(?:this|the)\s+)(?:app|application|site|program)\b/.test(text)
    || /\b(?:from|within|inside|in)\s+(?:(?:this|the)\s+)(?:app|application|site|program)\s+(?:only|alone|exclusively)\b/.test(text)
    || /\b(?:using|use|search|consult|cite)\s+(?:only|just|solely|exclusively)\s+(?:the\s+)?(?:information|sources|content|materials|documents)\s+(?:from|in|on|within)\s+(?:(?:this|the)\s+)?(?:app|application|site|program)\b/.test(text)
    || /\b(?:only|just|exclusively)\s+(?:use|search|consult|cite|look|rely|retrieve)\b.{0,55}\b(?:this (?:app|application|site|program)|(?:internal|program|application) (?:sources|content|materials|documents))\b/.test(text)
    || /\b(?:only|exclusively)\s+(?:the\s+)?(?:internal|program|application)\s+(?:sources|content|materials|documents|information)\b/.test(text)
    || /\b(?:only|exclusively)\s+(?:the\s+)?(?:information|sources|content|materials|documents)\s+(?:from|in|on|within)\s+(?:this\s+)?(?:app|application|site|program)\b/.test(text)
    || /\b(?:use|search|consult)\b.{0,20}\b(?:only|exclusively)\b.{0,35}\b(?:internal|program|application|site|app)\b/.test(text)
    || /\b(?:use|search|consult|cite|rely on)\s+(?:the\s+)?(?:(?:internal|program|application|app|site)\s+(?:sources|content|materials|documents|information)|(?:this|the)\s+(?:app|application|site|program)(?:'s)?\s+(?:sources|content|materials|documents|information))\s+(?:only|exclusively)\b/.test(text)
    || /\b(?:use|search|consult)\s+(?:this\s+)?(?:app|application|site|program)\s+(?:only|exclusively)\b/.test(text);
}

/** A research preference does not prohibit ordinary general knowledge. */
export function asksToAvoidWebResearch(question: string): boolean {
  const text = question.toLowerCase().replace(/[’‘]/g, "'");
  return asksForProgramSourcesOnly(question)
    || /\b(?:do not|don't|never|without)\b.{0,30}\b(?:search|searching|use|using|access|accessing|consult|consulting|browse|browsing|go)\b.{0,35}\b(?:web|internet|online|external|outside)\b/.test(text)
    || /\b(?:no|without|don't want|do not want)\s+(?:outside|external|web|internet|online)\s+(?:research|sources|search|information|access)\b/.test(text);
}
