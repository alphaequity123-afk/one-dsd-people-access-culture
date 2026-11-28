/**
 * Program catalog: one index over everything the program offers, with the tags the long-term program needs.
 *
 * Owner direction 2026-11-26: One DHS People, Access and Culture is the superstructure and One DSD is the fully built
 * model inside it. Depth stays; volume is handled with a calm front door over a full, indexed back stack. Every item
 * therefore carries:
 * - an engine (Practice, Learning, Leadership, People and Growth, Communities), so new modules plug into one place;
 * - scope tags (DSD, ADSA, DHS-wide, Office of Employee Culture), so other equity directors can add their own
 *   resources beside DSD's without copying them;
 * - a suggested tier (start, apply, lead) for progressive disclosure, never a gate;
 * - governance (owner, steward, review cycle, last verified), so the program survives leadership and staff changes.
 *
 * Nothing here removes, hides or ranks content, and nothing records anyone's use. Tags are computed from what each
 * item already says about itself; where an item has no recorded review date, lastVerified stays null rather than
 * being guessed.
 */
import { allFacetItems, type FacetItem, type ItemKind } from "@/lib/graph/facets";
import { CORPUS } from "@/lib/content/corpus";
import governance from "@/config/program-governance.json";

export const ENGINES = ["practice", "learning", "leadership", "people-growth", "communities"] as const;
export type Engine = (typeof ENGINES)[number];
export const ENGINE_LABEL: Record<Engine, string> = {
  practice: "Practice", learning: "Learning", leadership: "Leadership", "people-growth": "People and Growth", communities: "Communities",
};

export const SCOPES = ["dsd", "adsa", "dhs-wide", "office-of-employee-culture"] as const;
export type Scope = (typeof SCOPES)[number];
export const SCOPE_LABEL: Record<Scope, string> = {
  dsd: "Disability Services Division", adsa: "Aging and Disability Services Administration", "dhs-wide": "DHS-wide", "office-of-employee-culture": "Office of Employee Culture",
};

export type Tier = "start" | "apply" | "lead";
export const TIER_LABEL: Record<Tier, string> = { start: "Start", apply: "Apply", lead: "Lead" };

export type Governance = { owner: string; steward: string; reviewCycleMonths: number; lastVerified: string | null };
export type CatalogItem = FacetItem & { engine: Engine; scopes: Scope[]; tier: Tier; governance: Governance };

type GovernanceDefaults = { owner: string; steward: string; reviewCycleMonths: number };
const DEFAULTS = governance.engines as Record<Engine, GovernanceDefaults>;

const GROWTH = /mentor|sponsor|career|succession|coaching|delegat|team-|teams?\b|onboarding|stay-interview|retention|advancement|stretch|development-plan|knowledge-and-continuity|amplify/;
const LEADERSHIP = /^\/(learn\/leadership|leading|leadership|one-dsd\/leadership|team-kits)(\/|$)|course-(dc-l|gc-|sm-)/;
const PRACTICE_HREF = /^\/(practice|practice-guides|learn\/equity-toolkit|learn\/tools|equity-review|equity-policy|operationalizing-equity|toolkit-studio)(\/|$)/;
const COMMUNITY_HREF = /^\/(minnesota-communities|community-outreach|communities|employee-resource-groups|minnesota-agencies|learn\/tribal-referral)(\/|$)/;
const EMPLOYEE_CULTURE = /respectful-workplace|employee-resource|engagement-survey|belonging|psychological-safety|workplace-climate|well-being|burnout|amplify/;

function engineOf(item: FacetItem): Engine {
  const key = `${item.id} ${item.href}`.toLowerCase();
  if (item.kind === "brief" || item.kind === "organization" || item.kind === "agency" || COMMUNITY_HREF.test(item.href)) return "communities";
  if (GROWTH.test(key) && !/^\/(minnesota-communities|community-outreach)/.test(item.href)) return "people-growth";
  if (LEADERSHIP.test(item.href) || LEADERSHIP.test(item.id)) return "leadership";
  if (item.kind === "practice" || item.kind === "policy" || PRACTICE_HREF.test(item.href)) return "practice";
  return "learning";
}

function scopesOf(item: FacetItem, corpusScope?: "agencywide" | "dsd"): Scope[] {
  const key = `${item.id} ${item.href} ${item.title}`.toLowerCase();
  const scopes = new Set<Scope>();
  if (/\bdsd\b|disability services division/.test(key) || corpusScope === "dsd" || /^\/(one-dsd|practice\/disability)(\/|$)|course-dsd-|dsd-program|dsd-scenario/.test(key)) scopes.add("dsd");
  if (/adsa/.test(key)) scopes.add("adsa");
  if (!scopes.has("dsd") || corpusScope === "agencywide") scopes.add("dhs-wide");
  if (EMPLOYEE_CULTURE.test(key)) scopes.add("office-of-employee-culture");
  return SCOPES.filter(scope => scopes.has(scope));
}

/** A suggestion for progressive disclosure only: every tier stays open to everyone. */
function tierOf(item: FacetItem, engine: Engine): Tier {
  const id = item.id.toLowerCase();
  if (/course-(div-a|dc-l|gc-|sm-)|advanced|capstone/.test(id) || engine === "leadership") return "lead";
  if (/course-(div-f|dc-s)|foundation|orientation|cultural-intelligence-|cq-/.test(id) || item.kind === "brief" || item.kind === "reading") return "start";
  return "apply";
}

const KIND_ORDER: ItemKind[] = ["practice", "course", "lesson", "resource", "policy", "brief", "organization", "agency", "reading"];

let catalog: CatalogItem[] | undefined;

export function programCatalog(): CatalogItem[] {
  if (catalog) return catalog;
  const corpus = new Map(CORPUS.map(entry => [entry.id, entry]));
  const overrides = governance.overrides as Record<string, Partial<Governance>>;
  catalog = allFacetItems().map(item => {
    const entry = corpus.get(item.id);
    const engine = engineOf(item);
    const base = DEFAULTS[engine];
    const reviewDate = entry?.reviewDate && /^\d{4}-\d{2}-\d{2}$/.test(entry.reviewDate) ? entry.reviewDate : null;
    return {
      ...item,
      engine,
      scopes: scopesOf(item, entry?.scope),
      tier: tierOf(item, engine),
      governance: { owner: entry?.owner || base.owner, steward: base.steward, reviewCycleMonths: base.reviewCycleMonths, lastVerified: reviewDate, ...overrides[item.id] },
    };
  }).sort((a, b) => ENGINES.indexOf(a.engine) - ENGINES.indexOf(b.engine) || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.title.localeCompare(b.title));
  return catalog;
}

export function catalogForEngine(engine: Engine, scope?: Scope): CatalogItem[] {
  return programCatalog().filter(item => item.engine === engine && (!scope || item.scopes.includes(scope)));
}

/** When an item is next due for review, from its last verification and its review cycle. Null until first verified. */
export function nextReview(item: CatalogItem): string | null {
  if (!item.governance.lastVerified) return null;
  const date = new Date(`${item.governance.lastVerified}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + item.governance.reviewCycleMonths);
  return date.toISOString().slice(0, 10);
}

export function catalogSummary() {
  const items = programCatalog();
  const byEngine = ENGINES.map(engine => {
    const list = items.filter(item => item.engine === engine);
    return {
      engine, label: ENGINE_LABEL[engine], total: list.length,
      byScope: SCOPES.map(scope => ({ scope, label: SCOPE_LABEL[scope], count: list.filter(item => item.scopes.includes(scope)).length })),
      byTier: (["start", "apply", "lead"] as Tier[]).map(tier => ({ tier, label: TIER_LABEL[tier], count: list.filter(item => item.tier === tier).length })),
      verified: list.filter(item => item.governance.lastVerified).length,
    };
  });
  return { total: items.length, byEngine };
}
