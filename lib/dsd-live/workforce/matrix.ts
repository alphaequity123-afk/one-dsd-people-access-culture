/**
 * The job family by competency matrix from "DHS workforce and job competencies" (November 13, 2026), section 6.
 * Ten job families, eleven competencies. Each cell says how strongly a resource on that competency is put in
 * front of that family: deep (first), practice (recommended) or awareness (available, not pushed).
 * Nothing is hidden by family. The family only sets the order.
 */
export const DEPTHS = ["deep", "practice", "awareness"] as const;
export type FamilyDepth = (typeof DEPTHS)[number];

export const COMPETENCIES = [
  { id: "leading-self", title: "Self-awareness and judgment", definition: "Personal and professional growth through self-reflection.", skills: ["emotional intelligence", "self-awareness", "adaptability", "cultural humility", "identity", "integrity"] },
  { id: "leading-others", title: "Developing people", definition: "Interpersonal skill and influence with partners and immediate teams.", skills: ["talent development", "change management", "trust", "conflict resolution", "intercultural communication", "intersectionality", "empathy"] },
  { id: "leading-organization", title: "Direction and priorities", definition: "Setting vision and guiding large teams with accountability.", skills: ["strategic planning", "fiscal management", "innovation", "influence", "allyship", "advocacy"] },
  { id: "leading-outside", title: "Partners and communities", definition: "Working accountably with partners outside the agency.", skills: ["coalitions", "partnership", "political savvy", "negotiation", "inclusion", "engagement", "anti-racism"] },
  { id: "getting-work-done", title: "Planning and delivery", definition: "Completing work and following procedure efficiently.", skills: ["results", "project management", "transparency", "financial stewardship", "continuous improvement", "anti-racism"] },
  { id: "inclusion-humility", title: "Inclusion and cultural humility", definition: "Examining personal bias and practicing cultural humility and belonging in the work and the workplace (DHS Equity Policy).", skills: ["cultural humility", "personal bias", "belonging", "respect across differences"] },
  { id: "equity-analysis", title: "Equity analysis", definition: "Using the Equity Analysis Toolkit and equity data on decisions with lasting impact.", skills: ["Equity Analysis Toolkit", "disaggregated data", "impact on communities", "budgets, hiring and contracting"] },
  { id: "digital-access", title: "Digital access", definition: "Accessible documents, meetings and systems under the state standard (WCAG 2.1 AA, Section 508).", skills: ["accessible documents", "accessible meetings", "accessible systems"] },
  { id: "disability-inclusion", title: "Disability inclusion", definition: "Person-centered practice, anti-ableism and the Olmstead Plan.", skills: ["person-centered practice", "anti-ableism", "Olmstead", "informed choice"] },
  { id: "language-access", title: "Language access and CLAS", definition: "Spoken and written language help and the National CLAS Standards.", skills: ["interpreters", "translation", "plain language", "CLAS Standards"] },
  { id: "tribes-community", title: "Tribes and community", definition: "Engagement with communities and government-to-government work with Tribal Nations.", skills: ["community engagement", "Tribal consultation", "partnership with communities"] },
] as const;
export type CompetencyId = (typeof COMPETENCIES)[number]["id"];
export const COMPETENCY_IDS = COMPETENCIES.map(c => c.id) as CompetencyId[];

export const JOB_FAMILIES = [
  { id: "executive", title: "Executive leadership", typical_roles: "Commissioner, deputies, assistant commissioners, inspector general. Unclassified." },
  { id: "managers", title: "Managers and directors", typical_roles: "Human Services Manager 1 to 5, division directors. Managerial Plan." },
  { id: "supervisors", title: "Supervisors", typical_roles: "Human Services Supervisor, program supervisors. MMA." },
  { id: "policy-program", title: "Policy and program professionals", typical_roles: "Program Representative, Specialist, Consultant. MAPE." },
  { id: "licensing-integrity", title: "Licensing, investigations and program integrity", typical_roles: "Licensors, investigators, auditors, background studies. MAPE." },
  { id: "eligibility-public", title: "Eligibility and direct public service", typical_roles: "Eligibility operations, medical review, call lines. MAPE and AFSCME." },
  { id: "data-research", title: "Data, research and evaluation", typical_roles: "Management Analyst, research and evaluation roles. MAPE." },
  { id: "finance-contracts", title: "Finance, contracts and grants", typical_roles: "Budget, accounting, contract and grant managers. MAPE." },
  { id: "enterprise-services", title: "Enterprise professional services", typical_roles: "Legal, appeals, HR, equity, communications, training." },
  { id: "admin-support", title: "Administrative and technical support", typical_roles: "Office and Administrative Specialist, Customer Service Specialist. AFSCME." },
] as const;
export type JobFamilyId = (typeof JOB_FAMILIES)[number]["id"];
export const JOB_FAMILY_IDS = JOB_FAMILIES.map(f => f.id) as JobFamilyId[];

/** Rows are job families, columns are COMPETENCY_IDS in order. Copied cell for cell from the brief. */
const GRID: Record<JobFamilyId, string> = {
  "executive":           "PPDDP DDAAAD",
  "managers":            "PDDPD DDPPPP",
  "supervisors":         "PDPAD DPPPAA",
  "policy-program":      "PAADP PDPDPD",
  "licensing-integrity": "PAAPD PPPDDP",
  "eligibility-public":  "PAAPD DADDDA",
  "data-research":       "PAAAD PDDPAP",
  "finance-contracts":   "PAPPD PDPAAP",
  "enterprise-services": "PPPPD DDDPDP",
  // Owner decision 2026-11-15: language access is deep for administrative and technical support (front desk,
  // phones, scheduling interpreters), in addition to the brief's getting work done.
  "admin-support":       "PAAAD PAPADA",
};
const LETTER: Record<string, FamilyDepth> = { D: "deep", P: "practice", A: "awareness" };

export const MATRIX: Record<JobFamilyId, Record<CompetencyId, FamilyDepth>> = Object.fromEntries(
  JOB_FAMILY_IDS.map(family => {
    const cells = GRID[family].replace(/\s/g, "").split("");
    if (cells.length !== COMPETENCY_IDS.length) throw new Error(`Matrix row ${family} has ${cells.length} cells`);
    return [family, Object.fromEntries(COMPETENCY_IDS.map((c, i) => [c, LETTER[cells[i]]]))];
  }),
) as Record<JobFamilyId, Record<CompetencyId, FamilyDepth>>;

const RANK: Record<FamilyDepth, number> = { deep: 0, practice: 1, awareness: 2 };
const stronger = (a: FamilyDepth, b: FamilyDepth) => (RANK[a] <= RANK[b] ? a : b);

/**
 * A resource's depth for each family. The primary competency sets it from the matrix. A secondary competency can
 * lift awareness to practice, never to deep. A family the resource is written for gets deep.
 * A lookup entry (a directory listing, a calendar date) is never put first: it is capped at practice, unless it is
 * written for the family. It is still found by search and Ask and stays in the graph.
 */
export function familyDepths(competencies: CompetencyId[], writtenFor: JobFamilyId[] = [], options: { lookup?: boolean } = {}): Record<JobFamilyId, FamilyDepth> {
  const [primary, ...secondary] = competencies;
  if (!primary) throw new Error("A resource needs at least one competency");
  return Object.fromEntries(JOB_FAMILY_IDS.map(family => {
    let depth = MATRIX[family][primary];
    for (const c of secondary) if (MATRIX[family][c] !== "awareness") depth = stronger(depth, "practice");
    if (options.lookup && depth === "deep") depth = "practice";
    if (writtenFor.includes(family)) depth = "deep";
    return [family, depth];
  })) as Record<JobFamilyId, FamilyDepth>;
}

/** Search weight for a passage by the depth its resource has for the reader's family. */
export const DEPTH_BOOST: Record<FamilyDepth, number> = { deep: 1.25, practice: 1.1, awareness: 1.0 };

/**
 * The old seven-competency labels mapped to the nearest of the eleven; used only when tagging fails for an item.
 * The old "leading-with-deai" label follows MMB's Leading with DEAI, which the owner is reviewing before anything
 * from it is used (2026-11-15): it is never shown and is cleared from resources by the loader.
 */
export const LEGACY_COMPETENCY_HINT: Record<string, CompetencyId> = {
  "leading-self": "leading-self", "leading-others": "leading-others", "leading-organization": "leading-organization",
  "leading-outside": "leading-outside", "getting-work-done": "getting-work-done", "leading-with-deai": "inclusion-humility", "job-knowledge": "getting-work-done",
};
