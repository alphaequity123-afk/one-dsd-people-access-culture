"use client";
import { SourceLink } from "@/components/app-link";


import { useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import {
  compareWithStatewide,
  counties,
  formatCount,
  formatPercent,
  formatValue,
  getCountyData,
  getCountyShapes,
  groupLabel,
  measureAppliesTo,
  measureFor,
  MIN_COMPARE_COUNT,
  populationShare2018,
  STATEWIDE_FIPS,
  statewide,
  statewidePlace,
  statusText,
  type GroupId,
  type MeasureId,
  type MeasureValue,
  type Place,
} from "@/lib/content/hub/county-data";
import { agencyForCounty } from "@/lib/content/hub/county-agencies";
import styles from "./county-map.module.css";

export type CountyMapProps = {
  /** Group shown first. Ignored when fixedGroup is set. */
  initialGroup?: GroupId;
  initialMeasure?: MeasureId;
  /** Locks the map to one group, for example on a community page. Hides the group picker. */
  fixedGroup?: GroupId;
  /** Smaller layout for embedding inside another page. */
  compact?: boolean;
  /** Heading text. */
  heading?: string;
  headingLevel?: 2 | 3;
};

type Tab = "map" | "ranked" | "table";
type SortKey = "name" | "value" | "difference" | "count" | "population";

const TABS: { id: Tab; label: string }[] = [
  { id: "map", label: "Map" },
  { id: "ranked", label: "Ranked list" },
  { id: "table", label: "Table" },
];

const MEASURE_TEXT: Record<MeasureId, { short: string; column: string; help: (date: string) => string }> = {
  population: {
    short: "Share of population",
    column: "Share of county population",
    help: date => `Share of each county's people who are in this group, ${date}.`,
  },
  services: {
    short: "Share of people receiving services",
    column: "Share of people receiving services",
    help: date =>
      `Share of people receiving home and community-based services in each county who are in this group, ${date}.`,
  },
  comparison: {
    short: "Services compared with population",
    column: "Service share compared with population share",
    help: () =>
      `Service share divided by population share. 1 means they match. Above 1 means the group is a bigger share of people receiving services than of the county. Shown only when at least ${MIN_COMPARE_COUNT} people in the group receive services.`,
  },
  "earned-income": {
    short: "Earned income",
    column: "Share who earned income",
    help: date => `Share of people receiving home and community-based waiver services who earned income, ${date}.`,
  },
};

const REQUIRED_NOTE =
  "County is the county responsible for paying for services, which may not be where a person lives. Figures describe groups and conditions, not any one person. Counts under 6 are not shown by the Department of Human Services.";

type Row = { place: Place; v: MeasureValue; diff: number | null };

type Bins = { breaks: number[]; labels: string[]; diverging: boolean };

function niceShare(v: number): number {
  return Math.round(v * 1000) / 1000;
}

function makeBins(measure: MeasureId, values: number[]): Bins {
  if (measure === "comparison") {
    return {
      breaks: [0.5, 0.8, 1.25, 2],
      labels: ["Under 0.5 times", "0.5 to under 0.8 times", "0.8 to under 1.25 times (close to a match)", "1.25 to under 2 times", "2 times or more"],
      diverging: true,
    };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const breaks: number[] = [];
  if (sorted.length > 0) {
    for (const q of [0.2, 0.4, 0.6, 0.8]) {
      const b = niceShare(sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]);
      if (b > sorted[0] && (breaks.length === 0 || b > breaks[breaks.length - 1])) breaks.push(b);
    }
  }
  const labels: string[] = [];
  for (let i = 0; i <= breaks.length; i++) {
    if (breaks.length === 0) labels.push("All counties shown");
    else if (i === 0) labels.push(`Under ${formatPercent(breaks[0])}`);
    else if (i === breaks.length) labels.push(`${formatPercent(breaks[i - 1])} or more`);
    else labels.push(`${formatPercent(breaks[i - 1])} to under ${formatPercent(breaks[i])}`);
  }
  return { breaks, labels, diverging: false };
}

function binIndex(bins: Bins, v: number): number {
  let i = 0;
  while (i < bins.breaks.length && v >= bins.breaks[i]) i++;
  // Sequential scales with fewer than 5 bins still use the darkest color for the top bin.
  return bins.diverging ? i : i + (5 - (bins.breaks.length + 1));
}

function valueText(measure: MeasureId, v: MeasureValue): string {
  return v.status === "ok" ? formatValue(measure, v.value) : statusText(v.status);
}

export default function CountyMap({
  initialGroup = "all",
  initialMeasure = "population",
  fixedGroup,
  compact = false,
  heading = "Minnesota counties",
  headingLevel = 2,
}: CountyMapProps) {
  const data = getCountyData();
  const shapes = getCountyShapes();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const startGroup = fixedGroup ?? initialGroup;
  const [groupState, setGroup] = useState<GroupId>(startGroup);
  const group = fixedGroup ?? groupState;
  const [measureState, setMeasure] = useState<MeasureId>(initialMeasure);
  const measure: MeasureId = measureAppliesTo(group, measureState) ? measureState : "earned-income";
  const [tab, setTab] = useState<Tab>("map");
  const [selected, setSelected] = useState<string>(STATEWIDE_FIPS);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focusFips, setFocusFips] = useState<string>(counties()[0].fips);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });
  const [filter, setFilter] = useState("");
  const pathRefs = useRef(new Map<string, SVGPathElement>());
  const tabRefs = useRef(new Map<Tab, HTMLButtonElement>());

  const countyList = useMemo(() => counties(), []);
  const state = statewide(group, measure);
  const measureMeta = data.measures[measure];

  const rows: Row[] = useMemo(
    () =>
      countyList.map(place => {
        const v = measureFor(place, group, measure);
        const diff = v.value != null && state.value != null ? v.value - state.value : null;
        return { place, v, diff };
      }),
    [countyList, group, measure, state.value],
  );
  const rowByFips = useMemo(() => new Map(rows.map(r => [r.place.fips, r])), [rows]);
  const bins = useMemo(
    () => makeBins(measure, rows.filter(r => r.v.value != null).map(r => r.v.value as number)),
    [measure, rows],
  );

  const Heading = headingLevel === 3 ? "h3" : "h2";
  const SubHeading = headingLevel === 3 ? "h4" : "h3";
  const hatchId = `${uid}-hatch`;

  function fillFor(v: MeasureValue): { className: string; style?: CSSProperties } {
    if (v.status === "ok" && v.value != null) {
      const i = binIndex(bins, v.value);
      return { className: bins.diverging ? styles[`div${i}`] : styles[`seq${i}`] };
    }
    if (v.status === "suppressed" || v.status === "too-few") {
      return { className: styles.hatched, style: { fill: `url(#${hatchId})` } };
    }
    return { className: styles.noData };
  }

  function chooseGroup(g: GroupId) {
    setGroup(g);
  }

  function selectPlace(fips: string) {
    setSelected(fips);
    setFocusFips(fips === STATEWIDE_FIPS ? focusFips : fips);
  }

  function onCountyKey(e: KeyboardEvent<SVGPathElement>, fips: string) {
    const idx = countyList.findIndex(c => c.fips === fips);
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % countyList.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + countyList.length) % countyList.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = countyList.length - 1;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectPlace(fips);
      return;
    } else if (e.key === "Escape") {
      setHovered(null);
      return;
    }
    if (next >= 0) {
      e.preventDefault();
      const f = countyList[next].fips;
      setFocusFips(f);
      pathRefs.current.get(f)?.focus();
    }
  }

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, current: Tab) {
    const i = TABS.findIndex(t => t.id === current);
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = TABS.length - 1;
    if (n >= 0) {
      e.preventDefault();
      setTab(TABS[n].id);
      tabRefs.current.get(TABS[n].id)?.focus();
    }
  }

  // ---------- Table ----------
  const tableRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = rows.filter(r => !q || r.place.name.toLowerCase().includes(q));
    const dir = sort.dir === "asc" ? 1 : -1;
    const num = (r: Row): number | null => {
      switch (sort.key) {
        case "value":
          return r.v.value;
        case "difference":
          return r.diff;
        case "count":
          return r.v.count;
        case "population":
          return r.place.totalPopulation2025;
        default:
          return null;
      }
    };
    return [...list].sort((a, b) => {
      if (sort.key === "name") return dir * a.place.name.localeCompare(b.place.name);
      const x = num(a);
      const y = num(b);
      if (x == null && y == null) return a.place.name.localeCompare(b.place.name);
      if (x == null) return 1; // missing values always last
      if (y == null) return -1;
      return dir * (x - y) || a.place.name.localeCompare(b.place.name);
    });
  }, [rows, filter, sort]);

  function toggleSort(key: SortKey) {
    setSort(s => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" ? "asc" : "desc" }));
  }

  function ariaSort(key: SortKey): "ascending" | "descending" | "none" {
    return sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
  }

  const showCount = measure !== "population";
  const countHeader =
    measure === "earned-income" ? "People who earned income" : "People in this group receiving services";

  // ---------- Ranked list ----------
  const ranked = rows.filter(r => r.v.value != null).sort((a, b) => (b.v.value as number) - (a.v.value as number));
  const unranked = rows.filter(r => r.v.value == null);
  const maxValue = Math.max(state.value ?? 0, ...ranked.map(r => r.v.value as number), 0.0001);

  // ---------- Details ----------
  const selectedPlace = selected === STATEWIDE_FIPS ? statewidePlace() : rowByFips.get(selected)?.place ?? statewidePlace();
  const tip = hovered ? rowByFips.get(hovered) : undefined;
  const tipShape = hovered ? shapes.counties.find(c => c.fips === hovered) : undefined;

  const groupOptions = data.groups;
  const label = groupLabel(group);
  const scopeText = `${label}. ${MEASURE_TEXT[measure].short}`;

  return (
    <section className={`${styles.root} ${compact ? styles.compact : ""}`} aria-labelledby={`${uid}-title`}>
      <Heading id={`${uid}-title`} className={styles.title}>
        {heading}
      </Heading>

      <div className={styles.controls}>
        {fixedGroup ? (
          <p className={styles.fixedGroup}>
            Group: <strong>{label}</strong>
          </p>
        ) : (
          <div className={styles.field}>
            <label htmlFor={`${uid}-group`}>Group</label>
            <select id={`${uid}-group`} value={group} onChange={e => chooseGroup(e.target.value as GroupId)}>
              {groupOptions.map(g => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <fieldset className={styles.measures}>
          <legend>What to show</legend>
          {(Object.keys(MEASURE_TEXT) as MeasureId[]).map(m => {
            const applies = measureAppliesTo(group, m);
            return (
              <label key={m} className={`${styles.measure} ${!applies ? styles.measureOff : ""}`}>
                <input
                  type="radio"
                  name={`${uid}-measure`}
                  value={m}
                  checked={measure === m}
                  disabled={!applies}
                  aria-describedby={!applies ? `${uid}-allnote` : undefined}
                  onChange={() => setMeasure(m)}
                />
                <span>{MEASURE_TEXT[m].short}</span>
              </label>
            );
          })}
          {group === "all" ? (
            <p id={`${uid}-allnote`} className={styles.hint}>
              For all people, shares are 100% in every county. Choose a group to see shares and comparisons.
            </p>
          ) : null}
        </fieldset>
      </div>

      <p className={styles.help}>{MEASURE_TEXT[measure].help(measureMeta.date)}</p>
      <p className={styles.statewideLine}>
        Statewide: <strong>{valueText(measure, state)}</strong>
      </p>

      <div role="tablist" aria-label="Ways to view the county figures" className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${uid}-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`${uid}-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className={styles.tab}
            ref={el => {
              if (el) tabRefs.current.set(t.id, el);
            }}
            onClick={() => setTab(t.id)}
            onKeyDown={e => onTabKey(e, t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.body}>
        <div className={styles.views}>
          {/* Map */}
          <div
            role="tabpanel"
            id={`${uid}-panel-map`}
            aria-labelledby={`${uid}-tab-map`}
            hidden={tab !== "map"}
            className={styles.panel}
          >
            <p id={`${uid}-maphelp`} className={styles.hint}>
              Point to or tab to a county to see its figure. Use the arrow keys to move between counties and Enter to
              show details. The table has the same figures.
            </p>
            <div className={styles.mapWrap}>
              <svg
                viewBox={shapes.viewBox}
                className={styles.map}
                role="group"
                aria-label={`Map of Minnesota counties. ${scopeText}.`}
                aria-describedby={`${uid}-maphelp`}
              >
                <defs>
                  <pattern id={hatchId} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                    <rect width="6" height="6" className={styles.hatchBg} />
                    <line x1="0" y1="0" x2="0" y2="6" className={styles.hatchLine} />
                  </pattern>
                </defs>
                {shapes.counties.map(c => {
                  const r = rowByFips.get(c.fips);
                  if (!r) return null;
                  const f = fillFor(r.v);
                  const cmp = compareWithStatewide(measure, r.v.value, state.value);
                  return (
                    <path
                      key={c.fips}
                      d={c.d}
                      ref={el => {
                        if (el) pathRefs.current.set(c.fips, el);
                        else pathRefs.current.delete(c.fips);
                      }}
                      className={`${styles.county} ${f.className}`}
                      style={f.style}
                      tabIndex={focusFips === c.fips ? 0 : -1}
                      role="button"
                      aria-pressed={selected === c.fips}
                      aria-label={`${c.name}: ${valueText(measure, r.v)}${cmp ? `. ${cmp}` : ""}`}
                      data-fips={c.fips}
                      onMouseEnter={() => setHovered(c.fips)}
                      onMouseLeave={() => setHovered(h => (h === c.fips ? null : h))}
                      onFocus={() => {
                        setHovered(c.fips);
                        setFocusFips(c.fips);
                      }}
                      onBlur={() => setHovered(h => (h === c.fips ? null : h))}
                      onClick={() => selectPlace(c.fips)}
                      onKeyDown={e => onCountyKey(e, c.fips)}
                    />
                  );
                })}
                {[selected, hovered].map((fips, i) => {
                  const c = fips && fips !== STATEWIDE_FIPS ? shapes.counties.find(s => s.fips === fips) : undefined;
                  return c ? (
                    <path key={`outline-${i}`} d={c.d} className={i === 0 ? styles.selectedOutline : styles.hoverOutline} aria-hidden="true" />
                  ) : null;
                })}
              </svg>
              {tip && tipShape ? (
                <div
                  className={styles.tooltip}
                  aria-hidden="true"
                  style={{
                    left: `${Math.min(80, Math.max(20, (tipShape.labelX / shapes.width) * 100))}%`,
                    top: `${(tipShape.labelY / shapes.height) * 100}%`,
                  }}
                >
                  <strong>{tip.place.name}</strong>
                  <span>{valueText(measure, tip.v)}</span>
                  {tip.v.status === "ok" ? (
                    <span className={styles.muted}>{compareWithStatewide(measure, tip.v.value, state.value)}</span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className={styles.legend} aria-label="Map key" role="group">
              <p className={styles.legendTitle}>{MEASURE_TEXT[measure].column}</p>
              <ul>
                {bins.labels.map((l, i) => {
                  const idx = bins.diverging ? i : i + (5 - bins.labels.length);
                  return (
                    <li key={l}>
                      <svg width="18" height="14" aria-hidden="true" className={styles.swatch}>
                        <rect width="18" height="14" className={bins.diverging ? styles[`div${idx}`] : styles[`seq${idx}`]} />
                      </svg>
                      {l}
                    </li>
                  );
                })}
                <li>
                  <svg width="18" height="14" aria-hidden="true" className={styles.swatch}>
                    <rect width="18" height="14" style={{ fill: `url(#${hatchId})` }} className={styles.hatched} />
                  </svg>
                  {measure === "comparison" ? "Too few people to show or compare" : "Too few people to show"}
                </li>
                <li>
                  <svg width="18" height="14" aria-hidden="true" className={styles.swatch}>
                    <rect width="18" height="14" className={styles.noData} />
                  </svg>
                  No figure in the source
                </li>
              </ul>
            </div>
          </div>

          {/* Ranked list */}
          <div
            role="tabpanel"
            id={`${uid}-panel-ranked`}
            aria-labelledby={`${uid}-tab-ranked`}
            hidden={tab !== "ranked"}
            className={styles.panel}
          >
            <p className={styles.hint}>
              Counties from highest to lowest. The line in each bar marks the statewide figure,{" "}
              {valueText(measure, state)}.
            </p>
            <ol className={styles.ranked}>
              {ranked.map(r => (
                <li key={r.place.fips}>
                  <button
                    type="button"
                    className={`${styles.rankButton} ${selected === r.place.fips ? styles.rankSelected : ""}`}
                    aria-pressed={selected === r.place.fips}
                    onClick={() => selectPlace(r.place.fips)}
                  >
                    <span className={styles.rankName}>{r.place.name}</span>
                    <span className={styles.rankValue}>{formatValue(measure, r.v.value)}</span>
                    <span className={styles.bar} aria-hidden="true">
                      <span
                        className={`${styles.barFill} ${fillFor(r.v).className}`}
                        style={{ width: `${((r.v.value as number) / maxValue) * 100}%` }}
                      />
                      {state.value != null ? (
                        <span className={styles.stateMark} style={{ left: `${(state.value / maxValue) * 100}%` }} />
                      ) : null}
                    </span>
                    <span className={styles.rankCompare}>{compareWithStatewide(measure, r.v.value, state.value)}</span>
                  </button>
                </li>
              ))}
            </ol>
            {unranked.length > 0 ? (
              <>
                <SubHeading className={styles.smallHeading}>No figure shown ({unranked.length} counties)</SubHeading>
                <ul className={styles.unranked}>
                  {unranked.map(r => (
                    <li key={r.place.fips}>
                      {r.place.name}: {statusText(r.v.status).toLowerCase()}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          {/* Table */}
          <div
            role="tabpanel"
            id={`${uid}-panel-table`}
            aria-labelledby={`${uid}-tab-table`}
            hidden={tab !== "table"}
            className={styles.panel}
          >
            <div className={styles.field}>
              <label htmlFor={`${uid}-filter`}>Filter counties by name</label>
              <input
                id={`${uid}-filter`}
                type="search"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                autoComplete="off"
              />
            </div>
            <p className={styles.hint} aria-live="polite">
              Showing {tableRows.length} of {rows.length} counties, plus Statewide.
            </p>
            <table className={styles.table}>
              <caption>
                {scopeText}, {measureMeta.date}. Select a column heading to sort.
              </caption>
              <thead>
                <tr>
                  {(
                    [
                      ["name", "County"],
                      ["value", MEASURE_TEXT[measure].column],
                      ["difference", "Compared with statewide"],
                      ...(showCount ? [["count", countHeader]] : []),
                      ["population", "Total population, 2025"],
                    ] as [SortKey, string][]
                  ).map(([k, text]) => (
                    <th key={k} scope="col" aria-sort={ariaSort(k)}>
                      <button type="button" className={styles.sortButton} onClick={() => toggleSort(k)}>
                        {text}
                        <span aria-hidden="true" className={styles.sortMark}>
                          {sort.key === k ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[{ place: statewidePlace(), v: state, diff: null } as Row, ...tableRows].map(r => {
                  const isState = r.place.fips === STATEWIDE_FIPS;
                  return (
                    <tr key={r.place.fips} className={isState ? styles.stateRow : undefined}>
                      <th scope="row" data-label="County">
                        <button type="button" className={styles.linkButton} onClick={() => selectPlace(r.place.fips)}>
                          {r.place.name}
                        </button>
                      </th>
                      <td data-label={MEASURE_TEXT[measure].column}>{valueText(measure, r.v)}</td>
                      <td data-label="Compared with statewide">
                        {isState ? "" : compareWithStatewide(measure, r.v.value, state.value)}
                      </td>
                      {showCount ? (
                        <td data-label={countHeader}>
                          {r.v.count != null
                            ? formatCount(r.v.count)
                            : r.v.status === "suppressed"
                              ? "Under 6"
                              : ""}
                        </td>
                      ) : null}
                      <td data-label="Total population, 2025">{formatCount(r.place.totalPopulation2025)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <Details
          place={selectedPlace}
          group={group}
          measure={measure}
          onClear={() => setSelected(STATEWIDE_FIPS)}
          SubHeading={SubHeading}
        />
      </div>

      <p className={styles.note}>{REQUIRED_NOTE}</p>
      <SourceList SubHeading={SubHeading} />
    </section>
  );
}

function Details({
  place,
  group,
  measure,
  onClear,
  SubHeading,
}: {
  place: Place;
  group: GroupId;
  measure: MeasureId;
  onClear: () => void;
  SubHeading: "h3" | "h4";
}) {
  const isState = place.fips === STATEWIDE_FIPS;
  const measures: MeasureId[] = ["population", "services", "comparison", "earned-income"];
  const services = measureFor(place, group, "services");
  const cmp = measureFor(place, group, "comparison");
  const share2018 = populationShare2018(place, group);
  return (
    <aside className={styles.details} aria-live="polite" aria-label="Details for the selected place">
      <SubHeading className={styles.detailsTitle}>{place.name}</SubHeading>
      <p className={styles.muted}>{groupLabel(group)}</p>
      <dl className={styles.facts}>
        {measures
          .filter(m => measureAppliesTo(group, m))
          .map(m => {
            const v = measureFor(place, group, m);
            const s = statewide(group, m);
            return (
              <div key={m} className={m === measure ? styles.currentFact : undefined}>
                <dt>{MEASURE_TEXT[m].short}</dt>
                <dd>
                  {valueText(m, v)}
                  {!isState && v.status === "ok" && s.value != null ? (
                    <span className={styles.muted}>
                      {" "}
                      ({compareWithStatewide(m, v.value, s.value).toLowerCase()}; statewide {formatValue(m, s.value)})
                    </span>
                  ) : null}
                  {m === "population" && share2018 != null && v.value != null ? (
                    <span className={styles.muted}> In 2018: {formatPercent(share2018)}.</span>
                  ) : null}
                </dd>
              </div>
            );
          })}
        {group !== "all" ? (
          <div>
            <dt>People counted for the comparison</dt>
            <dd>
              {services.count != null && services.countyCount != null
                ? `${formatCount(services.count)} of ${formatCount(services.countyCount)} people receiving services`
                : services.status === "suppressed"
                  ? "Under 6 people. Too few people to show."
                  : "No figure in the source."}
              {cmp.status === "too-few" ? ` Too few people to compare (fewer than ${MIN_COMPARE_COUNT}).` : ""}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Total population, 2025</dt>
          <dd>{formatCount(place.totalPopulation2025) || "No figure in the source"}</dd>
        </div>
        <div>
          <dt>Speak a language other than English at home</dt>
          <dd>{place.nonEnglishShare != null ? formatPercent(place.nonEnglishShare) : "No figure in the source"}</dd>
        </div>
      </dl>
      {!isState ? (() => {
        const agency = agencyForCounty(place.fips);
        return agency ? <p>
          <strong>County agency:</strong> <SourceLink href={`/community-outreach/county-agencies#county-${agency.fips}`}>{agency.agencyName}</SourceLink>
          {agency.phone ? <>, <SourceLink href={`tel:${agency.phone.replace(/[^0-9]/g, "")}`}>{agency.phone}</SourceLink></> : null}
          {" · "}<SourceLink href={`/community-outreach/providers?county=${encodeURIComponent(place.name)}`}>Providers and designated agencies</SourceLink>
        </p> : null;
      })() : null}
      {!isState ? (
        <button type="button" className={styles.clear} onClick={onClear}>
          Show statewide figures
        </button>
      ) : (
        <p className={styles.hint}>Select a county on the map, list or table to see its figures here.</p>
      )}
    </aside>
  );
}

function SourceList({ SubHeading }: { SubHeading: "h3" | "h4" }) {
  const data = getCountyData();
  const m = data.measures;
  const dates: [string, string][] = [
    ["Share of population", `${m.population.date} (also ${m.population.compareDate})`],
    ["People receiving home and community-based services", `${m.services.date}, all ages`],
    ["Earned income", `${m["earned-income"].date}, all ages, everyone receiving waiver services`],
    ["Total population", m.totalPopulation.date],
    ["Language spoken at home", "5-year survey estimates, labeled 2017 to 2021 in the file"],
  ];
  return (
    <div className={styles.sources}>
      <SubHeading className={styles.smallHeading}>Sources and dates</SubHeading>
      <ul>
        {dates.map(([k, v]) => (
          <li key={k}>
            {k}: {v}
          </li>
        ))}
      </ul>
      <ul>
        {data.sources.map(s => (
          <li key={s.id}>
            <SourceLink href={s.url}>{s.title}</SourceLink>. {s.publisher}. {s.date}.
          </li>
        ))}
      </ul>
      <p className={styles.muted}>
        People whose services are paid for by a multi-county human services agency or a Tribal Nation are counted in
        the statewide figures but not in any county.
      </p>
    </div>
  );
}
