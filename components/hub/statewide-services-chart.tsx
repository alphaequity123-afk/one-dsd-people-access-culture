import { GROUP_IDS, groupLabel, statewidePlace, formatPercent, getCountyData } from "@/lib/content/hub/county-data";

/**
 * Statewide: each group's share of Minnesota's population beside its share of the people receiving home and
 * community-based services. Public Department of Human Services figures (county-data.json). Two series, one axis
 * (percent), a legend, a value at each bar end, a hover title on each bar and a table for screen readers and print.
 * Colors were checked for color-vision separation and contrast (population #2563eb, services #15803d).
 */
const POP = "#2563eb", SVC = "#15803d";

export function StatewideServicesChart() {
  const data = getCountyData();
  const state = statewidePlace();
  const rows = GROUP_IDS.filter(id => id !== "all").map(id => {
    const g = state.groups[id];
    return { id, label: groupLabel(id), population: g?.population?.share2022 ?? null, services: g?.services?.status === "reported" ? g.services.share ?? null : null };
  });
  const max = Math.max(...rows.flatMap(r => [r.population ?? 0, r.services ?? 0]));
  const scaleMax = Math.ceil(max * 10) / 10; // round up to the next 10%
  const labelW = 230, plotW = 470, barH = 14, gap = 3, rowH = barH * 2 + gap + 20, top = 8;
  const width = labelW + plotW + 60, height = top + rows.length * rowH + 28;
  const x = (v: number) => labelW + (v / scaleMax) * plotW;
  const ticks = Array.from({ length: Math.round(scaleMax * 10) + 1 }, (_, i) => i / 10).filter((_, i, a) => a.length <= 6 || i % 2 === 0);
  const pop = data.measures.population, svc = data.measures.services;
  return <figure className="statewide-chart" aria-labelledby="statewide-chart-title">
    <h2 id="statewide-chart-title">Who lives in Minnesota, and who receives home and community-based services</h2>
    <p className="statewide-chart-note">Statewide. Population share, {pop.date}; services share, {svc.date}, all ages. A difference is a question to look into, not an explanation.</p>
    <ul className="statewide-chart-legend" aria-hidden="true">
      <li><span style={{ background: POP }} />Share of Minnesota population</li>
      <li><span style={{ background: SVC }} />Share of people receiving services</li>
    </ul>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Paired bars by race and ethnicity; the same figures are in the table below." className="statewide-chart-svg">
      {ticks.map(t => <g key={t}>
        <line x1={x(t)} x2={x(t)} y1={top - 4} y2={height - 22} stroke="#e2e8f0" strokeWidth={1} />
        <text x={x(t)} y={height - 6} textAnchor="middle" fontSize={12} fill="#475569">{Math.round(t * 100)}%</text>
      </g>)}
      {rows.map((r, i) => {
        const y = top + i * rowH;
        const bar = (v: number | null, dy: number, color: string, name: string) => v === null ? null : <g>
          <rect x={labelW} y={y + dy} width={Math.max(2, x(v) - labelW)} height={barH} rx={4} fill={color}><title>{`${r.label}: ${name} ${formatPercent(v)}`}</title></rect>
          <text x={x(v) + 6} y={y + dy + barH - 2} fontSize={12.5} fill="#183247" fontWeight={600}>{formatPercent(v)}</text>
        </g>;
        return <g key={r.id}>
          <text x={labelW - 12} y={y + barH + 3} textAnchor="end" fontSize={13.5} fill="#183247">{r.label}</text>
          {bar(r.population, 0, POP, "share of population")}
          {bar(r.services, barH + gap, SVC, "share of people receiving services")}
        </g>;
      })}
    </svg>
    <details className="statewide-chart-table">
      <summary>Show the figures as a table</summary>
      <table>
        <thead><tr><th scope="col">Race or ethnicity</th><th scope="col">Share of population</th><th scope="col">Share of people receiving services</th></tr></thead>
        <tbody>{rows.map(r => <tr key={r.id}><th scope="row">{r.label}</th><td>{formatPercent(r.population)}</td><td>{formatPercent(r.services)}</td></tr>)}</tbody>
      </table>
      <p>People whose race is not recorded count in the services total but in no group, so the service shares add to less than 100%.</p>
    </details>
    <style>{`
      .statewide-chart { margin: 1.5rem 0 2rem; padding: 1.25rem 1.5rem; background: #fff; border: 1px solid #cbd5e1; border-top: 4px solid var(--page-accent, ${SVC}); border-radius: 10px; }
      .statewide-chart h2 { margin: 0 0 .35rem; font-size: 1.25rem; color: #183247; }
      .statewide-chart-note { margin: 0 0 .75rem; color: #475569; font-size: .95rem; max-width: 70ch; }
      .statewide-chart-legend { list-style: none; display: flex; flex-wrap: wrap; gap: .4rem 1.5rem; margin: 0 0 .5rem; padding: 0; font-size: .92rem; color: #183247; }
      .statewide-chart-legend span { display: inline-block; width: 14px; height: 14px; border-radius: 3px; margin-right: .45rem; vertical-align: -2px; }
      .statewide-chart-svg { width: 100%; height: auto; max-width: 820px; display: block; }
      .statewide-chart-table summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; font-weight: 600; color: #183247; }
      .statewide-chart-table table { border-collapse: collapse; margin: .5rem 0; font-size: .95rem; }
      .statewide-chart-table :is(th, td) { padding: .4rem .9rem .4rem 0; border-bottom: 1px solid #e2e8f0; text-align: left; }
      .statewide-chart-table td { font-variant-numeric: tabular-nums; }
      @media (forced-colors: active) { .statewide-chart-svg rect { fill: CanvasText; } }
    `}</style>
  </figure>;
}
