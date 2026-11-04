import equity from "./equity-fy22-24.json";
import glossary from "./equity-glossary.json";
import goalsFile from "./equity-goals.json";

/* ---------- Types ---------- */

export type RaceId = "all" | "american-indian" | "asian-pacific-islander" | "black" | "hispanic" | "multiracial" | "unknown" | "white";
export type Unit = "percent" | "riskRatio" | "dollars";
export type AgeGroup = "youth" | "adults";

export type Point = {
  year: number;
  value: number;
  /** Denominator count. */
  n?: number;
  /** Numerator count, for percents. */
  k?: number;
  /** Two-by-two cells for a risk ratio: a of b in this group, c of d in everyone else. */
  cells?: { a: number; b: number; c: number; d: number };
};

export type Series = { race: RaceId; label: string; points: Point[] };

export type Measure = {
  id: string;
  goal: 1 | 2 | 3 | 4 | 5 | 6;
  ageGroup: AgeGroup;
  /** Full official program or service name. */
  program: string;
  title: string;
  plainWhat: string;
  /** Who the sentence is about, for example "adults on a disability waiver". */
  subject: string;
  /** What happened to them, for example "had a paying job". */
  outcome: string;
  series: Series[];
  unit: Unit;
  higherIsBetter: boolean;
  source: string;
  /** Plain note on anything unusual about the data. */
  note?: string;
};

export type Baseline = {
  race: RaceId;
  label: string;
  value: number | null;
  interval: [number, number] | null;
  years: number[];
  n: number | null;
  method: "count-weighted" | "mean" | "none";
};

export type Goal = { number: number; id: string; title: string; focus: string; summary: string; questions: string[]; antiRacism: string; output: string };
export type GoalMapEntry = { goal: Goal; measureIds: string[]; dataGaps: string[] };

/* ---------- Labels and sources ---------- */

export const RACE_LABELS: Record<RaceId, string> = { ...(equity.races as Record<RaceId, string>), unknown: "Race not recorded" };
export const RACE_ORDER: RaceId[] = ["american-indian", "asian-pacific-islander", "black", "hispanic", "multiracial", "white", "unknown", "all"];
const COMPARABLE: RaceId[] = ["american-indian", "asian-pacific-islander", "black", "hispanic", "multiracial", "white"];

export const DIVISION_SOURCE = "Disability Services Division employment equity data, fiscal years 2022 to 2024";
export const BASELINE_YEARS: [number, number] = [2022, 2024];
export const POOLED = "fiscal years 2022 to 2024 pooled";
export const GLOSSARY = glossary as { rule: string; terms: { short: string; full: string; plain: string; source: string }[] };
export const GOALS: Goal[] = (goalsFile.goals as Goal[]).map(({ number, id, title, focus, summary, questions, antiRacism, output }) => ({ number, id, title, focus, summary, questions, antiRacism, output }));

/** Names the readability check treats as one proper noun. */
export function properNouns(): string[] {
  return [...new Set([...GLOSSARY.terms.map(t => t.full), ...Object.values(RACE_LABELS)])];
}

/* ---------- Raw data helpers ---------- */

type AccessRow = { year: number; race: string; counts: Record<string, number | null>; riskRatios: Record<string, number | null> };
type IncomeRow = { year: number; race: string; total: number; counts: Record<string, number | null>; riskRatios: Record<string, number | null> };
type OutcomeRow = { year: number; race: string; group: "all" | "waiver" | "non-waiver"; exits: number; employed: number; percent: number; riskRatio: number | null };

const access = equity.serviceAccess as { youth: { rows: AccessRow[] }; adults: { rows: AccessRow[] } };
const income = equity.income as { youth: { rows: IncomeRow[] }; adults: { rows: IncomeRow[] } };
const outcomes = equity.vocationalRehabilitationOutcomes.rows as OutcomeRow[];
const exitIncome = equity.vocationalRehabilitationExitIncome.rows as { race: string; nonWaiver: number; waiver: number; all: number }[];

const round = (v: number, places = 2) => Math.round(v * 10 ** places) / 10 ** places;

function accessRiskRatioSeries(age: AgeGroup, service: string): Series[] {
  const rows = access[age].rows;
  return RACE_ORDER.filter(r => r !== "all").map(race => ({
    race, label: RACE_LABELS[race],
    points: rows.filter(r => r.race === race).sort((a, b) => a.year - b.year).flatMap(row => {
      const all = rows.find(r => r.year === row.year && r.race === "all");
      const a = row.counts[service], b = row.counts.Waiver, c = all?.counts[service], d = all?.counts.Waiver;
      if (a == null || b == null || c == null || d == null || row.riskRatios[service] == null) return [];
      return [{ year: row.year, value: row.riskRatios[service] as number, n: b, cells: { a, b, c: c - a, d: d - b } }];
    }),
  })).filter(s => s.points.length);
}

function incomePercentSeries(age: AgeGroup, band: string): Series[] {
  const rows = income[age].rows;
  return RACE_ORDER.map(race => ({
    race, label: RACE_LABELS[race],
    points: rows.filter(r => r.race === race).sort((a, b) => a.year - b.year).flatMap(row => {
      const k = row.counts[band];
      if (k == null || !row.total) return [];
      return [{ year: row.year, value: round(100 * k / row.total, 1), n: row.total, k }];
    }),
  })).filter(s => s.points.length);
}

function outcomePercentSeries(group: OutcomeRow["group"]): Series[] {
  return RACE_ORDER.map(race => ({
    race, label: RACE_LABELS[race],
    points: outcomes.filter(r => r.race === race && r.group === group && r.exits > 0).sort((a, b) => a.year - b.year)
      .map(row => ({ year: row.year, value: round(100 * row.employed / row.exits, 1), n: row.exits, k: row.employed })),
  })).filter(s => s.points.length);
}

function exitEarningsSeries(key: "waiver" | "nonWaiver"): Series[] {
  return RACE_ORDER.flatMap(race => {
    const row = exitIncome.find(r => r.race === race);
    return row ? [{ race, label: RACE_LABELS[race], points: [{ year: 2023, value: row[key] }] }] : [];
  });
}

/* ---------- Measures ---------- */

const VR = "Vocational Rehabilitation Services or State Services for the Blind";
const frame = (program: string) => `${program}: who gets it, by race and ethnicity, ${POOLED}`;
const accessWhat = (program: string, who: string) => `How likely ${who} were to use ${program}. Each race is compared with everyone else on a waiver.`;
const ADULTS = "adults on a waiver";
const YOUTH = "young people on a waiver";

let cache: Measure[] | null = null;

export function measures(): Measure[] {
  if (cache) return cache;
  const accessMeasure = (id: string, ageGroup: AgeGroup, program: string, key: string, used: string, note?: string): Measure => ({
    id, goal: 1, ageGroup, program, unit: "riskRatio", higherIsBetter: true, source: DIVISION_SOURCE, note,
    title: `${frame(program)}, ${ageGroup === "youth" ? "young people age 14 to 21" : "adults age 22 to 64"}`,
    plainWhat: accessWhat(program, ageGroup === "youth" ? "young people age 14 to 21 on a waiver" : "adults age 22 to 64 on a waiver"),
    subject: ageGroup === "youth" ? YOUTH : ADULTS, outcome: used, series: accessRiskRatioSeries(ageGroup, key),
  });
  const incomeMeasure = (id: string, ageGroup: AgeGroup, band: string, bandName: string, outcome: string, higherIsBetter: boolean): Measure => ({
    id, goal: 1, ageGroup, program: `Income band: ${bandName}`, unit: "percent", higherIsBetter, source: DIVISION_SOURCE,
    title: `${frame(`Income band, ${bandName}`)}, ${ageGroup === "youth" ? "young people age 14 to 21" : "adults age 22 to 64"}`,
    plainWhat: `The share of ${ageGroup === "youth" ? "young people age 14 to 21" : "adults age 22 to 64"} on a waiver whose monthly pay was ${bandName.toLowerCase()}.`,
    subject: ageGroup === "youth" ? YOUTH : ADULTS, outcome, series: incomePercentSeries(ageGroup, band),
  });
  const list: Measure[] = [
    accessMeasure("adults-employment-exploration-services", "adults", "Employment Exploration Services", "EES", "used Employment Exploration Services"),
    accessMeasure("adults-employment-development-services-plan", "adults", "Employment Development Services, Plan phase", "EDS Plan", "used Employment Development Services, Plan phase"),
    accessMeasure("adults-employment-development-services-find", "adults", "Employment Development Services, Find phase", "EDS Find", "used Employment Development Services, Find phase"),
    accessMeasure("adults-vocational-rehabilitation", "adults", VR, "VRS/SSB", `used ${VR}`),
    accessMeasure("adults-employment-support-services-individual", "adults", "Employment Support Services, Individual", "ESS Indiv.", "used Employment Support Services, Individual"),
    accessMeasure("adults-employment-support-services-group", "adults", "Employment Support Services, Group", "ESS Group", "used Employment Support Services, Group", "The state's own note says this service often leads to segregation. A higher value is not always better."),
    accessMeasure("adults-prevocational-services", "adults", "Prevocational Services", "Prevoc", "used Prevocational Services", "This service is usually in a separate setting. It pays below minimum wage. A higher value is not always better."),
    accessMeasure("youth-vocational-rehabilitation", "youth", VR, "VRS/SSB", `used ${VR}`),
    accessMeasure("youth-employment-support-services", "youth", "Employment Support Services, all types", "ESS (all)", "used Employment Support Services, all types"),
    incomeMeasure("adults-no-reported-income", "adults", "No income", "No reported income", "had no reported income", false),
    incomeMeasure("adults-income-1-to-599", "adults", "$1-$599", "$1 to $599 a month", "earned $1 to $599 a month", true),
    incomeMeasure("adults-income-600-or-more", "adults", "$600+", "$600 or more a month", "earned $600 or more a month", true),
    incomeMeasure("youth-no-reported-income", "youth", "No income", "No reported income", "had no reported income", false),
    incomeMeasure("youth-income-1-to-599", "youth", "$1-$599", "$1 to $599 a month", "earned $1 to $599 a month", true),
    incomeMeasure("youth-income-600-or-more", "youth", "$600+", "$600 or more a month", "earned $600 or more a month", true),
    { id: "vocational-rehabilitation-exit-employment-waiver", goal: 1, ageGroup: "adults", program: `${VR}, employed at exit, on a disability waiver`, unit: "percent", higherIsBetter: true, source: DIVISION_SOURCE,
      title: `${frame(`${VR}, employed at exit, adults on a disability waiver`)}, adults age 22 to 64`,
      plainWhat: `Adults on a waiver who left ${VR}. The share who left with a job.`, subject: "adults on a waiver who left this service", outcome: "left with a job",
      series: outcomePercentSeries("waiver") },
    { id: "vocational-rehabilitation-exit-employment-non-waiver", goal: 1, ageGroup: "adults", program: `${VR}, employed at exit, not on a disability waiver`, unit: "percent", higherIsBetter: true, source: DIVISION_SOURCE,
      title: `${frame(`${VR}, employed at exit, adults not on a disability waiver`)}, adults age 22 to 64`,
      plainWhat: `Adults not on a waiver who left ${VR}. The share who left with a job.`, subject: "adults not on a waiver who left this service", outcome: "left with a job",
      series: outcomePercentSeries("non-waiver") },
    { id: "vocational-rehabilitation-exit-earnings-waiver", goal: 1, ageGroup: "adults", program: `${VR}, first-year earnings after exit, on a disability waiver`, unit: "dollars", higherIsBetter: true, source: DIVISION_SOURCE,
      title: `${VR}, first-year earnings after exit: who earns what, by race and ethnicity, fiscal years 2022 and 2023 combined, adults on a disability waiver`,
      plainWhat: "What adults on a waiver earned, on average, in the first year after they left the service. The source combines fiscal years 2022 and 2023.", subject: "adults on a waiver who left this service", outcome: "earned in their first year",
      series: exitEarningsSeries("waiver"), note: "The source gives one figure for fiscal years 2022 and 2023 together. It gives no count, so there is no confidence interval." },
    { id: "vocational-rehabilitation-exit-earnings-non-waiver", goal: 1, ageGroup: "adults", program: `${VR}, first-year earnings after exit, not on a disability waiver`, unit: "dollars", higherIsBetter: true, source: DIVISION_SOURCE,
      title: `${VR}, first-year earnings after exit: who earns what, by race and ethnicity, fiscal years 2022 and 2023 combined, adults not on a disability waiver`,
      plainWhat: "What adults not on a waiver earned, on average, in the first year after they left the service. The source combines fiscal years 2022 and 2023.", subject: "adults not on a waiver who left this service", outcome: "earned in their first year",
      series: exitEarningsSeries("nonWaiver"), note: "The source gives one figure for fiscal years 2022 and 2023 together. It gives no count, so there is no confidence interval." },
  ];
  cache = list;
  return list;
}

export function measure(id: string): Measure | undefined {
  return measures().find(m => m.id === id);
}

/* ---------- Statistics ---------- */

const Z = 1.959964;

export function wilsonInterval(k: number, n: number): [number, number] {
  if (n <= 0) return [0, 0];
  const p = k / n, z2 = Z * Z;
  const denominator = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / denominator;
  const half = (Z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n))) / denominator;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

export function riskRatioInterval(cells: { a: number; b: number; c: number; d: number }): { value: number; interval: [number, number] } | null {
  const { a, b, c, d } = cells;
  if (a <= 0 || b <= 0 || c <= 0 || d <= 0) return null;
  const value = (a / b) / (c / d);
  const se = Math.sqrt(1 / a - 1 / b + 1 / c - 1 / d);
  return { value, interval: [value * Math.exp(-Z * se), value * Math.exp(Z * se)] };
}

export function baselinePoints(series: Series): Point[] {
  return series.points.filter(p => p.year >= BASELINE_YEARS[0] && p.year <= BASELINE_YEARS[1]);
}

export function pool(unit: Unit, points: Point[]): Omit<Baseline, "race" | "label"> {
  const years = [...new Set(points.map(p => p.year))].sort();
  if (!points.length) return { value: null, interval: null, years, n: null, method: "none" };
  if (unit === "percent" && points.every(p => p.k != null && p.n)) {
    const k = points.reduce((s, p) => s + (p.k as number), 0), n = points.reduce((s, p) => s + (p.n as number), 0);
    const [lo, hi] = wilsonInterval(k, n);
    return { value: round(100 * k / n, 1), interval: [round(100 * lo, 1), round(100 * hi, 1)], years, n, method: "count-weighted" };
  }
  if (unit === "riskRatio" && points.every(p => p.cells)) {
    const cells = points.reduce((s, p) => ({ a: s.a + p.cells!.a, b: s.b + p.cells!.b, c: s.c + p.cells!.c, d: s.d + p.cells!.d }), { a: 0, b: 0, c: 0, d: 0 });
    const pooled = riskRatioInterval(cells);
    if (pooled) return { value: round(pooled.value), interval: [round(pooled.interval[0]), round(pooled.interval[1])], years, n: cells.b, method: "count-weighted" };
  }
  const mean = points.reduce((s, p) => s + p.value, 0) / points.length;
  return { value: round(mean, unit === "dollars" ? 0 : 2), interval: null, years, n: points.every(p => p.n != null) ? points.reduce((s, p) => s + (p.n as number), 0) : null, method: "mean" };
}

export function baseline(m: Measure): Baseline[] {
  return m.series.map(s => ({ race: s.race, label: s.label, ...pool(m.unit, baselinePoints(s)) }));
}

export function baselineFor(m: Measure, race: RaceId): Baseline | undefined {
  return baseline(m).find(b => b.race === race);
}

/* ---------- Narrative ---------- */

const per100 = (percent: number) => Math.round(percent);
export const dollars = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

function likelihood(rr: number): string {
  if (rr >= 1.95) return `${rr.toFixed(1)} times as likely as everyone else`;
  if (rr >= 1.1) return `${Math.round((rr - 1) * 100)} percent more likely than everyone else`;
  if (rr <= 0.9) return `${Math.round((1 - rr) * 100)} percent less likely than everyone else`;
  return "about as likely as everyone else";
}

/** The race with the widest gap on this measure. */
export function focusRace(m: Measure): RaceId {
  const candidates = baseline(m).filter(b => COMPARABLE.includes(b.race) && b.value != null);
  if (!candidates.length) return m.series[0]?.race ?? "all";
  if (m.unit === "riskRatio") return candidates.reduce((a, b) => (Math.abs((b.value as number) - 1) > Math.abs((a.value as number) - 1) ? b : a)).race;
  return candidates.reduce((a, b) => ((m.higherIsBetter ? (b.value as number) < (a.value as number) : (b.value as number) > (a.value as number)) ? b : a)).race;
}

const when = (m: Measure) => (m.unit === "dollars" ? "in fiscal years 2022 and 2023" : "from fiscal year 2022 to 2024");

export function narrative(m: Measure, race?: RaceId): string {
  const chosen = race ?? focusRace(m);
  const base = baselineFor(m, chosen);
  if (!base || base.value == null) return `There is not enough data to describe ${RACE_LABELS[chosen]} for this measure.`;
  const label = RACE_LABELS[chosen];
  const white = chosen !== "white" ? baselineFor(m, "white") : undefined;
  const all = chosen !== "all" ? baselineFor(m, "all") : undefined;
  const compare = white?.value != null ? white : all?.value != null ? all : undefined;
  const compareName = compare ? (compare.label === "All people" ? "all people" : `${compare.label} ${m.subject.split(" ")[0]}`) : "";
  if (m.unit === "percent") {
    const first = `Out of every 100 ${label === "All people" ? "" : `${label} `}${m.subject}, ${per100(base.value)} ${m.outcome} ${when(m)}.`;
    const second = compare ? ` For ${compareName} it was ${per100(compare.value as number)}.` : "";
    return (first + second).replace(/\s+/g, " ");
  }
  if (m.unit === "riskRatio") {
    return `${label} ${m.subject.replace("disability waiver", "waiver")} were ${likelihood(base.value)} to use this service. That is for fiscal years 2022 to 2024. A risk ratio of 1.0 would mean no difference.`;
  }
  const first = `${label} ${m.subject} ${m.outcome} about ${dollars(base.value)} ${when(m)}.`;
  const second = compare ? ` For ${compareName} it was about ${dollars(compare.value as number)}.` : "";
  return first + second;
}

/** Every sentence this library produces, for the acronym and readability tests. */
export function allNarratives(): { measureId: string; race: RaceId | null; text: string }[] {
  return measures().flatMap(m => [
    { measureId: m.id, race: null, text: narrative(m) },
    { measureId: m.id, race: null, text: m.plainWhat },
    ...(m.note ? [{ measureId: m.id, race: null, text: m.note }] : []),
    ...m.series.map(s => ({ measureId: m.id, race: s.race, text: narrative(m, s.race) })),
  ]);
}

/** The narratives the overview leads with: the widest gaps first. */
export function headlineNarratives(limit = 5): { measure: Measure; text: string }[] {
  const scored = measures().filter(m => m.unit !== "dollars").map(m => {
    const race = focusRace(m);
    const base = baselineFor(m, race)?.value, white = baselineFor(m, "white")?.value;
    const score = base == null ? 0 : m.unit === "riskRatio" ? Math.abs(base - 1) : white == null ? 0 : Math.abs(base - white) / 100;
    return { measure: m, text: narrative(m, race), score };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(({ measure: m, text }) => ({ measure: m, text }));
}

/* ---------- Goals ---------- */

const DATA_GAPS: Record<number, string[]> = {
  2: ["No engagement log exists yet. One would record who was invited, who took part, and what changed because of their input, by race."],
  3: ["No workforce data exists yet. It would count applicants, hires, promotions, retention and exits, by race, using the same risk-ratio method."],
  4: ["No learning data exists yet. One would record who had time and access to learning, and who applied it, by race."],
  5: ["No vendor-level data exists yet. One would record which providers learn of each opportunity, respond, and win contracts."],
  6: ["No communication data exists yet. One would record which notices people could use in their own language and format, by race."],
};

export function goalMap(): GoalMapEntry[] {
  const list = measures();
  return GOALS.map(goal => ({ goal, measureIds: list.filter(m => m.goal === goal.number).map(m => m.id), dataGaps: DATA_GAPS[goal.number] ?? [] }));
}

/* ---------- Formatting ---------- */

/** Plain question for the Ask page about a measure. */
export function askQuestion(m: Measure): string {
  return `What does the equity baseline show for ${m.program}, and what could close the gap?`;
}

export function formatValue(unit: Unit, value: number | null | undefined): string {
  if (value == null) return "Not available";
  if (unit === "percent") return `${value.toFixed(1)}%`;
  if (unit === "dollars") return dollars(value);
  return value.toFixed(2);
}

export const UNIT_LABEL: Record<Unit, string> = { percent: "Out of every 100", riskRatio: "Risk ratio (1.0 means no difference)", dollars: "Dollars" };
