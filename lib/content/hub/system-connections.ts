// Typed access to system-connections.json: how the Department of Human Services and its
// Disability Services Division connect with lead agencies and with other parts of the department.
// Every item carries an official source. Safe for client and server code: plain data only.
import rawData from "./system-connections.json";

export type Source = { title: string; url: string; date: string };

export type StructureKind = "administration" | "division" | "office";

export type StructureItem = {
  name: string;
  kind: StructureKind;
  whatItDoesForDisabilityServices: string;
  connectionToDivision: string;
  source: Source;
};

export type LeadAgencyType = {
  type: string;
  description: string;
  examples: string[];
  programs: string[];
  source: Source;
};

export type DivisionRole = {
  role: string;
  description: string;
  howLeadAgenciesExperienceIt: string;
  source: Source;
  /** Extra official sources for the same item, when one source does not cover every fact. */
  alsoSee?: Source[];
};

export type DepartmentRole = { role: string; description: string; source: Source };

export type ReferralPath = { from: string; to: string; when: string; source: Source };

export type TribalNationsSection = {
  lines: string[];
  note: string;
  source: Source;
  relationshipSource: Source;
};

export type GlossaryEntry = { term: string; plain: string };

export type SystemConnections = {
  checked: string;
  structure: StructureItem[];
  leadAgencyTypes: LeadAgencyType[];
  divisionRoles: DivisionRole[];
  departmentRoles: DepartmentRole[];
  referralPaths: ReferralPath[];
  tribalNations: TribalNationsSection;
  glossary: GlossaryEntry[];
};

const data = rawData as SystemConnections;

export function getSystemConnections(): SystemConnections {
  return data;
}

/** Every source in the file, including extra sources, for listing or checking. */
export function allSources(d: SystemConnections = data): Source[] {
  return [
    ...d.structure.map(s => s.source),
    ...d.leadAgencyTypes.map(s => s.source),
    ...d.divisionRoles.flatMap(s => [s.source, ...(s.alsoSee ?? [])]),
    ...d.departmentRoles.map(s => s.source),
    ...d.referralPaths.map(s => s.source),
    d.tribalNations.source,
    d.tribalNations.relationshipSource,
  ];
}

export function structureByKind(kind: StructureKind): StructureItem[] {
  return data.structure.filter(s => s.kind === kind);
}
