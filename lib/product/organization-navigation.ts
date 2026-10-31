import reference from "@/data/organization/minnesota-dhs.json";
import { ORGANIZATIONAL_AREAS } from "@/lib/product/workforce-map";

/** Navigation follows the recovered program's organizational baseline, not a staff roster. */
export const ADMINISTRATION_NAVIGATION = [
  { id: "adsa", description: "Aging, disability, community support and adult protection.", topics: ["aging", "adult-protection", "dsd-placement"], divisions: ["dsd"] },
  { id: "health-care", description: "Health care coverage, Medicaid and access to Minnesota Health Care Programs.", topics: ["mhcp", "civil-rights", "language-access"], divisions: [] },
  { id: "behavioral-health", description: "Behavioral health services, coordinated care and connections with community partners.", topics: ["behavioral-health", "county-tribal", "civil-rights"], divisions: [] },
  { id: "housing", description: "Housing, homelessness and the relationships that support community life.", topics: ["housing", "county-tribal", "language-access"], divisions: [] },
].map(area => ({ ...area, name: ORGANIZATIONAL_AREAS.find(item => item.id === area.id)!.name }));

export function administrationNavigation(id: string) {
  return ADMINISTRATION_NAVIGATION.find(area => area.id === id);
}

export function organizationTopics(ids: readonly string[]) {
  return ids.map(id => reference.entries.find(entry => entry.id === `ext-dhs-org-${id}`)!);
}

export const ORGANIZATION_DIRECTORY_URL = "https://mn.gov/dhs/about-us/contact-us/agencywide-organization/";
export const ORGANIZATION_NAVIGATION_SOURCE_NOTE = "Explore program resources by administration. For current organizational and contact information, use the DHS agencywide directory.";
