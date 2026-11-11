/**
 * State of Minnesota agencies, boards and councils, from the state's official directory
 * (mn.gov "State Agencies, Boards, Commissions"). Each one is a node in the program's knowledge graph:
 * `topics` is the responsibility map (the work the agency holds that staff most often meet), which connects
 * it to the program's tasks, goals and program areas. Agencies about Indian or Tribal matters are link-only:
 * the program points to them and to their own sites, and never answers from their content.
 */
import data from "./state-agencies.json";

/** `areas`: the program work areas the agency's responsibilities fall under (reviewed responsibility map). */
export type StateAgency = { id: string; name: string; href: string; description: string; topics: string; areas: string[]; linkOnly: boolean };

export const STATE_AGENCIES: readonly StateAgency[] = data.agencies;
export const STATE_AGENCY_SOURCE = data.source;

/** The node id an agency carries in the knowledge graph and the facet map. */
export function agencyNodeId(agency: Pick<StateAgency, "id">): string { return `agency:${agency.id}`; }

/** The words that connect an agency to program work: its responsibility map first, then its name. */
export function agencyConnectionText(agency: StateAgency): string {
  return agency.linkOnly ? agency.name : [agency.name, agency.topics].join(" ");
}

/** "Health, Department of" reads as "Department of Health". */
export function agencyDisplayName(name: string): string {
  const m = /^(.+?),\s*(Department of|Office of|Board of|Board on|Council on|Council for|Minnesota Council on|Minnesota Office of|Governor's Council on|Ombudsman for|Minnesota)$/.exec(name);
  return m ? `${m[2]} ${m[1]}`.replace(/^Minnesota (?=[A-Z])/, "Minnesota ") : name;
}
