import { recommendTrack } from "./instrument";
import type { ToolkitRouting, ToolkitScope, ToolkitTrack } from "./instrument";

// Automatic setup for the toolkit: read a document's title and text, suggest the
// track, the four routing answers, the programs it names, the scope and a drafted
// analysis question. Pure and deterministic. Every suggestion is advisory: the
// person running the analysis decides, and nothing is applied without their choice.

/**
 * Program and service names from the policy catalog (lib/content/hub/dsd-policies.json,
 * the `programs` field of each policy). Kept here so the client bundle does not carry
 * the whole catalog; a test checks this list still covers the catalog.
 */
export const KNOWN_PROGRAMS = [
  "Brain Injury Waiver", "Community Alternative Care Waiver", "Community Access for Disability Inclusion Waiver",
  "Developmental Disabilities Waiver", "Alternative Care", "Elderly Waiver", "Essential Community Supports",
  "Consumer Support Grant", "Medical Assistance", "Community First Services and Supports", "Personal Care Assistance",
  "Disability waiver rate system", "Waiver Reimagine", "Semi-Independent Living Services",
  "Intermediate Care Facilities for Persons with Developmental Disabilities", "Adult foster care",
  "Community residential settings", "Day services", "Consumer-Directed Community Supports", "Family support grants",
  "Day training and habilitation", "Public guardianship for persons with developmental disabilities",
  "Parent-to-parent peer support grant", "Transition to Community Initiative", "Disability policy reporting",
  "Senior LinkAge Line", "Disability Hub", "Preadmission screening", "Medical Assistance for Employed Persons with Disabilities",
  "Medical Assistance home care services", "Housing access grants", "Early Intensive Developmental and Behavioral Intervention",
  "MnCHOICES", "Medical Assistance procurement", "Developmental disabilities case management",
  "Targeted case management for vulnerable adults and adults with developmental disabilities",
  "State traumatic brain injury program", "Regional quality councils", "Vulnerable adult protection", "Public guardianship",
  "Rule 185 case management", "Relocation service coordination targeted case management",
  "Vulnerable adult and developmental disability targeted case management", "Positive supports", "Positive support services",
  "245D licensed home and community-based services", "Housing Stabilization Services", "Medical Assistance home care",
  "Mental health targeted case management", "Relocation service coordination", "Integrated community supports",
  "Customized living", "Minnesota Olmstead Plan",
] as const;

/** Short forms people write in documents, each mapped to a program's full name. Only unambiguous forms are listed. */
const PROGRAM_ALIASES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bCADI\b/, "Community Access for Disability Inclusion Waiver"],
  [/\bDD\s+waiver\b/i, "Developmental Disabilities Waiver"],
  [/\bBI\s+waiver\b/i, "Brain Injury Waiver"],
  [/\bCAC\b/, "Community Alternative Care Waiver"],
  [/\bCFSS\b/, "Community First Services and Supports"],
  [/\bPCA\b/, "Personal Care Assistance"],
  [/\bCDCS\b/, "Consumer-Directed Community Supports"],
  [/\bCSG\b/, "Consumer Support Grant"],
  [/\bEIDBI\b/, "Early Intensive Developmental and Behavioral Intervention"],
  [/\bSILS\b/, "Semi-Independent Living Services"],
  [/\bDT&H\b/, "Day training and habilitation"],
  [/\bDWRS\b/, "Disability waiver rate system"],
  [/\bMA-EPD\b/, "Medical Assistance for Employed Persons with Disabilities"],
  [/\bICFs?\/(?:DD|IID)\b/, "Intermediate Care Facilities for Persons with Developmental Disabilities"],
  [/\bHSS\b/, "Housing Stabilization Services"],
  [/\bOlmstead Plan\b/i, "Minnesota Olmstead Plan"],
  [/\belderly waiver\b/i, "Elderly Waiver"],
];

/** Organization names written in full for visible text. */
const FULL_NAMES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bADSA\b/g, "Aging and Disability Services Administration"],
  [/(?<!One )\bDSD\b/g, "Disability Services Division"],
  [/(?<!One )\bDHS\b/g, "Department of Human Services"],
  [/\bGARE\b/g, "Government Alliance on Race and Equity"],
  [/\bLTSS\b/g, "long-term services and supports"],
  [/\bCLAS\b/g, "culturally and linguistically appropriate services"],
];

/** Writes organization names in full and keeps role wording neutral for visible text. */
export function fullNames(text: string): string {
  let value = text;
  for (const [pattern, name] of FULL_NAMES) value = value.replace(pattern, name);
  return value
    .replace(/The consultant may select a track and record the reason\./g, "You may select a track and record the reason.")
    .replace(/editable consultant guidance/g, "editable guidance")
    .replace(/Adapted consultant scan prompt\./g, "Adapted scan prompt.")
    .replace(/supplied by the consultant/g, "supplied to this program")
    .replace(/a concise consultant worksheet/gi, match => match[0] === "A" ? "A concise worksheet" : "a concise worksheet");
}

export type SetupSignal = { key: keyof ToolkitRouting; phrase: string };
export type SuggestedSetup = {
  title: string;
  track: ToolkitTrack;
  routing: ToolkitRouting;
  /** One reason per detected signal, each quoting the short phrase that triggered it. */
  reasons: string[];
  /** The phrases behind each routing answer, for showing beside that answer. */
  signals: SetupSignal[];
  /** Why the suggested track follows from the routing answers, in role-neutral words. */
  trackReasons: string[];
  programs: string[];
  scope: ToolkitScope;
  scopeReason: string;
  suggestedQuestion: string;
  advisory: string;
};

export const SETUP_ADVISORY = "Suggested; you decide. Nothing is applied until you choose it.";

const MONTH = "(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)\\.?";
const DATE = `(?:${MONTH}\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?|${MONTH}\\s+\\d{4}|\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}|\\d{4}-\\d{2}-\\d{2})`;
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const SIGNALS: Record<keyof ToolkitRouting, RegExp[]> = {
  materialChange: [
    /\b(?:new|revised|changed?|changes|changing|updated?|amended?|proposed|replac\w*|eliminat\w*|reduc\w*|increas\w*|expand\w*|end(?:s|ing)?|implement\w*|modif\w*|restructur\w*)\b[^.\n;]{0,50}?\b(?:requirements?|eligibility|rates?|services?|timelines?|staffing|contracts?|criteria|procedures?|policy|policies|budgets?|funding|fees?|hours|caseloads?|benefits?)\b/i,
    /\b(?:requirements?|eligibility|rates?|services?|timelines?|staffing|contracts?|criteria|policy|policies)\b[^.\n;]{0,40}?\b(?:will|would|to)\s+(?:change|be (?:changed|reduced|increased|eliminated|replaced|revised|added))\b/i,
    // A new obligation stated against the current one: "must ... within 30 days instead of the current 60 days".
    /\b(?:must|shall|will be required to|are required to)\b[^.\n;]{0,160}?\b(?:instead of|rather than|in place of)\b[^.\n;]{0,30}?\b(?:the\s+)?(?:current|existing|previous|present)\b/i,
  ],
  knownDisparities: [
    /\b(?:disparit(?:y|ies)|inequit(?:y|ies|able)|over-?represent\w*|under-?represent\w*|disproportionat\w*)\b/i,
    /\b(?:gaps?|differences?|lower rates?|higher rates?)\b[^.\n;]{0,40}?\b(?:by|across|between|among|for)\b[^.\n;]{0,40}?\b(?:race|racial|ethnic\w*|language|disabilit\w*|county|counties|Tribal|rural|gender|age)\b/i,
  ],
  timeLimited: [
    /\b(?:urgent(?:ly)?|deadline|as soon as possible|time[- ]sensitive|expedited?|immediately)\b/i,
    new RegExp(`\\b(?:by|due|before|no later than|effective|takes effect|starting|beginning|deadline (?:of|is))\\s+(?:on\\s+)?${DATE}`, "i"),
  ],
  priorAnalysisIntegrated: [
    /\b(?:prior|previous|earlier|completed|existing|past|original|\d{4})\s+(?:full\s+|racial\s+)?equity\s+(?:analysis|analyses|scan|review|impact assessment)\b/i,
    /\bequity\s+(?:analysis|scan|review)\s+(?:was|were|has been|had been)\s+(?:completed|conducted|done|integrated|incorporated|finished)\b/i,
    /\b(?:recommendations|findings|results)\s+(?:from|of)\s+(?:the|a|an|our)\s+(?:\d{4}\s+)?(?:full\s+)?equity\s+(?:analysis|scan|review)\b/i,
  ],
};

const SIGNAL_LABELS: Record<keyof ToolkitRouting, string> = {
  materialChange: "Material change",
  knownDisparities: "Known disparities",
  timeLimited: "Time limit",
  priorAnalysisIntegrated: "A prior equity analysis or scan",
};

const shortPhrase = (value: string) => {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= 90 ? text : `${text.slice(0, 87).trimEnd()}…`;
};

function parseDate(value: string): Date | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
  const numeric = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(value);
  if (numeric) { const year = +numeric[3] < 100 ? 2000 + +numeric[3] : +numeric[3]; return new Date(Date.UTC(year, +numeric[1] - 1, +numeric[2])); }
  const named = /^([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/.exec(value);
  if (named) { const month = MONTHS.indexOf(named[1].slice(0, 3).toLowerCase()); if (month >= 0) return new Date(Date.UTC(+named[3], month, +named[2])); }
  return null;
}

/** A date written in the text that falls within the next 180 days of `today`. */
function upcomingDate(text: string, today: Date): string | null {
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  for (const match of text.matchAll(new RegExp(DATE, "gi"))) {
    const date = parseDate(match[0].replace(/\s+/g, " ").trim());
    if (date && date.getTime() >= start && date.getTime() <= start + 180 * 86_400_000) return match[0];
  }
  return null;
}

/** Program names (full) found in the text, in the order they first appear. */
export function detectPrograms(text: string): string[] {
  const hits: { start: number; end: number; name: string }[] = [];
  for (const name of KNOWN_PROGRAMS) {
    const pattern = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[- ]/g, "[- ]")}\\b`, "gi");
    for (const match of text.matchAll(pattern)) hits.push({ start: match.index!, end: match.index! + match[0].length, name });
  }
  for (const [alias, name] of PROGRAM_ALIASES) {
    const pattern = new RegExp(alias.source, alias.flags.includes("g") ? alias.flags : alias.flags + "g");
    for (const match of text.matchAll(pattern)) hits.push({ start: match.index!, end: match.index! + match[0].length, name });
  }
  // A name inside a longer matched name (Medical Assistance inside Medical Assistance home care) is not counted separately.
  const kept = hits.filter(hit => !hits.some(other => other !== hit && other.start <= hit.start && other.end >= hit.end && other.end - other.start > hit.end - hit.start));
  kept.sort((a, b) => a.start - b.start);
  return [...new Set(kept.map(hit => hit.name))];
}

function detectScope(text: string): { scope: ToolkitScope; reason: string } {
  const checks: [ToolkitScope, RegExp, string][] = [
    ["agency", /\b(?:department[- ]wide|agency[- ]wide|across the department|all (?:Department of Human Services|DHS) (?:programs|staff|divisions))\b/i, "the document describes work across the Department of Human Services"],
    ["administration", /\b(?:administration[- ]wide|across the administration|Aging and Disability Services Administration|ADSA)\b/i, "the document names the Aging and Disability Services Administration"],
    ["team", /\b(?:our team|the team's|within the team|unit procedures?|team procedures?)\b/i, "the document describes a team's own procedures"],
    ["individual", /\b(?:my own (?:work|practice)|individual work plan)\b/i, "the document describes one person's own work"],
  ];
  for (const [scope, pattern, reason] of checks) { const match = pattern.exec(text); if (match) return { scope, reason: `Scope: ${reason} (“${shortPhrase(match[0])}”).` }; }
  return { scope: "division", reason: "Scope: the Disability Services Division is the usual scope for this work; no wider or narrower scope was found in the document." };
}

const list = (items: string[]) => items.length <= 1 ? items.join("") : items.length === 2 ? `${items[0]} and ${items[1]}` : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

function draftQuestion(title: string, programs: string[], routing: ToolkitRouting, change: string | null): string {
  const subject = title ? `“${title}”` : change ? `the change described (“${change}”)` : "the proposal in this document";
  const people = programs.length ? `people served by ${list(programs.slice(0, 4))}` : "the people it reaches";
  const disparities = routing.knownDisparities ? ", including the disparities the document describes" : "";
  return `How would ${subject} affect ${people} differently by race, ethnicity, language, disability, age and county${disparities}, and what changes would reduce unequal burdens and widen the benefits?`;
}

export function suggestSetup(input: { title: string; text: string }, options: { today?: Date } = {}): SuggestedSetup {
  const text = `${input.title}\n${input.text}`;
  const routing: ToolkitRouting = { priorAnalysisIntegrated: false, materialChange: false, knownDisparities: false, timeLimited: false };
  const signals: SetupSignal[] = [];
  for (const key of Object.keys(SIGNALS) as (keyof ToolkitRouting)[]) {
    for (const pattern of SIGNALS[key]) {
      const match = pattern.exec(text);
      if (match) { routing[key] = true; signals.push({ key, phrase: shortPhrase(match[0]) }); break; }
    }
  }
  if (!routing.timeLimited && options.today) {
    const date = upcomingDate(text, options.today);
    if (date) { routing.timeLimited = true; signals.push({ key: "timeLimited", phrase: shortPhrase(date) }); }
  }
  const reasons = signals.map(signal => `${SIGNAL_LABELS[signal.key]}: the document says “${signal.phrase}”.`);
  for (const key of Object.keys(SIGNAL_LABELS) as (keyof ToolkitRouting)[]) if (!routing[key]) reasons.push(`${SIGNAL_LABELS[key]}: nothing in the document points to this. Change it if you know otherwise.`);
  const recommendation = recommendTrack(routing);
  const programs = detectPrograms(text);
  const { scope, reason: scopeReason } = detectScope(text);
  const title = input.title.trim() || (input.text.split("\n").map(line => line.trim()).find(line => line.length > 3) ?? "").slice(0, 120);
  const change = signals.find(signal => signal.key === "materialChange")?.phrase ?? null;
  return {
    title, track: recommendation.track, routing, reasons, signals,
    trackReasons: recommendation.reasons.map(fullNames),
    programs, scope, scopeReason,
    suggestedQuestion: draftQuestion(input.title.trim(), programs, routing, change),
    advisory: SETUP_ADVISORY,
  };
}
