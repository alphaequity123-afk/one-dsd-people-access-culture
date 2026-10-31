import { GOALS, rate, suppressionReason, validateDataset, type Dataset, type Observation } from './model';

const LIMITS = 'Rates describe the recorded observations. They do not establish a cause, statistical significance, policy compliance, or a prediction. Check the measure definition, who is included, source quality and missing perspectives before making a recommendation. Groups are not combined into a total because they may overlap. Hidden figures stay hidden in this report; combining it with other information may still reveal a small group.';
const PRIVACY = 'The minimum group size is a review setting for this working copy, not a claim about an official DHS reporting rule. Counts of 1 through 5, including the remaining count, are also hidden.';

function escape(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function selected(input: Dataset, rows: Observation[]): { dataset: Dataset; rows: Observation[] } {
  const dataset = validateDataset(input);
  const map = new Map(dataset.records.map(record => [record.id, record]));
  const ids = new Set<string>();
  return { dataset, rows: rows.map(row => {
    const record = map.get(row.id);
    if (!record || ids.has(row.id) || Object.keys(record).some(key => row[key as keyof Observation] !== record[key as keyof Observation])) {
      throw new Error('The selected observations changed. Refresh the selection before exporting.');
    }
    ids.add(row.id);
    return record;
  }) };
}

export function reportHtml(input: Dataset, selectedRows: Observation[]): string {
  const { dataset, rows } = selected(input, selectedRows);
  const tableRows = rows.map(record => {
    const hidden = suppressionReason(record, dataset.minimumGroupSize);
    const values = [record.program, GOALS.find(goal => goal.id === record.goal)!.title, record.measure, record.group, record.period,
      hidden ?? `${rate(record, dataset.minimumGroupSize)!.toFixed(1)}%`,
      hidden ? 'Hidden or unknown' : String(record.numerator), hidden ? 'Hidden or unknown' : String(record.denominator),
      record.source.trim() || 'Source not entered', record.sourceDate || '—', record.practice ? 'Practice' : 'Supplied data; source review required'];
    return `<tr>${values.map(value => `<td>${escape(value)}</td>`).join('')}</tr>`;
  }).join('');
  const headings = ['Program', 'Goal', 'Measure', 'Group', 'Period', 'Rate', 'Number meeting the measure', 'Number included', 'Source', 'Source date', 'Data context'];
  const bars = rows.map(record => {
    const value = rate(record, dataset.minimumGroupSize);
    return `<li><strong>${escape(record.program)}: ${escape(record.measure)}</strong><br>${escape(record.group)} — ${escape(record.period)}<br>${value === null ? escape(suppressionReason(record, dataset.minimumGroupSize)!) : `<div class="track" aria-hidden="true"><div class="bar" style="width:${value.toFixed(4)}%"></div></div><span>${value.toFixed(1)}%</span>`}</li>`;
  }).join('');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escape(dataset.title)}</title><style>body{font-family:Arial,sans-serif;color:#172b3d;margin:2rem;line-height:1.6}h1,h2{color:#003865}table{border-collapse:collapse;width:100%;font-size:.9rem}th,td{padding:.6rem;border:1px solid #778797;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#edf0f3}p{max-width:90ch}.scroll{overflow-x:auto}.context{padding:1rem;background:#f3f1ec}.chart{list-style:none;padding:0;max-width:70rem}.chart li{padding:.8rem 0;break-inside:avoid}.track{background:#edf0f3;height:1rem;max-width:38rem}.bar{background:#003865;height:100%}@media print{body{margin:.5in}thead{display:table-header-group}tr{break-inside:avoid}}</style></head><body><p>One DSD People, Access and Culture</p><h1>${escape(dataset.title)}</h1>${dataset.notes ? `<p>${escape(dataset.notes).replaceAll('\n', '<br>')}</p>` : ''}<div class="context"><p>${escape(LIMITS)}</p><p>${escape(PRIVACY)} Minimum group size: ${dataset.minimumGroupSize}.</p>${rows.some(row => row.practice) ? '<p>Practice figures are included and do not describe DHS performance.</p>' : ''}</div><h2>Rates at a glance</h2><ul class="chart">${bars}</ul><h2>Selected observations</h2>${rows.length ? `<div class="scroll"><table><caption>Each group is reported separately. No pooled totals are shown.</caption><thead><tr>${headings.map(heading => `<th scope="col">${heading}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table></div>` : '<p>No observations were selected.</p>'}</body></html>`;
}

export function reportText(input: Dataset, selectedRows: Observation[]): string {
  const { dataset, rows } = selected(input, selectedRows);
  return ['One DSD People, Access and Culture', dataset.title, dataset.notes, LIMITS, PRIVACY,
    `Minimum group size: ${dataset.minimumGroupSize}.`, '', ...rows.flatMap(record => {
      const hidden = suppressionReason(record, dataset.minimumGroupSize);
      return [
        `${record.program} — ${record.measure}`, `${record.group}; ${record.period}`,
        `Goal: ${GOALS.find(goal => goal.id === record.goal)!.title}`,
        `Rate: ${hidden ?? `${rate(record, dataset.minimumGroupSize)!.toFixed(1)}%`}`,
        `Number meeting the measure: ${hidden ? 'Hidden or unknown' : record.numerator}`,
        `Number included: ${hidden ? 'Hidden or unknown' : record.denominator}`,
        `Source: ${record.source.trim() || 'Source not entered'}`, `Source date: ${record.sourceDate || '—'}`,
        record.practice ? 'Practice; not DHS performance.' : 'Supplied data; source review required.', '',
      ];
    })].filter(value => value !== undefined).join('\n');
}
