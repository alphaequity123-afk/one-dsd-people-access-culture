/**
 * Where work happens in DHS: the program administrations, the Office of Inspector General, the agency-wide
 * offices, and divisions inside them. From "DHS workforce and job competencies" (2026-11-13), section 1, and the
 * public DHS organization pages. A resource tagged to no area applies across the agency.
 * Each administration decides what to keep; DSD, inside Aging and Disability Services, is the fullest example.
 */
export type AreaKind = "administration" | "office" | "division";
export type Area = { id: string; title: string; kind: AreaKind; parent: string | null; about: string };

export const AREAS = [
  { id: "adsa", title: "Aging and Disability Services Administration", kind: "administration", parent: null, about: "Aging and adult services, disability services, home and community-based waivers, nursing facility rates." },
  { id: "dsd", title: "Disability Services Division", kind: "division", parent: "adsa", about: "Disability waivers and services, person-centered practice, informed choice, lead agency partnership." },
  { id: "health-care", title: "Health Care Administration", kind: "administration", parent: null, about: "Medical Assistance (Medicaid) and MinnesotaCare: eligibility operations, eligibility and access, research and quality, integrity and accountability, State Medical Review Team." },
  { id: "behavioral-health", title: "Behavioral Health Administration", kind: "administration", parent: null, about: "Mental health and substance use disorder services, mobile crisis, community behavioral health." },
  { id: "hhss", title: "Homelessness, Housing and Support Services Administration", kind: "administration", parent: null, about: "Homelessness services, housing supports, Housing Stabilization and related support services." },
  { id: "oig", title: "Office of Inspector General", kind: "administration", parent: null, about: "Licensing, background studies, investigations and program integrity." },
  { id: "employee-culture", title: "Employee Culture", kind: "office", parent: null, about: "Human resources, workforce development, training, belonging and workplace culture." },
  { id: "equity-inclusion", title: "Equity and Inclusion", kind: "office", parent: null, about: "The DHS Equity Policy, the Equity Analysis Toolkit, equity committees, CLAS." },
  { id: "indian-policy", title: "Office of Indian Policy", kind: "office", parent: null, about: "Government-to-government relations and consultation with Tribal Nations." },
  { id: "communications-external", title: "Communications and External Affairs", kind: "office", parent: null, about: "Communications, community relations, county relations, legislative and federal relations." },
  { id: "agency-effectiveness", title: "Agency Effectiveness", kind: "office", parent: null, about: "Strategy, performance, project management and continuous improvement." },
  { id: "finance", title: "Chief Financial Office", kind: "office", parent: null, about: "Budget, financial operations, contracts and grants." },
  { id: "compliance", title: "Chief Compliance Office", kind: "office", parent: null, about: "Compliance, appeals and federal requirements." },
  { id: "general-counsel", title: "General Counsel", kind: "office", parent: null, about: "Legal advice, rulemaking and data practices." },
  { id: "commissioners-office", title: "Commissioner's Office", kind: "office", parent: null, about: "Agency leadership and direction." },
] as const satisfies readonly Area[];

export type AreaId = (typeof AREAS)[number]["id"];
export const AREA_IDS = AREAS.map(a => a.id) as AreaId[];
export const areaTitle = (id: string) => AREAS.find(a => a.id === id)?.title ?? id;

/** An area and the areas above it: a DSD resource also belongs to Aging and Disability Services. */
export function areaLineage(id: string): AreaId[] {
  const out: AreaId[] = [];
  let area: Area | undefined = AREAS.find(a => a.id === id);
  while (area && !out.includes(area.id as AreaId)) { out.push(area.id as AreaId); area = AREAS.find(a => a.id === area!.parent); }
  return out;
}

export const AREA_COOKIE = "work-area";
export function parseArea(value: string | null | undefined): AreaId | null {
  return value && (AREA_IDS as string[]).includes(value) ? (value as AreaId) : null;
}
export function areaFromCookieHeader(header: string | null): AreaId | null {
  const match = header?.match(new RegExp(`(?:^|;\\s*)${AREA_COOKIE}=([^;]+)`));
  return parseArea(match ? decodeURIComponent(match[1]) : null);
}
