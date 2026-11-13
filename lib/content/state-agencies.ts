/**
 * State of Minnesota agencies, boards and councils, from the state's official directory
 * (mn.gov "State Agencies, Boards, Commissions"). Each one is a node in the program's knowledge graph:
 * `topics` is the responsibility map (the work the agency holds that staff most often meet), which connects
 * it to the program's tasks, goals and program areas. Agencies about Indian or Tribal matters are link-only:
 * the program points to them and to their own sites, and never answers from their content.
 */
import data from "./state-agencies.json";
import partners from "./public-partners.json";

/** `areas`: the program work areas the agency's responsibilities fall under (reviewed responsibility map). */
export type StateAgency = { id: string; name: string; href: string; description: string; topics: string; areas: string[]; linkOnly: boolean };

export const STATE_AGENCIES: readonly StateAgency[] = data.agencies;
export const STATE_AGENCY_SOURCE = data.source;

/**
 * Public partners outside the state directory: county lead agencies, the Minnesota Legislature and federal partners.
 * They are nodes of the same graph. Nonprofit partners are the hub's organization records; Tribal Nations stay
 * link-only in the hub's county directory.
 */
export type PartnerGroup = "county" | "legislature" | "federal";
export type PublicPartner = StateAgency & { group: PartnerGroup };
export const PUBLIC_PARTNERS: readonly PublicPartner[] = partners.partners as PublicPartner[];
export const PARTNER_GROUP_LABEL: Record<PartnerGroup, string> = { county: "County lead agencies", legislature: "Minnesota Legislature", federal: "Federal partners" };
/** Every public body in the graph: the state directory and the public partners. */
export const PUBLIC_BODIES: readonly (StateAgency & { group?: PartnerGroup })[] = [...STATE_AGENCIES, ...PUBLIC_PARTNERS];

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

/** The One DSD directory entry; its official website remains linked on that page. */
export function agencyPageHref(id: string): string { return `/minnesota-agencies/${encodeURIComponent(id)}`; }
