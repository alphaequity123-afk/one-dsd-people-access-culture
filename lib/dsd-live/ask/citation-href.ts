import { DHS_EQUITY_POLICY_SLUG, DHS_EQUITY_POLICY_URL } from "./policy-evidence";

export const publishedEquityPolicy = DHS_EQUITY_POLICY_URL;
export const isEquityPolicyCitation = (slug: string) => slug === DHS_EQUITY_POLICY_SLUG;

/** The database summary can predate the current policy reading. Link staff to the published document. */
export function askCitationHref(citation: { slug: string; sourceUrl?: string | null }): string {
  if (!isEquityPolicyCitation(citation.slug)) return `/r/${citation.slug}`;
  const addressedPage = citation.sourceUrl?.slice(publishedEquityPolicy.length);
  if (citation.sourceUrl?.startsWith(publishedEquityPolicy) && /^#page=[1-9][0-9]*$/.test(addressedPage ?? "")) {
    return citation.sourceUrl;
  }
  return publishedEquityPolicy;
}
