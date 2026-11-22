import data from "./collections-data.json";
import { selfDirectedHref } from "./self-directed";

/**
 * Staff collections, supervisor and manager doors, and suggested paths.
 * collections-data.json is generated from the placement table by
 * scripts/content/build-collections-data.mjs. The role, scenario and resource
 * tables below are written by hand from the collections plan.
 */
export type CollectionItemKind = "course" | "self-directed" | "referral";
export type CollectionItem = { id: string; title: string; kind: CollectionItemKind; minutes?: number; required?: string };
export type StaffCollection = { id: string; title: string; description: string; startIds: string[]; deeper: { subject: string; ids: string[] }[]; itemCount: number };
export type DoorQuestion = { key: string; question: string; startId: string; deeperIds: string[] };
export type LeadingDoor = { slug: string; title: string; description: string; questions: DoorQuestion[]; relatedIds: string[]; itemCount: number };
export type LeadingPath = { slug: string; title: string; description: string; courseIds: string[]; minutes: number };
export type ResourceLink = { label: string; href: string };

const ITEMS = data.items as Record<string, Omit<CollectionItem, "id">>;
export const STAFF_COLLECTIONS: readonly StaffCollection[] = data.staff;
export const LEADING_DOORS: readonly LeadingDoor[] = data.doors;
export const LEADING_PATHS: readonly LeadingPath[] = data.paths;
export const COLLECTION_REFERRAL_IDS: readonly string[] = data.referralIds;
export const COLLECTION_COUNTS = data.counts;

export const REQUIRED_COURSE_ID = "dhs-equity-analysis-toolkit";
export const REQUIRED_COURSE_LABEL = "Required of all DHS staff";
export const LEADING_HREF = "/leading";
export const LEADING_LABEL = "For leaders, supervisors, managers, and directors";
export const COLLECTIONS_HREF = "/learn/collections";
export const TRIBAL_REFERRAL_HREF = "/learn/tribal-referral";
export const RIGHT_PERSON_HREF = "/support/right-person";
/** The plan's one added sentence for this space. */
export const LEADING_PRIVACY_SENTENCE = "This area shows you no information about your team's learning.";

export function collectionItem(id: string): CollectionItem | undefined {
  const item = ITEMS[id];
  return item ? { id, ...item } : undefined;
}
export function collectionItemHref(item: CollectionItem): string {
  if (item.kind === "referral") return TRIBAL_REFERRAL_HREF;
  if (item.kind === "self-directed") {
    const href = selfDirectedHref(item.id);
    if (!href) throw new Error(`Self-directed course ${item.id} is not in the self-directed data`);
    return href;
  }
  return `/courses/${encodeURIComponent(item.id)}`;
}
/** Self-directed and referral items have no course job aid. The supervisor and manager courses have standalone job aids. */
export function jobAidHref(item: CollectionItem): string | undefined {
  if (item.kind !== "course") return undefined;
  return item.id.startsWith("sm-") ? `/resources/ja-${encodeURIComponent(item.id)}` : `${collectionItemHref(item)}#job-aid`;
}
export function staffCollection(id: string) { return STAFF_COLLECTIONS.find(collection => collection.id === id); }
export function leadingDoor(slug: string) { return LEADING_DOORS.find(door => door.slug === slug); }
export function leadingPath(slug: string) { return LEADING_PATHS.find(path => path.slug === slug); }
export function pathHours(path: LeadingPath) { return Math.round(path.minutes / 60); }
export function staffCollectionIds(collection: StaffCollection) { return [...collection.startIds, ...collection.deeper.flatMap(group => group.ids)]; }
export function doorIds(door: LeadingDoor) { return [...door.questions.flatMap(question => [question.startId, ...question.deeperIds]), ...door.relatedIds]; }

// ---- Whom to ask, by role. The roles come from the new courses' own job aids. ----
export type AskRole = { role: string; forWhat: string };
const HR: AskRole = { role: "Human Resources", forWhat: "Hiring rules, classification, pay, and what you may say or do in a personnel matter" };
const LABOR: AskRole = { role: "Labor relations", forWhat: "Contracts, discipline, grievances, and changes to hours, duties or work rules" };
const CONTRACT: AskRole = { role: "The union contract itself", forWhat: "Read the agreement that covers the person. Terms differ by contract or plan" };
const ADA: AskRole = { role: "The ADA coordinator", forWhat: "Accommodation requests and communication access" };
const AAO: AskRole = { role: "The Affirmative Action Officer", forWhat: "Reports of harassment, discrimination or retaliation, along with Human Resources" };
const MANAGER: AskRole = { role: "Your own manager", forWhat: "Workload, authority, and anything only they can remove or decide" };

export const DOOR_ASK: Readonly<Record<string, readonly AskRole[]>> = {
  hiring: [HR, ADA, LABOR],
  "who-does-what": [LABOR, CONTRACT, HR, ADA],
  feedback: [HR, LABOR, CONTRACT],
  access: [ADA, HR, LABOR],
  concern: [HR, AAO, LABOR],
  team: [HR, ADA, MANAGER],
  policy: [MANAGER, ADA, HR],
  "keep-going": [HR, LABOR, MANAGER],
  direction: [HR, LABOR, MANAGER],
};
/** Questions where the door's usual roles are not the right first call. */
const QUESTION_ASK: Readonly<Record<string, readonly AskRole[]>> = {
  rating: [HR, LABOR, CONTRACT],
  corrective: [LABOR, CONTRACT, HR],
  calibrate: [HR, LABOR],
  "own-load": [MANAGER, HR, ADA],
  cuts: [LABOR, HR, ADA],
  rules: [HR, LABOR, ADA],
  duties: [HR, AAO],
  report: [HR, AAO],
  retal: [HR, AAO],
  named: [HR, LABOR],
  leave: [HR, ADA, LABOR],
  "h-law": [HR, AAO],
  conflict: [HR, LABOR, MANAGER],
  "org-access": [ADA, MANAGER],
};
export function whomToAsk(doorSlug: string, questionKey: string): readonly AskRole[] {
  return QUESTION_ASK[questionKey] ?? DOOR_ASK[doorSlug] ?? [HR];
}

// ---- Work scenarios, placed by the plan's table. ----
export const QUESTION_SCENARIOS: Readonly<Record<string, readonly string[]>> = {
  "h-panel": ["dsd-hiring-panel"],
  stretch: ["dsd-advancement-conversation"],
  accom: ["dsd-accommodation-cliff"],
  "org-access": ["dsd-accessible-form"],
  repair: ["dsd-repair-after-harm"],
  psych: ["dsd-team-silence"],
  "ic-lead": ["dsd-interpreter-first-contact"],
  policy: ["dsd-policy-change"],
  program: ["dsd-service-redesign"],
  engage: ["dsd-engagement-late", "dsd-report-back"],
  data: ["dsd-small-group-data"],
  governance: ["dsd-leadership-bottleneck"],
};
export function scenarioHref(id: string) { return `/one-dsd/scenarios/${encodeURIComponent(id)}`; }

// ---- Other material stays where it is. These are links only. ----
const practice = (id: string, label: string): ResourceLink => ({ label, href: `/practice/${id}` });
const aid = (id: string, label: string): ResourceLink => ({ label, href: `/library/${id}` });
const GP = {
  1: practice("gp-1", "New program or service concept"), 2: practice("gp-2", "Policy, form, or notice change"), 3: practice("gp-3", "Community engagement or shared design effort"),
  4: practice("gp-4", "Workplace culture and team climate"), 5: practice("gp-5", "Planning a learning or facilitation session"), 6: practice("gp-6", "Inclusive hiring and selection"),
  7: practice("gp-7", "Equity analysis for a decision"), 8: practice("gp-8", "Accessible and culturally responsive meeting"), 9: practice("gp-9", "Reviewing a draft for equity, access, and plain language"),
  10: practice("gp-10", "Procurement or contract equity review"), 11: practice("gp-11", "Leadership pathway or sponsorship plan for staff with disabilities"), 12: practice("gp-12", "Equity Pause for a routine decision"),
  13: practice("gp-13", "Checking your own material for access, assumptions, and tone"),
} as const;
const TOOLKIT: ResourceLink = { label: "Equity Analysis Toolkit", href: "/learn/equity-toolkit" };

export const DOOR_RESOURCES: Readonly<Record<string, { practice: readonly ResourceLink[]; jobAids: readonly ResourceLink[]; tools: readonly ResourceLink[] }>> = {
  hiring: {
    practice: [GP[6]],
    jobAids: [aid("ja-inclusive-hiring-lifecycle", "Inclusive hiring lifecycle: eight stages from role design to outcomes"), aid("ja-job-relatedness-check", "Is this requirement job related? A short check before you keep it"), aid("ja-leadership-criteria-job-relatedness", "Leadership criteria: are they job related, or do they screen out disabled staff?")],
    tools: [{ label: "Toolkit page: Hiring and Workforce Development", href: "/toolkit-work/Equity-Analysis-Toolkit-JF-Workforce-Node.html" }],
  },
  "who-does-what": { practice: [], jobAids: [], tools: [] },
  feedback: { practice: [], jobAids: [], tools: [] },
  access: {
    practice: [GP[11]],
    jobAids: [aid("ja-accommodation-across-transitions", "Accommodations across transitions: closing the accommodation cliff"), aid("ja-access-checks", "Access checks before a meeting, outreach, or session")],
    tools: [],
  },
  concern: { practice: [], jobAids: [], tools: [] },
  team: {
    practice: [GP[4], GP[8]],
    jobAids: [aid("ja-climate-action-plan", "Team climate action plan template"), aid("ja-accessible-meetings", "Accessible and culturally responsive meetings: before, during, and after")],
    tools: [{ label: "Minnesota Communities", href: "/minnesota-communities" }],
  },
  policy: {
    practice: [GP[1], GP[2], GP[3], GP[7], GP[10], GP[12]],
    jobAids: [
      aid("ja-language-access-checklist", "Language access checklist"), aid("ja-language-cultural-access-planning", "Language and cultural access planning aid for a program or contact point"), aid("ja-plain-language", "Plain language and accessible documents checklist"),
      aid("ja-operational-equity-canvas", "Operational equity review canvas: eight steps for any decision"), aid("ja-equity-scan-or-full-analysis", "Equity scan or full equity analysis: what goes in and who decides which applies"), aid("ja-equity-impact-questions", "Equity impact questions for policy, budget, technology, and procurement"),
      aid("ja-process-burden", "Questions about the steps, time, and effort a process requires"), aid("ja-stakeholder-map", "Planning with partners: who to involve"), aid("ja-procurement-contract-equity", "Equity in contracts, grants, and procurement: where the questions belong"),
      aid("ja-engagement-influence-ladder", "Engagement that shares influence: inform, consult, involve, collaborate, design together"), aid("ja-report-back", "Reporting back: what we heard, what changed, what could not, and why"), aid("ja-form-notice-change", "Checklist for changing a form, notice, or letter"),
    ],
    tools: [TOOLKIT, { label: "Toolkit Studio", href: "/toolkit-studio" }, { label: "Equity reviews", href: "/equity-review" }, { label: "Requirements crosswalk", href: "/practice/requirements" }, { label: "ADSA goals planner", href: "/learn/equity-toolkit/goals" }, { label: "Cultural and language access planning", href: "/practice/clas" }, { label: "Measurement and evaluation", href: "/practice/measurement" }],
  },
  "keep-going": { practice: [], jobAids: [], tools: [{ label: "Amplify mentoring and peer learning", href: "/one-dsd/amplify/mentoring" }] },
  direction: {
    practice: [GP[5]],
    jobAids: [aid("ja-launch-embed-checklist", "Equity and access checklist for new work"), aid("ja-facilitation-session-plan", "Session plan: purpose, activity, practical use, and access")],
    tools: [{ label: "Toolkit page: Supervision and Management", href: "/toolkit-work/Equity-Analysis-Toolkit-JF-Management-Node.html" }, { label: "Equity leadership and growth", href: "/one-dsd/leadership" }],
  },
};

export const STAFF_RESOURCES: Readonly<Record<string, readonly ResourceLink[]>> = {
  "start-here": [TOOLKIT, { label: "New to DSD", href: "/start#new-to-dsd" }, { label: "Readings", href: "/learn/readings" }],
  "race-bias-respect": [{ label: "Readings", href: "/learn/readings" }, { label: "Listen", href: "/audio-library" }],
  "disability-access": [{ label: "Readings", href: "/learn/readings" }],
  "services-choice-system": [{ label: "DSD programs and services", href: "/one-dsd/programs" }],
  "culture-language": [{ label: "National CLAS Standards", href: "/learn/clas" }, { label: "Intercultural learning", href: "/learn/intercultural" }, { label: "Cultural Intelligence collection", href: "/learn/cultural-intelligence" }, GP[9], GP[13]],
  "minnesota-communities": [{ label: "Minnesota Communities", href: "/minnesota-communities" }],
  "working-together": [{ label: "Amplify mentoring and peer learning", href: "/one-dsd/amplify/mentoring" }, { label: "Employee resource groups", href: "/employee-resource-groups" }, GP[4], GP[8]],
  "policy-data-decisions": [TOOLKIT, { label: "Equity in Practice", href: "/learn/equity-in-practice" }, GP[1], GP[2], GP[3], GP[7], GP[9], GP[10], GP[12]],
};
