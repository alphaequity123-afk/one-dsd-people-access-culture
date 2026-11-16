/**
 * Owner's wording rule: whoever holds a responsibility is "the person or area responsible",
 * never an "office". Official names such as "Office of the Legislative Auditor" are left alone:
 * the rule applies only to a lower-case "office" described as responsible, appropriate, right,
 * proper, designated, authorized, relevant, applicable or correct.
 */
const ROLE = "responsible|appropriate|right|proper|designated|authorized|relevant|applicable|correct";
const PATTERN = new RegExp(
  `(?<![-\\w])((?:the|a|an|your|their|its|our|each|that|this|any|other)\\s+)?((?:${ROLE})(?:\\s+(?:${ROLE}))?)\\s+((?:[A-Za-z][A-Za-z-]*\\s+){0,3}?)(offices?)\\b`,
  "gi",
);

/** What sits between the describing word and "office", and how it reads after the change. */
const QUALIFIERS: Record<string, string> = {
  "": "",
  "person or": "", "people or": "", "people and": "", "role or": "", "roles and": "", "responders or": "", "formal": "",
  "adsa": " in ADSA", "dhs": " in DHS", "agency": " in the agency", "department": " in the department", "community": " in the community",
  "local": " locally", "program": " for the program", "policy": " for the policy", "equity": " for equity", "legal": " for legal questions",
  "hiring": " for hiring", "accommodation": " for accommodations", "language-access": " for language access", "language access": " for language access",
  "equal-opportunity": " for equal opportunity", "equal opportunity": " for equal opportunity", "civil rights": " for civil rights",
  "tribal": " for Tribal relations", "tribal relations": " for Tribal relations", "tribal-relations": " for Tribal relations",
};
const PLURAL_HINT = /^(?:people|roles|responders)\b/i;

export function responsibleWording(text: string): string {
  if (!text || !/offices?\b/.test(text)) return text;
  return text.replace(PATTERN, (match: string, determiner: string | undefined, _role: string, between: string, noun: string) => {
    const middle = between.trim().replace(/\s+/g, " ");
    const key = middle.toLowerCase();
    // "Office" as part of a proper name keeps its capital and is not touched.
    if (noun[0] === "O") return match;
    // Words in between that are not a plain description ("the right to an office") mean this is a different sentence.
    if (!(key in QUALIFIERS) && (key.split(" ").length > 2 || /\b(?:to|an?|the|of|for|in|at|on|and|or|is|are|was|were|be|by|with|from|that|which|who|not|no)\b/.test(key))) return match;
    const qualifier = key in QUALIFIERS ? QUALIFIERS[key] : ` for ${middle.replace(/-/g, " ")}`;
    const plural = /s$/i.test(noun) || PLURAL_HINT.test(middle);
    const article = (determiner ?? "").trim().toLowerCase();
    const lead = !article ? (plural ? "the " : "the ") : article === "an" ? "a " : article + " ";
    const phrase = `${lead}${plural ? "people or areas" : "person or area"} responsible${qualifier}`;
    return /^[A-Z]/.test(match) ? phrase[0].toUpperCase() + phrase.slice(1) : phrase;
  });
}

/** Spoken material must keep matching its recording, and addresses and identifiers are never reworded. */
const UNTOUCHED = /^(?:href|url|src|id|slug|introTranscript|introAudio|transcript|captions|poster|audio|video|quote|citation|sourceUrl|image|coverImage)$/i;

export function withResponsibleWording<T>(value: T): T {
  if (typeof value === "string") return responsibleWording(value) as unknown as T;
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map(item => { const out = withResponsibleWording(item); if (out !== item) changed = true; return out; });
    return (changed ? next : value) as unknown as T;
  }
  if (value && typeof value === "object") {
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const out = UNTOUCHED.test(key) ? item : withResponsibleWording(item);
      if (out !== item) changed = true;
      next[key] = out;
    }
    return (changed ? next : value) as T;
  }
  return value;
}
