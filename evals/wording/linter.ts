/**
 * One wording linter for every staff-visible string (A5, docs/EVALS-STUDY.md section 6).
 *
 * It merges the checks that were spread across the codebase:
 * - lib/brand/lint.ts (model and vendor brand words: AI, chatbot, ...), reused directly;
 * - lib/content/responsible-wording.ts ("office" for whoever is responsible), reused directly;
 * - the trainings wording rules (NEW lib/trainings/wording.ts: character names, DEI terms, notices, program voice);
 * - the system-notice sentences removed by NEW lib/kb/system-notices.ts (withoutSystemNotices);
 * - the scattered inline patterns in about 25 tests (tutor, office, DEI/DEIA, acronyms, "coming soon").
 *
 * Owner wording decisions are firm, so every hit is a real finding. The only exceptions are the official names
 * and direct quotes in evals/wording/allowlist.json, which is read by every caller.
 * Plain Node can import this file (no path aliases), so scripts, tests and other evals reuse it.
 */
import { readFileSync } from "node:fs";
import { lintStaffCopy } from "../../lib/brand/lint.ts";
import { responsibleWording } from "../../lib/content/responsible-wording.ts";

export type RuleId =
  | "banned-words"
  | "responsible-party"
  | "retired-terms"
  | "system-notices"
  | "program-voice"
  | "names"
  | "status-labels"
  | "acronyms";

export const RULES: Record<RuleId, string> = {
  "banned-words": "AI, artificial intelligence, tutor, chatbot, bot and model or vendor names in visible text (the feature is Guidance)",
  "responsible-party": "\"office\" for whoever is responsible (say \"the person or area responsible\")",
  "retired-terms": "DEI, DEIA, DEAI outside official names; MMB \"Leading with DEIA\" is held aside",
  "system-notices": "system and participation notices (voluntary, optional, self-paced, training credit, saved, recorded, stays on your device)",
  "program-voice": "program voice (we, us, our) outside quotations",
  "names": "names for people in courses and trainings (describe the person by role)",
  "status-labels": "program and status labels (coming soon, TBD, draft, Project recommendation, Existing DHS resource)",
  "acronyms": "acronym used before it is spelled out in the same page, course or record",
};

export type Finding = { rule: RuleId; match: string; index: number; message: string };

export type Allowlist = {
  /** Official names and titles kept exactly as their owners write them. */
  officialNames: string[];
  /** Direct quotes from people or publications, kept word for word. */
  directQuotes: string[];
  /** Acronyms readers already know, with the reason each is allowed. */
  knownAcronyms: Record<string, string>;
  /** Files that reproduce someone else's words (publisher pages, research quotations); not program wording. */
  quotedSourceFiles: Record<string, string>;
  /** Real public figures who may be named (authors, historical figures); never staff or course characters. */
  publicFigures: string[];
};

export function loadAllowlist(path = new URL("./allowlist.json", import.meta.url)): Allowlist {
  const data = JSON.parse(readFileSync(path, "utf8"));
  return {
    officialNames: data.officialNames ?? [],
    directQuotes: data.directQuotes ?? [],
    knownAcronyms: data.knownAcronyms ?? {},
    quotedSourceFiles: data.quotedSourceFiles ?? {},
    publicFigures: data.publicFigures ?? [],
  };
}

/** Character names used in earlier drafts (NEW lib/trainings/wording.ts), plus names found in course scenarios. */
export const CHARACTER_NAMES = [
  "Kim", "Dale", "Ines", "Teresa", "Odile", "Paulo", "Theo", "Lidia", "Rena", "Kofi", "Teo", "Elena", "Taylor", "Hana", "Nyra", "Luca",
  "Mireille", "Sana", "Morgan", "Nuno", "Corinne", "Grace", "Craig", "Marisol", "Mateo", "Brent", "Rita", "Dana", "Brett", "Jill", "Dara",
  "Glen", "Rowan", "Joaquin", "Simone", "Paula", "Jun", "Avery", "Remi", "Amara", "Alex", "Jamie", "Wren", "Daniel", "Wen", "Tavi", "Bea",
  "Sage", "Lee",
  // Found in course scenarios (lib/content/courses) by evals/wording/run.ts discovery.
  "Bryn", "Leila",
];

/** The exact boilerplate sentences NEW lib/kb/system-notices.ts removes (withoutSystemNotices). */
export const SYSTEM_NOTICE_SENTENCES = [
  "Participation is optional.",
  "Participation in this learning is voluntary.",
  "Learning is voluntary.",
  "Participation is voluntary.",
  "Learning and reflection are voluntary.",
  "Voluntary and self-directed: no score, no ranking, no completion requirement",
  "Participation in this program is voluntary and does not replace required training.",
  "does not count toward DHS-required training credits",
  "Category: Optional learning",
  "This program does not offer training credits",
];

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A match counts only when its sentence also passes this test (when given). */
type Pattern = { rule: RuleId; re: RegExp; message: string; sentence?: RegExp };

/** Words that show a sentence is about taking part in learning, practice or the program. */
const PARTICIPATION_CONTEXT = /\b(?:participat\w*|learning|lessons?|courses?|modules?|reflect\w*|practice|exercises?|activit(?:y|ies)|training|sessions?|listening|discussions?|credits?|scores?|completion|complete|required|requirement|mandatory|this (?:program|page|tool|section|resource|guide|course|lesson)|resources?|private(?:ly)?|share|sharing|disclos\w*)\b/i;

const ROLE = "responsible|appropriate|right|proper|designated|authorized|relevant|applicable|correct";
const PATTERNS: Pattern[] = [
  // Banned words beyond the brand lint (which covers AI, artificial intelligence, chatbot, LLM, GPT and vendors).
  { rule: "banned-words", re: /(?<![\p{L}\p{N}])tutor(?:s|ed|ing)?(?![\p{L}\p{N}])/giu, message: "\"tutor\": the feature is Guidance" },
  { rule: "banned-words", re: /(?<![\p{L}\p{N}])bots?(?![\p{L}\p{N}-])/giu, message: "\"bot\" in visible text" },
  // "office" for whoever is responsible (lower-case "office" only; "Office of ..." is a proper name).
  { rule: "responsible-party", re: new RegExp(`\\b(?:${ROLE})\\s+(?:[A-Za-z][A-Za-z-]*\\s+){0,3}offices?\\b`, "g"), message: "\"office\" for whoever is responsible; say \"the person or area responsible\"" },
  { rule: "responsible-party", re: /\b(?:contact|ask|call|email|reach|notify|tell|check with|talk (?:to|with)|consult|report (?:it |this |them )?to|refer (?:it |them |the person )?to|send (?:it |this |them )?to)\s+(?:the|your|a|an|their|that)\s+(?:[A-Za-z][A-Za-z-]*\s+){0,3}offices?\b/g, message: "\"office\" names who to go to; say \"the person or area responsible\"" },
  // Retired terms.
  { rule: "retired-terms", re: /\bLeading with DE(?:I|IA|AI)\b/g, message: "MMB \"Leading with DEIA\" is held aside pending the owner's review" },
  { rule: "retired-terms", re: /\b(?:DEI|DEIA|DEAI|DEIB|IDEA(?=\s+(?:work|lens|principles|values|framework|council|committee|plan|office|team)))\b|\bDE&I\b|\bD&I\b/g, message: "DEI, DEIA or DEAI outside an official name; use People, Access and Culture wording" },
  { rule: "retired-terms", re: /\bdiversity,\s+equity,?\s+(?:and|&)\s+inclusion\b|\bdiversity,\s+equity,\s+inclusion,?\s+(?:and|&)\s+accessibility\b/gi, message: "spelled-out DEI or DEIA term outside an official name" },
  // System and participation notices.
  // "voluntary" and "optional" count when the sentence is about taking part in learning (not, say, a voluntary agency).
  { rule: "system-notices", re: new RegExp(`[^.!?\\n]*\\b(?:voluntar(?:y|ily)|optional(?:ly)?|self-paced)\\b[^.!?\\n]*`, "gi"), message: "participation language (voluntary, optional, self-paced)", sentence: PARTICIPATION_CONTEXT },
  { rule: "system-notices", re: /\btraining credits?\b|\bcompletion certificates?\b|\bcertificates? of completion\b|\bcompletion requirements?\b/gi, message: "training credit or completion notice" },
  { rule: "system-notices", re: /\b(?:nothing|no record|no copy|no data|no answers?|none of (?:this|it|your \w+))\b[^.!?;]{0,80}?\b(?:saved|stored|recorded|tracked|logged|kept|sent|collected|counted|shared)\b/gi, message: "notice about what is or is not saved, recorded or sent" },
  { rule: "system-notices", re: /\b(?:your|answers?|responses?|progress|notes?|choices?|reflections?|questions?|selections?|entries|activity|what you (?:type|write|enter|choose))\b[^.!?;]{0,40}?\b(?:is|are|stays?|remains?|will be|won't be|isn't|aren't)\s+(?:not\s+|never\s+|only\s+)?(?:saved|stored|recorded|tracked|logged|kept|sent|on (?:your|this) (?:device|computer|browser))\b/gi, message: "notice about what is or is not saved, recorded or kept" },
  { rule: "system-notices", re: /\bstays? (?:only )?(?:on|in) (?:your|this) (?:device|computer|browser)\b|\bkeeps? no (?:record|copy)\b|\bno sign-?in (?:is )?(?:needed|required)\b|\bwithout signing in\b/gi, message: "promise announced as a notice (kept, not announced)" },
  // Status and program labels.
  { rule: "status-labels", re: /\bcoming soon\b|\bto be (?:determined|announced|confirmed)\b|\bunder construction\b|\blorem ipsum\b|\bnot yet available\b|\bplaceholder\b/gi, message: "status label" },
  { rule: "status-labels", re: /\bTB[DA]\b/g, message: "status label (TBD/TBA)" },
  { rule: "status-labels", re: /\bProject recommendation\b|\bExisting DHS resource\b|\bProgram recommendation\b/gi, message: "program label (write the guidance directly)" },
  { rule: "status-labels", re: /^\(?\[?[Dd]raft\]?\)?:?$|^[Dd]raft:|\[[Dd]raft\]|\([Dd]raft\)|\bDRAFT\b/g, message: "\"draft\" status label" },
];

/** Program voice, checked only outside quotations. */
const PROGRAM_VOICE = /\b(?:[Ww]e|[Ww]e['’](?:re|ve|ll|d)|[Uu]s|[Oo]ur|[Oo]urs|[Oo]urselves)\b(?!\.S\.)/g;

/** Replace allowlisted phrases with spaces so indexes stay put. */
function mask(text: string, phrases: string[]): string {
  let out = text;
  for (const phrase of phrases) {
    if (!phrase || !out.includes(phrase)) continue;
    out = out.split(phrase).join(" ".repeat(phrase.length));
  }
  return out;
}

/** Remove quoted passages (straight or curly double quotes) for the rules that apply outside quotations. */
export function outsideQuotes(text: string): string {
  return text.replace(/"[^"\n]*"|“[^”\n]*”/g, match => " ".repeat(match.length));
}

const STOP_CAPS = new Set([
  "A", "I", "OK", "NO", "NOT", "AND", "OR", "THE", "FOR", "OF", "TO", "IN", "ON", "AT", "BY", "IS", "IT", "BE", "IF", "AS", "AN", "DO", "SO",
  "ALL", "NEW", "YOU", "YOUR", "WHAT", "WHO", "WHY", "HOW", "WHEN", "STOP", "NOTE", "TIP", "YES", "ONE", "TWO", "THREE", "NOW", "NEXT", "END",
  "AM", "PM", "TV", "DVD", "CD", "OR", "ME", "MY", "WE", "US", "UP", "GO", "SEE", "USE", "ASK", "LISTEN", "WATCH", "READ", "MORE", "LESS",
]);
const ROMAN = /^(?:[IVXLC]+)$/;
/** Reported under retired-terms, not again as acronyms. */
const RETIRED_ACRONYMS = new Set(["DEI", "DEIA", "DEAI", "DEIB", "AI", "LLM", "GPT", "TBD", "TBA", "DRAFT"]);

const NOT_NAMES = new Set([
  "This", "That", "These", "Those", "What", "Which", "Who", "Whose", "When", "Where", "Why", "How", "Someone", "Somebody", "Anyone", "Everyone",
  "Nobody", "Nothing", "Everything", "Each", "Every", "Neither", "Either", "Both", "One", "Another", "Other", "She", "He", "They", "It", "We",
  "You", "The", "Your", "Their", "His", "Her", "Its", "Our", "There", "Here", "Then", "Now", "Today", "Consultant", "Staff", "Team", "Manager",
  "Supervisor", "Director", "Leader", "Leadership", "Agency", "Department", "Division", "County", "State", "Minnesota", "Europe", "Policy",
  "Program", "Plan", "Equity", "Learning", "Practice", "Course", "Lesson", "Data", "Evidence", "Research", "Culture", "Language", "Trust",
  "Change", "Guidance", "Ask", "Support", "Community", "Family", "Person", "People", "Worker", "Coworker", "Colleague", "Interpreter", "Owner",
  "Employee", "Applicant", "Resident", "Client", "Member", "Partner", "Provider", "Facilitator", "Reviewer", "Analyst", "Specialist", "Officer",
  "Counselor", "Coordinator", "Chair", "Committee", "Council", "Board", "Office", "Unit", "Group", "Section", "Policy", "Draft", "Record",
  "Report", "Meeting", "Notice", "Letter", "Form", "Survey", "Session", "Training", "Module", "Step", "Example", "Scenario", "Case", "Story",
  "Account", "Answer", "Question", "Response", "Result", "Review", "Decision", "Option", "Choice", "Feedback", "Note", "Summary", "Source",
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Microsoft", "Google", "Teams", "Outlook", "Excel", "Word",
  "Everybody", "Many", "Most", "Some", "Few", "All", "Any", "Such", "Yet", "Still", "Also", "Instead", "Later", "Earlier", "First", "Next",
]);

/**
 * People in scenarios are often given first names. This finds names in this repository's own course and training text: a capitalized word
 * followed by a speaking or acting verb at least `min` times, that is not an ordinary word (its lower-case form is rare).
 */
export function discoverScenarioNames(texts: string[], min = 5): string[] {
  const counts = new Map<string, number>();
  const lower = new Map<string, number>();
  const verb = /\b([A-Z][a-z]{2,11})(?:['’]s)?\s+(?:says|said|asks|asked|explains|describes|wants|needs|tells|told|feels|notices|works|leads|writes|wrote|sends|sent|replies|responds|shares|mentions|arrives|calls|proposes|suggests|chooses|chose|decides|decided|thinks|knows|hears|reads|agrees|worries|offers|notes)\b/g;
  for (const text of texts) {
    for (const m of text.matchAll(verb)) if (!NOT_NAMES.has(m[1])) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  }
  const candidates = [...counts].filter(([, n]) => n >= min).map(([name]) => name);
  const wanted = new Set(candidates.map(name => name.toLowerCase()));
  for (const text of texts) for (const m of text.matchAll(/\b[a-z]{3,12}\b/g)) if (wanted.has(m[0])) lower.set(m[0], (lower.get(m[0]) ?? 0) + 1);
  return candidates.filter(name => (lower.get(name.toLowerCase()) ?? 0) < 3 && !CHARACTER_NAMES.includes(name)).sort();
}

/** Tracks acronym definitions within one unit (a page file, a course, a record), in reading order. */
export class AcronymTracker {
  private defined = new Set<string>();
  private reported = new Set<string>();
  private known: Record<string, string>;
  constructor(known: Record<string, string>) { this.known = known; }

  check(text: string): Finding[] {
    const findings: Finding[] = [];
    // Definitions anywhere in this string count from here on: "Full Name (ABC)" and "ABC (Full Name)".
    for (const m of text.matchAll(/([A-Za-z][\w'’-]*(?:[\s-]+[\w'’&-]+){0,12})\s*\(\s*([A-Z][A-Za-z0-9&]{1,9}?)s?\s*\)/g)) this.defined.add(m[2]);
    for (const m of text.matchAll(/\b([A-Z][A-Z0-9&]{1,9})s?\s*\(\s*([A-Z][a-z]+)/g)) this.defined.add(m[1]);
    for (const m of text.matchAll(/\b[A-Z][A-Z0-9&]*[A-Z][A-Z0-9&]*(?:s)?\b/g)) {
      const raw = m[0];
      const token = raw.endsWith("s") && /[A-Z]s$/.test(raw) ? raw.slice(0, -1) : raw;
      const letters = token.replace(/[^A-Z]/g, "");
      if (letters.length < 2 || token.length > 10 || STOP_CAPS.has(token) || ROMAN.test(token) || RETIRED_ACRONYMS.has(token)) continue;
      if (this.known[token] !== undefined || this.known[raw] !== undefined) continue;
      // Part of an all-capitals phrase (a heading in capitals), not an acronym.
      const before = text.slice(Math.max(0, m.index - 30), m.index);
      const after = text.slice(m.index + raw.length, m.index + raw.length + 30);
      if (/\b[A-Z]{3,}[\s:,-]+$/.test(before) && /^[\s:,-]+[A-Z]{3,}\b/.test(after)) continue;
      if (/^[\s,-]*[A-Z]{3,}\s+[A-Z]{3,}\b/.test(after) || /\b[A-Z]{3,}\s+[A-Z]{3,}[\s,-]*$/.test(before)) continue;
      if (this.defined.has(token) || this.reported.has(token)) continue;
      this.reported.add(token);
      findings.push({ rule: "acronyms", match: token, index: m.index, message: `"${token}" used before it is spelled out` });
    }
    return findings;
  }
}

export type LintOptions = {
  allowlist: Allowlist;
  /** Shared across the strings of one unit, in reading order, for the acronym rule. */
  acronyms?: AcronymTracker;
  /** Names rule: true for courses, trainings and scenarios (people there are described by role). */
  checkNames?: boolean;
  /** Extra names found in this repository's scenarios (see discoverScenarioNames). */
  names?: string[];
  /** The string is a line someone speaks in a scenario (dialogue): program voice does not apply. */
  speech?: boolean;
};

const nameRes = new Map<string, RegExp>();
function namePattern(names: string[]): RegExp {
  const key = names.join("|");
  let re = nameRes.get(key);
  if (!re) { re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${key})(?![\\p{L}\\p{N}]|[-'’]\\p{L})`, "gu"); nameRes.set(key, re); }
  return re;
}

/** Addresses, markdown link targets and markup are not read as words (a URL like /who-we-are is not program voice). */
export function readableText(text: string): string {
  return text
    .replace(/\]\([^)\s]*\)/g, m => "]" + " ".repeat(m.length - 1))
    .replace(/\b(?:https?:\/\/|www\.)[^\s)>\]"']+/g, m => " ".repeat(m.length))
    .replace(/<[^>]{1,400}>/g, m => " ".repeat(m.length))
    .replace(/&[a-z]+;|&#\d+;/g, m => " ".repeat(m.length));
}

const BRAND_HINT = /AI\b|artificial|LLM|GPT|chat|Claude|Anthropic|OpenAI|Gemini|Copilot|Perplexity|Vercel|digital twin|[✓✔✗✘★☆●▶►▲▼◆■□]|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/iu;

/** Lint one visible string. Returns every rule hit; empty means clean. */
export function lintText(text: string, options: LintOptions): Finding[] {
  const { allowlist } = options;
  const masked = mask(readableText(text), [...allowlist.directQuotes, ...allowlist.officialNames, ...allowlist.publicFigures]);
  const findings: Finding[] = [];
  // The brand lint runs many patterns; only strings that could match need it.
  if (BRAND_HINT.test(masked)) for (const finding of lintStaffCopy(masked, { allowInternal: true })) {
    if (finding.code === "model_brand") findings.push({ rule: "banned-words", match: finding.match.trim(), index: finding.index, message: `"${finding.match.trim()}": banned word or model brand in visible text` });
  }
  for (const pattern of PATTERNS) {
    pattern.re.lastIndex = 0;
    // A status label quoted from someone else's website ("Coming Soon") is reported speech, not a program label.
    for (const m of (pattern.rule === "status-labels" ? outsideQuotes(masked) : masked).matchAll(pattern.re)) {
      if (pattern.sentence) {
        if (!pattern.sentence.test(m[0])) continue;
        const word = /\b(?:voluntar(?:y|ily)|optional(?:ly)?|self-paced)\b/i.exec(m[0]);
        findings.push({ rule: pattern.rule, match: word?.[0] ?? m[0].trim(), index: (m.index ?? 0) + (word?.index ?? 0), message: pattern.message });
        continue;
      }
      findings.push({ rule: pattern.rule, match: m[0], index: m.index ?? 0, message: pattern.message });
    }
  }
  // The display rewrite in lib/content/responsible-wording.ts catches forms the patterns above may miss.
  if (!findings.some(f => f.rule === "responsible-party") && /offices?\b/.test(masked) && responsibleWording(masked) !== masked) {
    const at = masked.search(/\boffices?\b/);
    findings.push({ rule: "responsible-party", match: masked.slice(Math.max(0, at - 30), at + 6).trim(), index: at, message: "\"office\" for whoever is responsible (responsibleWording would rewrite it)" });
  }
  const unquoted = outsideQuotes(masked);
  if (!options.speech) for (const m of unquoted.matchAll(PROGRAM_VOICE)) findings.push({ rule: "program-voice", match: m[0], index: m.index ?? 0, message: `program voice "${m[0]}" outside a quotation` });
  if (options.checkNames) {
    for (const m of masked.matchAll(namePattern([...CHARACTER_NAMES, ...(options.names ?? [])]))) {
      findings.push({ rule: "names", match: m[0], index: m.index ?? 0, message: `name "${m[0]}" for a person in a course or training; describe the person by role` });
    }
  }
  if (options.acronyms) findings.push(...options.acronyms.check(masked));
  // One finding per rule and position.
  const seen = new Set<string>();
  return findings.filter(f => { const k = `${f.rule}:${f.index}`; if (seen.has(k)) return false; seen.add(k); return true; });
}

/** Convenience for callers that lint one free-standing string (an Ask answer, a training line). */
export function lintStandalone(text: string, allowlist = loadAllowlist(), options: Partial<LintOptions> = {}): Finding[] {
  return lintText(text, { allowlist, acronyms: new AcronymTracker(allowlist.knownAcronyms), ...options });
}

export { escape as escapeRegExp };
