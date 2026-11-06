// Typed access to dsd-policies.json: plain-language summaries of the statutes, rules, manual pages,
// waiver plans, department policies, bulletins, federal rules and reports that shape disability
// services in Minnesota. Each policy names its official source and the date it was checked.
// Built by scripts/content/build-dsd-policies.py. Plain data, safe for client and server code.
import rawData from "./dsd-policies.json";

export type PolicyKindId =
  | "statute"
  | "rule"
  | "manual"
  | "waiver-plan"
  | "department-policy"
  | "bulletin"
  | "federal-rule"
  | "report-or-plan";

export type PolicyKind = { id: PolicyKindId; title: string; intro: string };

export type PolicySource = { title: string; url: string; date: string };
export type PolicyRelatedSource = { title: string; url: string };

export type Policy = {
  id: string;
  title: string;
  kind: PolicyKindId;
  programs: string[];
  appliesTo: string[];
  summary: string;
  requires: string[];
  equityCheck: string[];
  /** Date the policy took effect (YYYY, YYYY-MM or YYYY-MM-DD), or "" when the source does not say. */
  effective: string;
  /** Date the source was last updated, or "" when the source does not show one. */
  lastUpdated: string;
  source: PolicySource;
  relatedSources: PolicyRelatedSource[];
  /** Routes in this app, each with an app/<route>/page.tsx. */
  relatedPages: string[];
  tags: string[];
  /** Date the facts were checked against the source. */
  checked: string;
};

export type PoliciesData = { checked: string; kinds: PolicyKind[]; policies: Policy[] };

const data = rawData as PoliciesData;
const byId = new Map(data.policies.map(p => [p.id, p]));

export function getPoliciesData(): PoliciesData {
  return data;
}

/** Every policy, sorted by kind then title. */
export function getPolicies(): Policy[] {
  return data.policies;
}

export function getPolicy(id: string): Policy | undefined {
  return byId.get(id);
}

export function getPolicyKinds(): PolicyKind[] {
  return data.kinds;
}

export function getPolicyKind(id: string): PolicyKind | undefined {
  return data.kinds.find(k => k.id === id);
}

/** Policies grouped by kind, in the order the kinds are listed. Kinds with no policies are kept with an empty list. */
export function policiesByKind(policies: Policy[] = data.policies): { kind: PolicyKind; policies: Policy[] }[] {
  return data.kinds.map(kind => ({ kind, policies: policies.filter(p => p.kind === kind.id) }));
}

function same(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase("en-US") === b.trim().toLocaleLowerCase("en-US");
}

/** Policies that name a program, matched without regard to case ("Developmental Disabilities Waiver"). */
export function policiesForProgram(name: string): Policy[] {
  return data.policies.filter(p => p.programs.some(program => same(program, name)));
}

export function policiesByTag(tag: string): Policy[] {
  return data.policies.filter(p => p.tags.some(t => same(t, tag)));
}

export function policiesForAppliesTo(group: string): Policy[] {
  return data.policies.filter(p => p.appliesTo.some(a => same(a, group)));
}

/** Policies whose title, summary, requirements, equity checks, programs or tags contain every word of the query. */
export function searchPolicies(query: string, policies: Policy[] = data.policies): Policy[] {
  const words = query.toLocaleLowerCase("en-US").split(/\s+/).filter(Boolean);
  if (!words.length) return policies;
  return policies.filter(p => {
    const text = [p.title, p.summary, ...p.requires, ...p.equityCheck, ...p.programs, ...p.tags, p.source.title].join(" ").toLocaleLowerCase("en-US");
    return words.every(w => text.includes(w));
  });
}

/** Distinct program names across all policies, sorted, with case-only duplicates merged. */
export function allPrograms(): string[] {
  return distinct(data.policies.flatMap(p => p.programs));
}

export function allAppliesTo(): string[] {
  return distinct(data.policies.flatMap(p => p.appliesTo));
}

export function allTags(): string[] {
  return distinct(data.policies.flatMap(p => p.tags));
}

function distinct(values: string[]): string[] {
  const seen = new Map<string, string>();
  for (const v of values) {
    const key = v.trim().toLocaleLowerCase("en-US");
    if (!seen.has(key)) seen.set(key, v.trim());
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "en-US"));
}

export function policyHref(id: string): string {
  return `/community-outreach/policies/${encodeURIComponent(id)}`;
}

/** "2026-02-01" -> "February 1, 2026"; "2026-02" -> "February 2026"; "2026" -> "2026"; "" -> "". */
export function formatPolicyDate(value: string): string {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value);
  if (!m) return value;
  const [, year, month, day] = m;
  if (!month) return year;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day ?? 1)));
  const options: Intl.DateTimeFormatOptions = day ? { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" } : { year: "numeric", month: "long", timeZone: "UTC" };
  return date.toLocaleDateString("en-US", options);
}
