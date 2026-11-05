// Typed access to the Minnesota county agency directory in county-agencies.json.
// For each county: the agency that serves people there for Department of Human Services
// disability programs (MnCHOICES assessments, disability waivers, case management and other
// home and community-based services). Organizational contacts only.
// Safe for client and server code: plain data, no server-only imports.
import rawData from "./county-agencies.json";

export type AgencyStatus = "confirmed" | "partial";

export type CountyAgency = {
  /** Five-digit county code, 27xxx. */
  fips: string;
  county: string;
  agencyId: string;
  agencyName: string;
  shared: boolean;
  /** All counties the agency serves when shared; empty otherwise. */
  sharedCounties: string[];
  phone: string;
  phoneLabel: string;
  website: string;
  sourceTitle: string;
  sourceUrl: string;
  checked: string;
  status: AgencyStatus;
  notes: string;
};

export type DirectorySource = { id: string; title: string; url: string; usedFor: string };

export type TribalNationsLink = { kind: "directory-link"; title: string; url: string; note: string };

export type CountyAgencyData = {
  version: number;
  checked: string;
  description: string;
  sources: DirectorySource[];
  tribalNations: TribalNationsLink[];
  counties: CountyAgency[];
};

export type SharedAgency = {
  agencyId: string;
  agencyName: string;
  counties: string[];
  fips: string[];
  website: string;
};

const data = rawData as CountyAgencyData;

export function getCountyAgencies(): CountyAgencyData {
  return data;
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bsaint\b/g, "st")
    .replace(/[^a-z0-9]/g, "")
    .replace(/county$/, "");
}

/** Look up a county by name ("St. Louis", "Saint Louis County") or FIPS code ("27137" or "137"). */
export function agencyForCounty(nameOrFips: string): CountyAgency | undefined {
  const query = nameOrFips.trim();
  if (/^\d+$/.test(query)) {
    const code = query.length === 5 ? query : `27${query.padStart(3, "0")}`;
    return data.counties.find(c => c.fips === code);
  }
  const key = normalize(query);
  if (!key) return undefined;
  return data.counties.find(c => normalize(c.county) === key);
}

/** Agencies that serve more than one county, with their member counties. */
export function sharedAgencies(): SharedAgency[] {
  const byId = new Map<string, SharedAgency>();
  for (const c of data.counties) {
    if (!c.shared) continue;
    const entry = byId.get(c.agencyId) ?? {
      agencyId: c.agencyId,
      agencyName: c.agencyName,
      counties: [],
      fips: [],
      website: c.website,
    };
    entry.counties.push(c.county);
    entry.fips.push(c.fips);
    byId.set(c.agencyId, entry);
  }
  return [...byId.values()]
    .map(a => ({ ...a, counties: [...a.counties].sort(), fips: [...a.fips].sort() }))
    .sort((a, b) => a.agencyName.localeCompare(b.agencyName));
}
