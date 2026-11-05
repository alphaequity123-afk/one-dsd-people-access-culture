import data from "./organizations.json";

// One record per organization, shared by the Community Outreach and Engagement
// pages, the community pages, the knowledge graph and Ask. Each record lists the
// public records it rests on and the date the facts were checked.

export type OrganizationRelationshipType = "Grantee" | "Contractor" | "Partner" | "Advisory seat";

export type OrganizationRelationship = {
  type: string;
  program: string;
  years?: string;
  amount?: string;
  what: string;
  /** The record names the Department of Human Services but not the Disability Services Division. */
  departmentWide: boolean;
};

export type OrganizationRecord = { title: string; date?: string; url: string };

export type Organization = {
  slug: string;
  name: string;
  alsoKnownAs?: string;
  kind: string;
  relationshipTypes: string[];
  summary: string;
  whoItServes: string;
  whereItWorks: string;
  services: string[];
  withTheDivision: OrganizationRelationship[];
  whyItMattersForStaff: string;
  contact: { website?: string; phone?: string; email?: string };
  records: OrganizationRecord[];
  uncertainties: string[];
  checked: string;
  communities: string[];
  closed: boolean;
};

export const RELATIONSHIP_ORDER: OrganizationRelationshipType[] = ["Contractor", "Grantee", "Partner", "Advisory seat"];

/** Owner rule: Native community pages defer to the Office of Indian Affairs and receive no added content. */
export const NATIVE_COMMUNITY_IDS = ["native-american", "tribal-nations", "alaska-native"] as const;

export const ORGANIZATIONS_CHECKED: string = data.checked;

const rank = (org: Organization) => Math.min(...org.relationshipTypes.map(t => {
  const index = RELATIONSHIP_ORDER.indexOf(t as OrganizationRelationshipType);
  return index < 0 ? 9 : index;
}), 9);

export const ORGANIZATIONS: Organization[] = (data.organizations as unknown as Organization[])
  .slice()
  .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));

export function getOrganization(slug: string): Organization | undefined {
  return ORGANIZATIONS.find(org => org.slug === slug);
}

export function organizationHref(slug: string): string {
  return `/community-outreach/organizations/${slug}`;
}

export function isNativeCommunity(id: string): boolean {
  return (NATIVE_COMMUNITY_IDS as readonly string[]).includes(id);
}

/** Organizations on record as serving a community. Native pages always get none. */
export function organizationsForCommunity(communityId: string): Organization[] {
  if (isNativeCommunity(communityId)) return [];
  return ORGANIZATIONS.filter(org => org.communities.includes(communityId));
}

/** True when at least one relationship record names the Disability Services Division itself. */
export function hasDivisionRecord(org: Organization): boolean {
  return org.withTheDivision.some(rel => !rel.departmentWide);
}

export function relationshipLine(rel: OrganizationRelationship): string {
  return [rel.type, rel.program, rel.years, rel.amount].filter(Boolean).join(" · ");
}
