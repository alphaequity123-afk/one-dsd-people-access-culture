/**
 * One codebase serves two applications: One DHS (the agency) and One DSD (the Disability Services Division).
 * Each deployment sets PAC_UNIT; everything that names the application reads it from here.
 */
export type UnitId = "dhs" | "dsd";

export type Unit = {
  id: UnitId;
  /** Short name used in the banner, breadcrumbs and links: "One DHS". */
  short: string;
  /** Full application name: "One DHS People, Access and Culture". */
  name: string;
  /** The organization the application serves, for descriptions and Ask. */
  organization: string;
  /** Name of the observance calendar. */
  calendar: string;
  description: string;
};

const UNITS: Record<UnitId, Unit> = {
  dhs: {
    id: "dhs",
    short: "One DHS",
    name: "One DHS People, Access and Culture",
    organization: "the Minnesota Department of Human Services",
    calendar: "DHS Culture Calendar",
    description: "Learning, guidance and practical tools to support equity in the work of the Minnesota Department of Human Services.",
  },
  dsd: {
    id: "dsd",
    short: "One DSD",
    name: "One DSD People, Access and Culture",
    organization: "the Disability Services Division of the Minnesota Department of Human Services",
    calendar: "Culture Calendar",
    description: "Learning, guidance and tools for equity in the work and workplace of the Disability Services Division.",
  },
};

export function unitId(value = process.env.PAC_UNIT): UnitId {
  // v2 rebuild: this application is One DSD unless a deployment says One DHS.
  return value?.trim().toLowerCase() === "dhs" ? "dhs" : "dsd";
}

export function currentUnit(value?: string): Unit {
  return UNITS[unitId(value ?? process.env.PAC_UNIT)];
}
