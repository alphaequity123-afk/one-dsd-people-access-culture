/**
 * Shared pieces of the Ask evals (docs/EVALS-STUDY.md, section 6: A1, A2, A3, A4, A13):
 * the golden-set schema and loader, the source-slug resolver, and the text checks used offline and live.
 * Runs under plain Node (type stripping) and under vitest, so it uses relative `.ts` imports and no path aliases.
 * Everything here reads published content or synthetic eval data only. Nothing reads, counts or stores anyone's questions.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const HERE = fileURLToPath(new URL("./", import.meta.url));

export const CLASSES = ["library", "partial", "general", "dsd-model", "same-name", "decision", "tribal", "follow-up"] as const;
export type GoldenClass = (typeof CLASSES)[number];
/** Target mix from EVALS-STUDY A1. */
export const CLASS_TARGETS: Record<GoldenClass, number> = { library: 60, partial: 25, general: 15, "dsd-model": 15, "same-name": 10, decision: 10, tribal: 10, "follow-up": 5 };

/**
 * The ten DHS job families (DHS workforce and job competencies, 2026-11-13). This codebase has no data/workforce yet;
 * when the unified build brings lib/workforce/matrix.ts in, read the ids from there instead of this copy.
 */
export const FAMILIES = ["executive", "managers", "supervisors", "policy-program", "licensing-integrity", "eligibility-public", "data-research", "finance-contracts", "enterprise-services", "admin-support"] as const;
/** The nine areas of work (lib/product/work-areas.ts). */
export const AREAS = ["workforce_equity", "policy_program_service_design", "community_engagement_co_design", "accessibility_language_access", "culture_trust_repair", "leadership_systems_change", "data_research_quality_measurement", "fiscal_grants_procurement_contracts", "communications_public_information"] as const;

export type Turn = { question: string; answer: string };
export type GoldenItem = {
  id: string;
  class: GoldenClass;
  question: string;
  history?: Turn[];
  family: string | null;
  area: string | null;
  /** `kind:id`, for example `resource:ja-language-access-checklist`; see SOURCE_KINDS. */
  expectedSources: string[];
  /** Short statements; words in [brackets] are cues that must appear (a|b means either). */
  requiredFacts: string[];
  /** Conditions, exceptions and limits a correct answer keeps, in the same cue form. */
  conditions: string[];
  /** Human-readable claims a correct answer never makes (checked by a person or the model grader). */
  forbiddenClaims: string[];
  /** Case-insensitive regular expressions for forbidden claims that can be caught offline. */
  forbiddenPatterns?: string[];
  /** A DHS-specific rule the library does not hold: the answer must not invent it and must name who decides. */
  unknownLocalRule?: boolean;
  /** Where the item came from (an existing readiness or live case), for provenance. */
  seed?: string;
};
export type PrivatePrompt = { id: string; question: string; privateDetails: string[]; requiredFacts: string[]; seed?: string };
export type FamilyPairs = { purpose: string; familyCookie: string; settings: Array<string | null>; questions: string[] };
export type StockList = {
  version: string; minimumWords: number;
  phrases: Array<{ id: string; pattern: string }>;
  faults: Array<{ id: string; title: string; layer: string; applicable?: boolean }>;
  questions: Array<{ id: string; question: string }>;
};

const readJsonl = <T>(file: string): T[] => readFileSync(file, "utf8").split(/\r?\n/).filter(line => line.trim()).map((line, index) => {
  try { return JSON.parse(line) as T; } catch { throw new Error(`${file}: line ${index + 1} is not valid JSON`); }
});
export const loadGolden = (file = HERE + "golden.jsonl") => readJsonl<GoldenItem>(file);
export const loadPrivatePrompts = (file = HERE + "private-prompts.jsonl") => readJsonl<PrivatePrompt>(file);
export const loadFamilyPairs = (file = HERE + "family-pairs.json") => JSON.parse(readFileSync(file, "utf8")) as FamilyPairs;
export const loadStockList = (file = HERE + "stock-replies.json") => JSON.parse(readFileSync(file, "utf8")) as StockList;

/* ------------------------------------------------------------------ sources */

export const SOURCE_KINDS = ["resource", "path", "brief", "agency", "reading", "org", "scenario", "program", "page"] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

type Catalog = Record<Exclude<SourceKind, "page">, Set<string>> & { orgUrls: Map<string, string[]> };
let catalog: Catalog | undefined;
const read = (path: string) => readFileSync(ROOT + path, "utf8");
const ids = (text: string, pattern: RegExp) => new Set(Array.from(text.matchAll(pattern), match => match[1]));

/** The published content this codebase ships, read from its own data files (no database, no network). */
export function contentCatalog(): Catalog {
  if (catalog) return catalog;
  const resourceFiles = ["lib/content/corpus.ts", "lib/content/corpus-domains.ts", "lib/content/engagement-resources.ts", "lib/content/policy-presentation.ts"];
  const resource = new Set<string>();
  for (const file of resourceFiles) for (const id of ids(read(file), /\bid:\s*["']((?:pn|ja|lm|ext|tool|ref)-[a-z0-9-]+)["']/g)) resource.add(id);
  const path = new Set<string>();
  for (const file of ["lib/content/paths.ts", "lib/content/paths-domain.ts", "lib/content/paths-practice-infrastructure.ts"]) for (const id of ids(read(file), /\bid:\s*"(gp-\d+)"/g)) path.add(id);
  const brief = ids(read("lib/content/briefs.ts"), /^ {4}id: "([a-z0-9-]+)"/gm);
  const agencies = JSON.parse(read("lib/content/state-agencies.json")) as { agencies: Array<{ id: string }> };
  const partners = JSON.parse(read("lib/content/public-partners.json")) as { partners: Array<{ id: string }> };
  const agency = new Set([...agencies.agencies, ...partners.partners].map(entry => entry.id));
  const reading = new Set(readdirSync(ROOT + "data/source-readings").filter(name => /^[a-f0-9]{20}\.json$/.test(name)).map(name => name.slice(0, -5)));
  const org = JSON.parse(read("data/organization/minnesota-dhs.json")) as { sources: Array<{ id: string; url: string }>; entries: Array<{ id: string; sourceIds: string[] }> };
  const orgUrls = new Map(org.entries.map(entry => [entry.id, entry.sourceIds.flatMap(id => org.sources.filter(source => source.id === id).map(source => source.url))]));
  const dsd = read("lib/dsd/index.ts");
  const split = dsd.indexOf("export const DSD_SCENARIOS");
  const program = ids(dsd.slice(0, split), /^ {4}id: "([a-z0-9-]+)"/gm);
  const scenario = ids(dsd.slice(split), /^ {4}id: "(dsd-[a-z0-9-]+)"/gm);
  return catalog = { resource, path, brief, agency, reading, org: new Set(orgUrls.keys()), orgUrls, scenario, program };
}

/** Whether `kind:id` names something this codebase publishes. Returns a reason when it does not. */
export function resolveSource(slug: string): string | undefined {
  const at = slug.indexOf(":");
  const kind = slug.slice(0, at) as SourceKind;
  const id = slug.slice(at + 1);
  if (at < 1 || !id) return `${slug}: expected kind:id`;
  if (!(SOURCE_KINDS as readonly string[]).includes(kind)) return `${slug}: unknown kind ${kind}`;
  if (kind === "page") {
    const route = id.split(/[?#]/)[0].replace(/\/$/, "");
    if (!route.startsWith("/")) return `${slug}: a page must start with /`;
    return existsSync(`${ROOT}app${route}/page.tsx`) ? undefined : `${slug}: no app${route}/page.tsx`;
  }
  return contentCatalog()[kind].has(id) ? undefined : `${slug}: not found among published ${kind} ids`;
}

/** The links a cited source may carry for an expected `kind:id`. */
export function sourceHrefs(slug: string): string[] {
  const at = slug.indexOf(":");
  const kind = slug.slice(0, at) as SourceKind;
  const id = slug.slice(at + 1);
  switch (kind) {
    case "resource": return [`/library/${id}`, `/resources/${id}`];
    case "path": return [`/practice/${id}`, `/paths/${id}`];
    case "brief": return [`/minnesota-communities/${id}`];
    case "agency": return [`/minnesota-agencies/${id}`];
    case "reading": return [`/source-reading/${id}`];
    case "org": return [`/understanding-dhs#${id.replace(/^ext-dhs-org-/, "")}`, ...(contentCatalog().orgUrls.get(id) ?? [])];
    case "scenario": return [`/one-dsd/scenarios/${id}`];
    case "program": return [`/one-dsd/programs/${id}`];
    case "page": return [id];
    default: return [];
  }
}

const normalizeHref = (href: string, origin?: string) => {
  let value = href.trim();
  if (origin && value.startsWith(origin)) value = value.slice(origin.length) || "/";
  return value.replace(/\/(?=$|[?#])/, "");
};
/** True when a cited link is the expected source (same path, a deeper path, or the same page with a query). */
export function hrefMatches(cited: string, slug: string, origin?: string): boolean {
  const href = normalizeHref(cited, origin);
  return sourceHrefs(slug).some(raw => {
    const want = normalizeHref(raw, origin);
    if (want.includes("#")) return href === want || href.startsWith(want + "-");
    const path = href.split(/[?#]/)[0];
    return path === want || path.startsWith(want + "/") || (/^https?:/.test(want) && href.replace(/\/$/, "") === want.replace(/\/$/, ""));
  });
}

/* ------------------------------------------------------------------ text checks */

export const words = (text: string) => text.trim().split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word)).length;

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const STOP = new Set("a an and are as at be by can for from has have how if in is it its of on or that the their them they this to was what when where which who will with you your not no".split(" "));
/** The cue groups of a fact: each [a|b] group, or, with no brackets, its content words. */
export function cues(fact: string): string[][] {
  const groups = Array.from(fact.matchAll(/\[([^\]]+)\]/g), match => match[1].split("|").map(part => part.trim()).filter(Boolean));
  return groups;
}
/** Whether an answer states a fact, judged offline from its cue words (a word-start match, so "interpret" matches "interpreter"). */
export function statesFact(answer: string, fact: string): boolean {
  const groups = cues(fact);
  const text = answer.replace(/[’‘]/g, "'");
  if (groups.length) return groups.every(group => group.some(cue => new RegExp(`(?:^|[^\\p{L}\\p{N}])${escape(cue.replace(/[’‘]/g, "'"))}`, "iu").test(text)));
  const content = fact.toLowerCase().match(/[a-z0-9-]{3,}/g)?.filter(word => !STOP.has(word)) ?? [];
  if (!content.length) return true;
  const lower = text.toLowerCase();
  return content.filter(word => lower.includes(word.slice(0, Math.max(4, word.length - 2)))).length / content.length >= 0.5;
}
export function bracketProblems(text: string): string | undefined {
  let depth = 0;
  for (const character of text) {
    if (character === "[") depth++;
    if (character === "]") depth--;
    if (depth < 0 || depth > 1) return "unbalanced brackets";
  }
  if (depth) return "unbalanced brackets";
  if (/\[\s*\]|\[\s*\||\|\s*\]/.test(text)) return "empty cue";
  return undefined;
}

export function stockMatcher(list: StockList = loadStockList()) {
  const compiled = list.phrases.map(phrase => ({ id: phrase.id, re: new RegExp(phrase.pattern, "imu") }));
  return (text: string) => {
    const straight = text.replace(/[’‘]/g, "'");
    return compiled.filter(phrase => phrase.re.test(text) || phrase.re.test(straight)).map(phrase => phrase.id);
  };
}

/** Owner wording rules for anything Ask shows: "the person or area responsible", never "office"; never "AI" or "tutor". */
export function wordingProblems(text: string): string[] {
  const problems: string[] = [];
  for (const match of text.matchAll(/\boffices?\b/gi)) {
    const after = text.slice(match.index!, match.index! + 40);
    const before = text.slice(Math.max(0, match.index! - 40), match.index!);
    // Official names stay as they are: "Office of Indian Policy", "the State Fire Marshal Office", "Legislative Auditor's Office".
    const official = /^Offices? of (?:the )?[A-Z]/.test(after) || /[A-Z][\w'’]*\s$/.test(before) && /^Office\b/.test(after);
    if (!official) problems.push(`"office": …${(before + after).replace(/\s+/g, " ").trim()}…`);
  }
  if (/\bAI\b/.test(text) || /\bartificial intelligence\b/i.test(text)) problems.push('"AI"');
  if (/\btutor(?:s|ing)?\b/i.test(text)) problems.push('"tutor"');
  return problems;
}

/* ------------------------------------------------------------------ validation */

export function validateGolden(items: GoldenItem[]): { problems: string[]; counts: Record<string, number>; unresolved: string[] } {
  const problems: string[] = [];
  const unresolved: string[] = [];
  const seen = new Set<string>();
  const counts: Record<string, number> = {};
  for (const item of items) {
    const where = item?.id ?? "(no id)";
    const bad = (message: string) => problems.push(`${where}: ${message}`);
    if (typeof item.id !== "string" || !/^[a-z]{3,4}-\d{3}$/.test(item.id)) bad("id must look like lib-001");
    if (seen.has(item.id)) bad("duplicate id");
    seen.add(item.id);
    if (!(CLASSES as readonly string[]).includes(item.class)) bad(`unknown class ${item.class}`);
    counts[item.class] = (counts[item.class] ?? 0) + 1;
    if (typeof item.question !== "string" || !item.question.trim() || item.question.length > 4000) bad("question must be 1 to 4000 characters (the Ask API limit)");
    if (item.history !== undefined) {
      if (!Array.isArray(item.history) || !item.history.length || item.history.length > 4) bad("history must hold 1 to 4 turns");
      else for (const turn of item.history) if (typeof turn?.question !== "string" || typeof turn?.answer !== "string" || turn.question.length > 1000 || turn.answer.length > 2500) bad("each history turn needs question (<=1000) and answer (<=2500)");
    }
    if (item.class === "follow-up" && !item.history) bad("a follow-up needs an earlier exchange");
    if (item.class !== "follow-up" && item.history) bad("only follow-ups carry history");
    if (item.family !== null && !(FAMILIES as readonly string[]).includes(item.family)) bad(`unknown job family ${item.family}`);
    if (item.area !== null && !(AREAS as readonly string[]).includes(item.area)) bad(`unknown area ${item.area}`);
    for (const key of ["expectedSources", "requiredFacts", "conditions", "forbiddenClaims"] as const) {
      if (!Array.isArray(item[key]) || item[key].some(value => typeof value !== "string" || !value.trim())) bad(`${key} must be an array of text`);
    }
    if (!item.requiredFacts?.length) bad("needs at least one required fact");
    for (const text of [...(item.requiredFacts ?? []), ...(item.conditions ?? [])]) { const issue = bracketProblems(text); if (issue) bad(`${issue} in "${text}"`); }
    for (const pattern of item.forbiddenPatterns ?? []) { try { new RegExp(pattern, "i"); } catch { bad(`forbidden pattern does not compile: ${pattern}`); } }
    for (const slug of item.expectedSources ?? []) { const issue = resolveSource(slug); if (issue) { unresolved.push(`${where}: ${issue}`); } }
    if (item.class === "library" && !item.expectedSources.length) bad("a library-covered item needs an expected source");
    if (item.class === "general" && item.expectedSources.length) bad("a general item has no program source");
    if (item.class === "tribal" && !item.expectedSources.includes("page:/learn/tribal-referral")) bad("a Tribal item expects the Tribal referral page");
    if (item.class === "tribal" && !item.requiredFacts.some(fact => /Indian Policy|Tribal liaison/.test(fact))) bad("a Tribal item requires the referral to the responsible Tribal liaison");
    if (item.class === "decision" && !(item.forbiddenPatterns?.length)) bad("a decision item needs forbidden patterns for deciding on the person's behalf");
    if (item.unknownLocalRule && ![...item.requiredFacts, ...item.conditions].some(fact => /responsible|policy owner|HR|Human Resources|records|data owner|supervisor/.test(fact))) bad("an unknown-local-rule item must require naming who decides");
    // Synthetic only: no contact details or identifiers in the golden set (A13's private prompts live in their own file).
    if (/\b\d{3}-\d{2}-\d{4}\b|\b\d{3}[-.]\d{3}[-.]\d{4}\b|@[a-z0-9-]+\.[a-z]/i.test(JSON.stringify(item))) bad("contains an identifier or contact detail");
  }
  for (const klass of CLASSES) if ((counts[klass] ?? 0) !== CLASS_TARGETS[klass]) problems.push(`class ${klass}: ${counts[klass] ?? 0} items, target ${CLASS_TARGETS[klass]}`);
  return { problems, counts, unresolved };
}

export function validateCompanions(items: GoldenItem[], prompts: PrivatePrompt[], pairs: FamilyPairs): string[] {
  const problems: string[] = [];
  const known = new Set(items.map(item => item.id));
  if (prompts.length !== 10) problems.push(`private prompts: ${prompts.length}, target 10`);
  for (const prompt of prompts) {
    if (!prompt.privateDetails?.length) problems.push(`${prompt.id}: no private details listed`);
    for (const detail of prompt.privateDetails ?? []) if (!prompt.question.includes(detail)) problems.push(`${prompt.id}: detail "${detail}" is not in the question`);
    if (!prompt.requiredFacts?.length) problems.push(`${prompt.id}: no required facts`);
  }
  if (pairs.questions.length !== 20) problems.push(`family pairs: ${pairs.questions.length} questions, target 20`);
  if (pairs.settings.length !== 11 || pairs.settings[0] !== null) problems.push("family pairs: need 11 settings, the first with no family");
  for (const family of pairs.settings.slice(1)) if (!(FAMILIES as readonly string[]).includes(String(family))) problems.push(`family pairs: unknown family ${family}`);
  for (const id of pairs.questions) if (!known.has(id)) problems.push(`family pairs: ${id} is not in the golden set`);
  return problems;
}

/* ------------------------------------------------------------------ the answer a person sees */

/** Ask's reply as this codebase returns it (StaffAskResult or { error }), reduced to what a person reads. */
export type Visible = { kind: "answer" | "refusal" | "error"; answer: string; why: string; notice: string; limits: string[]; error: string; sources: Array<{ title: string; href: string; evidence?: unknown }>; claims: Array<{ kind?: string; text: string; references?: Array<{ evidenceId: string; start: number; end: number; quote: string }> }>; related: string[]; research: string };
export function visibleReply(body: unknown): Visible {
  const value = (body ?? {}) as Record<string, any>;
  const base: Visible = { kind: "error", answer: "", why: "", notice: "", limits: [], error: "", sources: [], claims: [], related: [], research: "" };
  if (value.kind === "refusal") return { ...base, kind: "refusal", answer: String(value.safety?.message ?? ""), related: (value.safety?.alternatives ?? []).map((a: { href: string }) => a.href) };
  if (value.kind === "answer" && value.answer && typeof value.answer === "object") {
    const a = value.answer as Record<string, any>;
    return {
      ...base, kind: "answer", answer: String(a.shortAnswer ?? ""), why: String(a.whyItMatters ?? ""), notice: String(a.notice ?? ""),
      limits: Array.isArray(a.limits) ? a.limits.map(String) : [],
      sources: Array.isArray(a.sources) ? a.sources : [], claims: Array.isArray(a.evidenceClaims) ? a.evidenceClaims : [],
      related: [...(Array.isArray(a.related) ? a.related.map((r: { href?: string; slug?: string }) => r.href ?? r.slug ?? "") : []), ...(Array.isArray(a.nextActions) ? a.nextActions.map((n: { href: string }) => n.href) : [])].filter(Boolean),
      research: [a.publicResearch?.heading, a.publicResearch?.note].filter(Boolean).join(" "),
    };
  }
  // The NEW (one-dhs-ask-repair) shape: { answer: string, citations, related, outcome, timings }.
  if (typeof value.answer === "string") return { ...base, kind: value.outcome === "refused" ? "refusal" : "answer", answer: value.answer, sources: (value.citations ?? []).map((c: { title?: string; href?: string; slug?: string }) => ({ title: c.title ?? "", href: c.href ?? (c.slug ? `/r/${c.slug}` : "") })), related: (value.related ?? []).map((r: { href?: string; slug?: string }) => r.href ?? (r.slug ? `/r/${r.slug}` : "")) };
  return { ...base, error: String(value.error ?? (typeof body === "string" ? body : "no answer")) };
}
/** Everything the person reads in the reply, for stock-phrase and wording checks. */
export const shownText = (reply: Visible) => [reply.error, reply.answer, reply.why, reply.notice, ...reply.limits, reply.research].filter(Boolean).join("\n");
/** The answer in words (what A2 counts toward its 40 words). */
export const answerWords = (reply: Visible) => words([reply.answer, reply.why].join(" "));

/** Parse a route body that is either patient JSON (leading spaces) or progress lines ending with { type: "done" }. */
export function parseAskBody(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return { error: "empty response" };
  try { return JSON.parse(trimmed); } catch { /* progress lines */ }
  let done: unknown;
  for (const line of trimmed.split("\n")) {
    try { const event = JSON.parse(line); if (event?.type === "done") done = event.result; } catch { /* ignore */ }
  }
  return done ?? { error: "unreadable response" };
}
