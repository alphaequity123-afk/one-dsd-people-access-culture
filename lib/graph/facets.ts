/**
 * Five ways into the whole collection: by task, by role, by standard or goal, by community or
 * program area, and by skill. Every connection is computed from published content (the work areas and their
 * tasks, the national standards curriculum, the six equity goals, the community briefs, the
 * organization records and the policy catalog). Nothing here records or counts anyone's use.
 */
import { DOMAINS, ROLE_FAMILY_LABEL, type RoleFamily } from "@/lib/domains";
import { knowledgeGraph, type GraphNode } from "@/lib/content/knowledge-graph";
import { CORPUS } from "@/lib/content/corpus";
import { selfDirectedRoles } from "@/lib/content/self-directed";
import { practiceGuides } from "@/lib/program/dsd-practice-guides";
import { getPolicies, policyHref } from "@/lib/content/hub/dsd-policies";
import { isNativeCommunity } from "@/lib/content/hub/organizations";
import clas from "@/lib/content/clas-curriculum.json";
import { REFERRAL_ONLY_COURSE_IDS } from "@/lib/program/retired-features";
import { SKILLS, SKILL_COURSES } from "./skills";
import { PARTNER_GROUP_LABEL, PUBLIC_BODIES, PUBLIC_PARTNERS, STATE_AGENCIES, agencyConnectionText, agencyDisplayName, agencyNodeId } from "@/lib/content/state-agencies";

export type FacetId = "task" | "role" | "standard" | "community" | "skill";
export type ItemKind = "course" | "resource" | "reading" | "practice" | "brief" | "organization" | "policy" | "lesson" | "agency";
export type FacetItem = { id: string; kind: ItemKind; title: string; href: string };
export type FacetValue = { facet: FacetId; id: string; title: string; summary: string; group: string; items: FacetItem[] };

export const FACETS: { id: FacetId; title: string; question: string }[] = [
  { id: "task", title: "By task", question: "What are you working on?" },
  { id: "role", title: "By role", question: "What is your role?" },
  { id: "standard", title: "By standard or goal", question: "Which commitment are you working toward?" },
  { id: "community", title: "By community or program area", question: "Who or what is the work about?" },
  { id: "skill", title: "By skill", question: "What would you like to get better at?" },
];

export const KIND_LABEL: Record<ItemKind, string> = {
  course: "Courses", lesson: "Lessons", practice: "Guided practices", resource: "Tools and guides",
  reading: "Readings", brief: "Community briefs", organization: "Organizations", policy: "Policies", agency: "Public agencies and partners",
};
export const KIND_ORDER: ItemKind[] = ["practice", "course", "lesson", "resource", "policy", "brief", "organization", "agency", "reading"];

type Pool = { items: Map<string, FacetItem>; text: Map<string, string> };

const STOP = new Set("a an and the of to for in on with without by or our your their its is are be as at from into how what when who which this that it make use run build plan".split(" "));
function words(value: string): string[] {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(word => word.length > 3 && !STOP.has(word));
}
function slug(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function kindOf(node: GraphNode): ItemKind | null {
  if (node.kind === "resource") return node.id.startsWith("course-") ? "course" : node.id.startsWith("practice-guide-") ? "practice" : "resource";
  if (node.kind === "path") return "practice";
  if (node.kind === "reading") return "reading";
  if (node.kind === "brief") return "brief";
  if (node.kind === "organization") return "organization";
  return null;
}

let pool: Pool | undefined;
function itemPool(): Pool {
  if (pool) return pool;
  const items = new Map<string, FacetItem>(), text = new Map<string, string>();
  const corpus = new Map(CORPUS.map(item => [item.id, item]));
  for (const node of knowledgeGraph().nodes.values()) {
    const kind = kindOf(node);
    if (!kind || !node.href) continue;
    items.set(node.id, { id: node.id, kind, title: node.title, href: node.href });
    const entry = corpus.get(node.id);
    text.set(node.id, [node.title, entry?.summary ?? "", ...(entry?.tags ?? [])].join(" "));
  }
  for (const guide of practiceGuides) {
    const id = `practice-guide-${guide.slug}`;
    items.set(id, { id, kind: "practice", title: guide.title, href: `/practice-guides/${guide.slug}` });
    text.set(id, [guide.title, guide.purpose, guide.summary].join(" "));
  }
  for (const policy of getPolicies()) {
    const id = `policy:${policy.id}`;
    items.set(id, { id, kind: "policy", title: policy.title, href: policyHref(policy.id) });
    text.set(id, [policy.title, policy.summary, ...policy.tags, ...policy.programs].join(" "));
  }
  for (const module of clas.modules) {
    const id = `clas:${module.id}`;
    items.set(id, { id, kind: "lesson", title: module.title, href: `/learn/clas/curriculum/${module.id}` });
    text.set(id, module.title);
  }
  // State of Minnesota agencies, boards and councils: nodes of the same graph, linked by the work they hold.
  for (const agency of PUBLIC_BODIES) {
    const id = agencyNodeId(agency);
    items.set(id, { id, kind: "agency", title: agencyDisplayName(agency.name), href: agency.href });
    text.set(id, agencyConnectionText(agency));
  }
  return (pool = { items, text });
}

/** Agencies whose responsibility words share at least `min` meaningful words with the phrase. Link-only agencies join only by name. */
function agenciesFor(phrase: string, min = 2, limit = 4): string[] {
  // The 76 county lead agencies share one name pattern, so they join through their own group, not by word matching.
  return matching(phrase, min, limit, /^(?!agency:)|^agency:county-(?!association)/);
}

/** Items whose text shares at least `min` meaningful words with the phrase. */
function matching(phrase: string, min = 2, limit = 24, skip: RegExp = /^(policy:|organization:|agency:)/): string[] {
  const { text } = itemPool();
  const want = new Set(words(phrase));
  if (!want.size) return [];
  const scored: [string, number][] = [];
  for (const [id, value] of text) {
    if (skip.test(id)) continue;
    const have = new Set(words(value));
    let score = 0;
    for (const word of want) if (have.has(word)) score++;
    if (score >= Math.min(min, want.size)) scored.push([id, score]);
  }
  return scored.sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
}

function pathNodeId(pathId: string): string { return pathId; }

function value(facet: FacetId, id: string, title: string, summary: string, group: string, ids: Iterable<string>): FacetValue {
  const { items } = itemPool();
  const seen = new Set<string>(), list: FacetItem[] = [];
  for (const itemId of ids) {
    const item = items.get(itemId) ?? items.get(`course-${itemId}`);
    if (item && !seen.has(item.id)) { seen.add(item.id); list.push(item); }
  }
  list.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
  return { facet, id, title, summary, group, items: list };
}

let built: Map<string, FacetValue> | undefined;

function build(): Map<string, FacetValue> {
  if (built) return built;
  const out = new Map<string, FacetValue>();
  const put = (entry: FacetValue) => { if (entry.items.length) out.set(`${entry.facet}/${entry.id}`, entry); };
  const taskMembers = new Map<string, string[]>();
  const roleMembers = new Map<RoleFamily, Set<string>>();

  // Tasks: the work areas' own task lists, their named resources and practice paths, plus close matches.
  for (const domain of DOMAINS) {
    for (const task of domain.tasks) {
      const ids = [...task.contentIds, ...(task.pathId ? [pathNodeId(task.pathId)] : []), ...matching(`${task.label} ${task.outcome}`, 2, 14), ...agenciesFor(`${task.label} ${task.outcome}`)];
      taskMembers.set(task.id, ids);
      put(value("task", task.id, task.label, task.outcome, domain.staffLabel, ids));
      for (const role of task.roles) {
        const set = roleMembers.get(role) ?? new Set<string>();
        ids.forEach(id => set.add(id));
        roleMembers.set(role, set);
      }
    }
  }
  for (const id of itemPool().items.keys()) {
    if (!id.startsWith("self-directed-")) continue;
    for (const role of selfDirectedRoles(id)) roleMembers.get(role)?.add(id);
  }
  for (const [role, ids] of roleMembers) {
    put(value("role", role, ROLE_FAMILY_LABEL[role], `Tasks, practices and learning that people in this role most often use. Every resource stays open to everyone.`, "Roles", ids));
  }

  // Standards: the 15 national standards through the curriculum lessons that teach them.
  for (const standard of clas.standards) {
    const lessons = clas.modules.filter(module => module.standards.includes(standard.number)).map(module => `clas:${module.id}`);
    put(value("standard", `clas-${standard.number}`, `National standard ${standard.number}`, standard.focus, "National standards for culturally and linguistically appropriate services", [...lessons, ...matching(standard.focus, 2, 14)]));
  }
  // Goals: the six equity goals through the work areas that serve each one.
  const goals = new Map<string, string[]>();
  for (const domain of DOMAINS) for (const goal of domain.goals) {
    const ids = goals.get(goal) ?? [];
    for (const task of domain.tasks) ids.push(...(taskMembers.get(task.id) ?? []));
    ids.push(...domain.toolIds);
    goals.set(goal, ids);
  }
  for (const [goal, ids] of goals) ids.push(...agenciesFor(goal, 2, 3));
  for (const [goal, ids] of goals) put(value("standard", `goal-${slug(goal)}`, goal, `Work that serves the equity goal "${goal}".`, "Six equity goals", ids));
  put(value("standard", "equity-policy", "DHS equity policy and the Equity Analysis Toolkit", "Looking at policies, practices, budgets and decisions through an equity lens. The Equity Analysis Toolkit is required for significant decisions.", "Department commitments", matching("equity analysis toolkit policy decision", 2, 30)));

  // Communities: each brief with the organizations and work connected to it. Native pages stand as written.
  const graph = knowledgeGraph();
  for (const node of graph.nodes.values()) {
    if (node.kind !== "brief") continue;
    const communityId = node.id.slice("brief:".length);
    const ids = [node.id];
    if (!isNativeCommunity(communityId)) for (const { node: other } of graph.neighbors(node.id)) ids.push(other.id);
    put(value("community", `community-${communityId}`, node.title, "The community brief and the organizations, readings and work connected with it.", "Minnesota communities", ids));
  }
  // Program areas: the seven work areas and the division's programs named in the policy catalog.
  for (const domain of DOMAINS) {
    const ids = [...domain.toolIds];
    for (const task of domain.tasks) ids.push(...(taskMembers.get(task.id) ?? []));
    ids.push(...PUBLIC_BODIES.filter(agency => agency.areas.includes(domain.id)).map(agencyNodeId), ...agenciesFor(`${domain.staffLabel} ${domain.summary}`, 2, 6));
    put(value("community", `area-${domain.id}`, domain.staffLabel, domain.summary, "Work areas", ids));
  }
  const programs = new Map<string, string[]>();
  for (const policy of getPolicies()) for (const program of policy.programs) {
    const ids = programs.get(program) ?? [];
    ids.push(`policy:${policy.id}`);
    programs.set(program, ids);
  }
  for (const [program, ids] of programs) if (ids.length >= 3) put(value("community", `program-${slug(program)}`, program, `Policies and work connected with ${program}.`, "Division programs", [...ids, ...matching(program, 2, 10, /^organization:/)]));
  // Each agency: its own page of connected program work, so links run both ways, and the full directory.
  for (const agency of STATE_AGENCIES) {
    const id = agencyNodeId(agency);
    // Links come from the reviewed responsibility map only; matching on general descriptions joined unrelated work.
    const ids = agency.linkOnly || !agency.topics ? [id] : [id, ...matching(agencyConnectionText(agency), 2, 16, /^agency:/)];
    put(value("community", `agency-${agency.id}`, agencyDisplayName(agency.name), agency.description, "State of Minnesota agencies", ids));
  }
  put(value("community", "state-agencies", "All State of Minnesota agencies, boards and councils", "Every agency, board and council in the state's official directory.", "State of Minnesota agencies", STATE_AGENCIES.map(agencyNodeId)));
  // Public partners: each with topics gets its own page; every group has one page that holds all its members
  // beside the program work the group does with the division, so no partner stands alone.
  for (const partner of PUBLIC_PARTNERS) {
    if (!partner.topics) continue;
    const id = agencyNodeId(partner);
    put(value("community", `agency-${partner.id}`, partner.name, partner.description, PARTNER_GROUP_LABEL[partner.group], [id, ...matching(agencyConnectionText(partner), 2, 16, /^agency:/)]));
  }
  const groupWork: Record<string, [string, string, string]> = {
    county: ["county-lead-agencies", "County lead agencies", "county lead agency assessment support planning case management waiver home and community-based services eligibility"],
    federal: ["federal-partners", "Federal partners", "federal medicaid waiver home and community-based services civil rights disability rights language access"],
    legislature: ["minnesota-legislature", "Minnesota Legislature", "legislature statute law rule policy change legislative"],
  };
  for (const [group, [id, title, phrase]] of Object.entries(groupWork)) {
    const members = PUBLIC_PARTNERS.filter(partner => partner.group === group).map(agencyNodeId);
    // The Revisor and the Legislative Reference Library sit in the state directory and belong with the Legislature.
    if (group === "legislature") members.push("agency:revisor-of-statutes", "agency:legislative-reference-library");
    put(value("community", id, title, `${title} and the program work connected with them.`, "Public partners", [...members, ...matching(phrase, 2, 12, /^agency:/)]));
  }
  // Skills: the courses tagged to each one, with close matches. Referral-only courses are never listed here.
  for (const skill of SKILLS) {
    const ids = [...(SKILL_COURSES[skill.id] ?? []), ...matching(skill.phrase, 2, 12)]
      .filter(id => !REFERRAL_ONLY_COURSE_IDS.has(id.replace(/^course-/, "")));
    put(value("skill", skill.id, skill.title, skill.summary, skill.group, ids));
  }
  // No object stands alone (owner rule, 2026-11-11): anything no page holds yet joins the page it shares the most
  // meaningful words with; an object that shares none joins a page for the rest of its kind.
  const held = new Set<string>();
  for (const entry of out.values()) for (const item of entry.items) held.add(item.id);
  const homes = [...out.values()].filter(entry => entry.group !== "State of Minnesota agencies" && entry.group !== "Public partners" && !entry.id.startsWith("agency-")
    // Native community pages stay link-only: the brief alone, nothing attached to it.
    && !(entry.id.startsWith("community-") && isNativeCommunity(entry.id.slice("community-".length))))
    .map(entry => ({ entry, have: new Set(words(`${entry.title} ${entry.summary}`)) }));
  const { items: every, text: everyText } = itemPool();
  const rest = new Map<ItemKind, string[]>();
  for (const [id, item] of every) {
    if (held.has(id)) continue;
    const want = words(everyText.get(id) ?? item.title);
    let best: FacetValue | undefined, top = 0;
    for (const home of homes) {
      let score = 0;
      for (const word of want) if (home.have.has(word)) score++;
      if (score > top) { top = score; best = home.entry; }
    }
    if (best) best.items.push(item);
    else (rest.get(item.kind) ?? rest.set(item.kind, []).get(item.kind)!).push(id);
  }
  for (const entry of out.values()) entry.items.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
  for (const [kind, ids] of rest) put(value("community", `more-${kind}`, `More ${KIND_LABEL[kind].toLowerCase()}`, `${KIND_LABEL[kind]} that belong to the program as a whole.`, "Across the program", ids));
  return (built = out);
}

export function facetValues(facet: FacetId): FacetValue[] {
  return [...build().values()].filter(entry => entry.facet === facet);
}
export function facetValue(facet: string, id: string): FacetValue | undefined {
  return build().get(`${facet}/${id}`);
}
export function facetHref(entry: Pick<FacetValue, "facet" | "id">): string { return `/explore/${entry.facet}/${entry.id}`; }

/** The facet values an item belongs to, for "Connected with" lists on item pages. */
/** Items that no facet value holds: the build check for a fully connected graph. Empty when every object is linked. */
export function isolatedItems(): FacetItem[] {
  const held = new Set<string>();
  for (const entry of build().values()) for (const item of entry.items) held.add(item.id);
  return [...itemPool().items.values()].filter(item => !held.has(item.id));
}

/** Public bodies whose reviewed work areas include any of the given areas, most areas in common first. */
export function agenciesForAreas(areas: readonly string[], limit = 8): FacetItem[] {
  const pool = itemPool().items;
  return PUBLIC_BODIES.filter(body => !body.linkOnly && body.areas.some(area => areas.includes(area)))
    .map(body => ({ body, shared: body.areas.filter(area => areas.includes(area)).length }))
    .sort((a, b) => b.shared - a.shared || a.body.areas.length - b.body.areas.length)
    .slice(0, limit).map(({ body }) => pool.get(agencyNodeId(body))!).filter(Boolean);
}

export function facetsForHref(href: string, limit = 8): FacetValue[] {
  const clean = href.split(/[?#]/)[0];
  return [...build().values()].filter(entry => entry.items.some(item => item.href.split(/[?#]/)[0] === clean))
    .sort((a, b) => FACETS.findIndex(f => f.id === a.facet) - FACETS.findIndex(f => f.id === b.facet) || a.items.length - b.items.length)
    .slice(0, limit);
}

/** Values grouped for a facet page. */
export function groupedFacet(facet: FacetId): { group: string; values: FacetValue[] }[] {
  const groups = new Map<string, FacetValue[]>();
  for (const entry of facetValues(facet)) (groups.get(entry.group) ?? groups.set(entry.group, []).get(entry.group)!).push(entry);
  return [...groups].map(([group, values]) => ({ group, values }));
}

export function graphStats() {
  const all = [...build().values()];
  const linked = new Set(all.flatMap(entry => entry.items.map(item => item.id)));
  return { values: all.length, linkedItems: linked.size, pool: itemPool().items.size };
}
