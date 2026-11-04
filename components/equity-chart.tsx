import type { Baseline, Measure } from "@/lib/content/data/equity-baseline";
import { baseline, formatValue, UNIT_LABEL } from "@/lib/content/data/equity-baseline";
import styles from "@/app/data/equity-baseline/equity-baseline.module.css";

const WIDTH = 720, HEIGHT = 320, LEFT = 230, RIGHT = 70, TOP = 16, BOTTOM = 28;

function scale(measure: Measure, rows: Baseline[]) {
  const values = rows.flatMap(r => [r.value ?? 0, r.interval?.[1] ?? 0]);
  let max = Math.max(...values, measure.unit === "riskRatio" ? 1.25 : 0);
  if (measure.unit === "percent") max = Math.min(100, Math.max(max, 10));
  if (max <= 0) max = 1;
  max *= 1.08;
  return (v: number) => LEFT + ((WIDTH - LEFT - RIGHT) * Math.max(0, v)) / max;
}

function ariaLabel(measure: Measure, rows: Baseline[]) {
  const parts = rows.filter(r => r.value != null).map(r => `${r.label} ${formatValue(measure.unit, r.value)}`);
  const reference = measure.unit === "riskRatio" ? " A line marks 1.0, where there is no difference." : "";
  return `Bar chart: ${measure.program}, ${measure.unit === "dollars" ? "fiscal years 2022 and 2023 combined" : "fiscal years 2022 to 2024 pooled"}, by race and ethnicity. ${parts.join("; ")}.${reference}`;
}

/** One bar per race or ethnicity, pooled baseline value. Inline SVG, no dependencies. */
export function EquityBarChart({ measure }: { measure: Measure }) {
  const rows = baseline(measure).filter(r => r.value != null);
  const x = scale(measure, rows);
  const rowHeight = (HEIGHT - TOP - BOTTOM) / Math.max(1, rows.length);
  const barHeight = Math.min(26, rowHeight * 0.62);
  return <svg className={styles.chart} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={ariaLabel(measure, rows)}>
    <line x1={LEFT} y1={TOP} x2={LEFT} y2={HEIGHT - BOTTOM} className={styles.axis} />
    {measure.unit === "riskRatio" && <g>
      <line x1={x(1)} y1={TOP} x2={x(1)} y2={HEIGHT - BOTTOM} className={styles.parity} />
      <text x={x(1)} y={HEIGHT - 8} textAnchor="middle" className={styles.parityLabel}>1.0 = no difference</text>
    </g>}
    {rows.map((row, i) => {
      const y = TOP + i * rowHeight + (rowHeight - barHeight) / 2;
      const value = row.value as number;
      const isTotal = row.race === "all";
      return <g key={row.race}>
        <text x={LEFT - 10} y={y + barHeight / 2} dominantBaseline="middle" textAnchor="end" className={styles.barLabel}>{row.label}</text>
        <rect x={LEFT} y={y} width={Math.max(1, x(value) - LEFT)} height={barHeight} className={isTotal ? styles.barTotal : styles.bar} />
        {row.interval && <line x1={x(row.interval[0])} x2={x(row.interval[1])} y1={y + barHeight / 2} y2={y + barHeight / 2} className={styles.interval} />}
        <text x={x(value) + (row.interval ? Math.max(6, x(row.interval[1]) - x(value) + 6) : 6)} y={y + barHeight / 2} dominantBaseline="middle" className={styles.barValue}>{formatValue(measure.unit, value)}</text>
      </g>;
    })}
  </svg>;
}

/** The same numbers as a table. */
export function EquityNumbersTable({ measure }: { measure: Measure }) {
  const rows = baseline(measure);
  const hasInterval = rows.some(r => r.interval);
  const hasCount = rows.some(r => r.n != null);
  return <table className={styles.table}>
    <caption>{measure.program}: pooled value by race and ethnicity. {UNIT_LABEL[measure.unit]}.</caption>
    <thead><tr><th scope="col">Race or ethnicity</th><th scope="col">Value</th>{hasInterval && <th scope="col">95% confidence interval</th>}{hasCount && <th scope="col">People counted</th>}<th scope="col">Years</th></tr></thead>
    <tbody>{rows.map(r => <tr key={r.race}>
      <th scope="row">{r.label}</th>
      <td>{formatValue(measure.unit, r.value)}</td>
      {hasInterval && <td>{r.interval ? `${formatValue(measure.unit, r.interval[0])} to ${formatValue(measure.unit, r.interval[1])}` : "Not available"}</td>}
      {hasCount && <td>{r.n != null ? r.n.toLocaleString("en-US") : "Not available"}</td>}
      <td>{r.years.length ? r.years.map(y => `fiscal year ${y}`).join(", ") : "Not available"}</td>
    </tr>)}</tbody>
  </table>;
}
