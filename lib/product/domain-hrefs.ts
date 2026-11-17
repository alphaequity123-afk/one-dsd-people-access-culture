import type { DomainId } from "@/lib/domains";
import type { WorkAreaId } from "./work-areas";

// Primary work-area associations already defined by WORK_AREA_STARTS/WORK_AREA_DOMAINS.
// /areas/:id is owned by the agency app; the existing work detail pages avoid that collision.
export const DOMAIN_WORK_AREAS: Readonly<Record<DomainId, WorkAreaId>> = {
  workforce: "workforce_equity",
  "policy-program-service": "policy_program_service_design",
  "community-engagement": "community_engagement_co_design",
  "access-language": "accessibility_language_access",
  "culture-trust": "culture_trust_repair",
  "leadership-systems": "leadership_systems_change",
  measurement: "data_research_quality_measurement",
};

/** Normalize only known local domain bookmarks, retaining query and fragment context. */
export function canonicalDomainHref(href: string): string {
  const match = href.match(/^\/(?:domains|areas)\/([^/?#]+)(\/?(?:[?#].*)?)$/);
  if (!match || !Object.hasOwn(DOMAIN_WORK_AREAS, match[1])) return href;
  return `/areas/work/${DOMAIN_WORK_AREAS[match[1] as DomainId]}${match[2].replace(/^\//, "")}`;
}
