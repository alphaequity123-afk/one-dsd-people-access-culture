// Typed access to official-providers.json: organizations designated, contracted, licensed or
// certified by the State of Minnesota for disability and aging services (Centers for Independent
// Living, area agencies on aging, contracted health plans, Disability Hub MN, the 245D licensing
// lookup and other state-designated offices), with the counties each serves.
// Organizational contacts only. Safe for client and server code: plain data, no server-only imports.
import rawData from "./official-providers.json";
import { agencyForCounty } from "./county-agencies";

export type ProviderSource = { title: string; url: string; date: string };

export type OfficialProvider = {
  name: string;
  alsoKnownAs: string[];
  what: string;
  /** County names spelled as in county-agencies.json, or ["Statewide"]. May be empty when no county list is published. */
  counties: string[];
  website?: string;
  phone?: string;
  source: ProviderSource;
  additionalSources?: ProviderSource[];
  /** Exact "name" of the same organization in organizations.json, when it is listed there. */
  organizationsName?: string;
  /** Health plans only: counties per program, from the Department of Human Services county maps. */
  programCounties?: { specialNeedsBasicCare: string[]; seniorHealthOptions: string[] };
};

export type OfficialProviderCategory = {
  id: string;
  title: string;
  intro: string;
  designatedBy: string;
  entries: OfficialProvider[];
};

export type ProviderLookup = { name: string; what: string; url: string };

export type LicensedProviderCounts = {
  source: ProviderSource;
  date: string;
  byCounty: Record<string, number>;
  byServiceType?: Record<string, number>;
};

export type OfficialProvidersData = {
  checked: string;
  description: string;
  categories: OfficialProviderCategory[];
  licensedProviderCounts?: LicensedProviderCounts;
  licensedProviderCountsNote?: string;
  lookups: ProviderLookup[];
  tribalNote: string;
};

export const STATEWIDE = "Statewide";

const data = rawData as OfficialProvidersData;

export function getOfficialProviders(): OfficialProvidersData {
  return data;
}

export type CountyProviderMatch = {
  categoryId: string;
  categoryTitle: string;
  entry: OfficialProvider;
  statewide: boolean;
};

/**
 * Official providers that serve a county, by name ("Hennepin", "St. Louis County") or FIPS code
 * ("27053" or "053"). Includes statewide entries unless includeStatewide is false.
 * Returns an empty list for an unknown county.
 */
export function providersForCounty(
  fipsOrName: string,
  options: { includeStatewide?: boolean } = {},
): CountyProviderMatch[] {
  const county = agencyForCounty(fipsOrName);
  if (!county) return [];
  const includeStatewide = options.includeStatewide ?? true;
  const matches: CountyProviderMatch[] = [];
  for (const category of data.categories) {
    for (const entry of category.entries) {
      const statewide = entry.counties.includes(STATEWIDE);
      if (entry.counties.includes(county.county) || (includeStatewide && statewide)) {
        matches.push({ categoryId: category.id, categoryTitle: category.title, entry, statewide });
      }
    }
  }
  return matches;
}
