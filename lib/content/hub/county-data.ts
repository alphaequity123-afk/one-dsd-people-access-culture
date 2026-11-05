// Typed access to the Minnesota county data built by scripts/data/build-county-data.py.
// Safe for client and server code: plain data, no server-only imports.
import rawData from "./county-data.json";
import rawShapes from "./mn-county-shapes.json";

export const GROUP_IDS = [
  "american-indian",
  "asian-pacific-islander",
  "black",
  "hispanic",
  "multiracial",
  "white",
  "all",
] as const;
export type GroupId = (typeof GROUP_IDS)[number];

export const MEASURE_IDS = ["population", "services", "comparison", "earned-income"] as const;
export type MeasureId = (typeof MEASURE_IDS)[number];

export type ServiceStatus = "reported" | "suppressed" | "not-reported";

export type GroupFigures = {
  population: { share2022: number | null; share2018: number | null };
  services: {
    share: number | null;
    count: number | null;
    countyCount: number | null;
    suppressed: boolean;
    status: ServiceStatus;
  };
  comparison: {
    ratio: number | null;
    groupCount: number | null;
    groupCountSuppressed: boolean;
    enoughPeople: boolean;
  };
  earnedIncome: { percent: number | null; recipients: number | null; suppressed: boolean; status?: "not-reported" };
};

export type Place = {
  /** "27" for Statewide, five-digit county code otherwise. */
  fips: string;
  name: string;
  totalPopulation2025: number | null;
  nonEnglishShare: number | null;
  servicesReportedSeparately: boolean;
  servicesUnknownRaceCount: number | null;
  groups: Record<GroupId, GroupFigures>;
};

export type Source = {
  id: string;
  title: string;
  pageName?: string;
  publisher: string;
  date: string;
  url: string;
  file: string;
};

export type MeasureMeta = {
  label: string;
  date: string;
  compareDate?: string;
  ages?: string;
  method?: string;
  minimumCount?: number;
  populationFilter?: string;
  populationFilterPlain?: string;
  note?: string;
  source?: string;
};

export type CountyData = {
  version: number;
  builtOn: string;
  groups: { id: GroupId; label: string }[];
  measures: Record<MeasureId | "totalPopulation" | "nonEnglish", MeasureMeta>;
  sources: Source[];
  definitions: {
    county: string;
    suppression: string;
    notReported: string;
    otherReportingUnitsNote: string;
    otherReportingUnits: string[];
    countiesWithoutSeparateServiceRows: string[];
  };
  places: Place[];
};

export type CountyShape = { fips: string; name: string; d: string; labelX: number; labelY: number };
export type CountyShapes = { source: string; projection: string; viewBox: string; width: number; height: number; counties: CountyShape[] };

/**
 * Why a value is or is not shown:
 * - "ok": a figure is shown
 * - "suppressed": the source hides the count (under 6)
 * - "too-few": fewer than 11 people, too few to compare
 * - "not-reported": the source has no figure for this county and group
 * - "not-applicable": the measure does not apply to this group (for example, comparing all people with all people)
 */
export type ValueStatus = "ok" | "suppressed" | "too-few" | "not-reported" | "not-applicable";

export type MeasureValue = {
  value: number | null;
  status: ValueStatus;
  /** People counted for this value, when the source gives the count. */
  count: number | null;
  /** All people receiving services in the county, for service and comparison values. */
  countyCount: number | null;
};

const data = rawData as unknown as CountyData;
const shapes = rawShapes as unknown as CountyShapes;
export const STATEWIDE_FIPS = "27";
export const MIN_COMPARE_COUNT = data.measures.comparison.minimumCount ?? 11;

const byFips = new Map(data.places.map(p => [p.fips, p]));
const byName = new Map(data.places.map(p => [p.name.toLowerCase(), p]));

export function getCountyData(): CountyData {
  return data;
}

export function getCountyShapes(): CountyShapes {
  return shapes;
}

export function isGroupId(value: unknown): value is GroupId {
  return typeof value === "string" && (GROUP_IDS as readonly string[]).includes(value);
}

export function isMeasureId(value: unknown): value is MeasureId {
  return typeof value === "string" && (MEASURE_IDS as readonly string[]).includes(value);
}

export function groupLabel(group: GroupId): string {
  return data.groups.find(g => g.id === group)?.label ?? group;
}

/** Finds a place by FIPS code or name ("Hennepin", "Statewide"). */
export function findPlace(place: string | Place): Place | undefined {
  if (typeof place !== "string") return place;
  return byFips.get(place) ?? byName.get(place.trim().toLowerCase().replace(/ county$/, ""));
}

/** The 87 counties, without Statewide, in alphabetical order. */
export function counties(): Place[] {
  return data.places.filter(p => p.fips !== STATEWIDE_FIPS);
}

export function statewidePlace(): Place {
  return byFips.get(STATEWIDE_FIPS)!;
}

/** True when the measure has a meaningful value for the group (shares of "all people" are always 100%). */
export function measureAppliesTo(group: GroupId, measure: MeasureId): boolean {
  return group !== "all" || measure === "earned-income";
}

export function measureFor(place: string | Place, group: GroupId, measure: MeasureId): MeasureValue {
  const p = findPlace(place);
  const empty: MeasureValue = { value: null, status: "not-reported", count: null, countyCount: null };
  if (!p) return empty;
  const g = p.groups[group];
  if (!g) return empty;
  if (!measureAppliesTo(group, measure)) {
    return { ...empty, status: "not-applicable", countyCount: g.services.countyCount };
  }
  switch (measure) {
    case "population": {
      const v = g.population.share2022;
      return { value: v, status: v == null ? "not-reported" : "ok", count: null, countyCount: null };
    }
    case "services": {
      const s = g.services;
      const status: ValueStatus = s.share != null ? "ok" : s.suppressed ? "suppressed" : "not-reported";
      return { value: s.share, status, count: s.count, countyCount: s.countyCount };
    }
    case "comparison": {
      const c = g.comparison;
      let status: ValueStatus = "ok";
      if (c.ratio == null) {
        if (c.groupCountSuppressed) status = "suppressed";
        else if (c.groupCount != null && c.groupCount < MIN_COMPARE_COUNT) status = "too-few";
        else status = "not-reported";
      }
      return { value: c.ratio, status, count: c.groupCount, countyCount: g.services.countyCount };
    }
    case "earned-income": {
      const e = g.earnedIncome;
      const status: ValueStatus = e.percent != null ? "ok" : e.suppressed ? "suppressed" : "not-reported";
      return { value: e.percent, status, count: e.recipients, countyCount: null };
    }
  }
}

export function statewide(group: GroupId, measure: MeasureId): MeasureValue {
  return measureFor(STATEWIDE_FIPS, group, measure);
}

/** Share of people in the group in 2018, for showing change over time. */
export function populationShare2018(place: string | Place, group: GroupId): number | null {
  return findPlace(place)?.groups[group]?.population.share2018 ?? null;
}

// ---------- Formatting (plain language) ----------

export function formatPercent(value: number | null, digits = 1): string {
  if (value == null) return "";
  const pct = value * 100;
  if (pct > 0 && pct < 0.05) return "under 0.1%";
  return `${pct.toFixed(digits)}%`;
}

export function formatRatio(value: number | null): string {
  if (value == null) return "";
  return `${value.toFixed(2)} times`;
}

export function formatValue(measure: MeasureId, value: number | null): string {
  return measure === "comparison" ? formatRatio(value) : formatPercent(value);
}

export function formatCount(value: number | null): string {
  return value == null ? "" : value.toLocaleString("en-US");
}

export function statusText(status: ValueStatus): string {
  switch (status) {
    case "suppressed":
      return "Too few people to show";
    case "too-few":
      return "Too few people to compare";
    case "not-reported":
      return "No figure in the source";
    case "not-applicable":
      return "Does not apply to all people";
    default:
      return "";
  }
}

/** Plain-language difference from the statewide figure. */
export function compareWithStatewide(measure: MeasureId, value: number | null, state: number | null): string {
  if (value == null || state == null) return "";
  if (measure === "comparison") {
    const diff = value - state;
    if (Math.abs(diff) < 0.005) return "Same as statewide";
    return `${Math.abs(diff).toFixed(2)} ${diff > 0 ? "higher" : "lower"} than statewide`;
  }
  const points = (value - state) * 100;
  if (Math.abs(points) < 0.05) return "Same as statewide";
  return `${Math.abs(points).toFixed(1)} points ${points > 0 ? "above" : "below"} statewide`;
}
