import { MAX_DATA_BYTES, MAX_RECORDS, suppressionReason, validateDataset, type Dataset } from './model';

export const CSV_HEADERS = ['id', 'program', 'goal', 'measure', 'group', 'period', 'periodOrder', 'numerator', 'denominator', 'source', 'sourceDate', 'practice', 'minimumGroupSize'];

function csvRows(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false, closed = false;
  const appendCell = () => { row.push(cell); cell = ''; closed = false; };
  const appendRow = () => {
    appendCell();
    if (row.some(value => value !== '')) rows.push(row);
    row = [];
    if (rows.length > MAX_RECORDS + 1) throw new Error(`Use at most ${MAX_RECORDS} observations in one file.`);
  };
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; }
      } else cell += char;
    } else if (char === '"') {
      if (cell !== '' || closed) throw new Error('A quoted field is not formed correctly. Save the table as CSV and try again.');
      quoted = true;
    } else if (char === ',') appendCell();
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i++;
      appendRow();
    } else {
      if (closed) throw new Error('Only a comma or a line break may follow a quoted field.');
      cell += char;
    }
    if (cell.length > 6000) throw new Error('One of the fields is too long. Shorten it before importing.');
    if (row.length > CSV_HEADERS.length) throw new Error('An observation has too many fields. Check the header and commas.');
  }
  if (quoted) throw new Error('A quoted field is unfinished. Save the table as CSV and try again.');
  if (cell !== '' || row.length || closed) appendRow();
  return rows;
}

function whole(value: string, label: string, nullable = false): number | null {
  const clean = value.trim();
  if (clean === '' && nullable) return null;
  if (!/^-?\d+$/.test(clean)) throw new Error(`${label} must be a whole number${nullable ? ', or blank when unknown' : ''}.`);
  const number = Number(clean);
  if (!Number.isSafeInteger(number)) throw new Error(`${label} is too large.`);
  return number;
}

export function parseCsv(text: string): Dataset {
  if (new TextEncoder().encode(text).length > MAX_DATA_BYTES) throw new Error('Choose a CSV file smaller than 2 MB.');
  const rows = csvRows(text);
  const headers = rows.shift();
  if (!headers || headers.length !== CSV_HEADERS.length || new Set(headers).size !== headers.length
    || CSV_HEADERS.some(header => !headers.includes(header))) {
    throw new Error(`Use these column names: ${CSV_HEADERS.join(', ')}.`);
  }
  let minimumGroupSize = 20;
  const records = rows.map((row, index) => {
    if (row.length !== headers.length) throw new Error(`Row ${index + 2} does not have one value for every column.`);
    const fields = Object.fromEntries(headers.map((header, column) => [header, row[column]]));
    const threshold = whole(fields.minimumGroupSize, `Row ${index + 2}: minimum group size`)!;
    if (index > 0 && threshold !== minimumGroupSize) throw new Error('Use the same minimum group size on every row.');
    minimumGroupSize = threshold;
    if (fields.practice !== 'true' && fields.practice !== 'false') throw new Error(`Row ${index + 2}: practice must be true or false.`);
    return {
      id: fields.id, program: fields.program, goal: fields.goal, measure: fields.measure, group: fields.group, period: fields.period,
      periodOrder: whole(fields.periodOrder, `Row ${index + 2}: period order`),
      numerator: whole(fields.numerator, `Row ${index + 2}: number meeting the measure`, true),
      denominator: whole(fields.denominator, `Row ${index + 2}: number included`, true),
      source: fields.source, sourceDate: fields.sourceDate, practice: fields.practice === 'true',
    };
  });
  return validateDataset({ schemaVersion: 1, title: 'Imported data', notes: '', minimumGroupSize, records });
}

/** Prefix spreadsheet formulas as literal text before quoting; exports do not execute submitted cells. */
function cell(value: string | number | boolean | null): string {
  if (value === null) return '';
  let text = String(value);
  if (typeof value === 'string' && /^[\s\uFEFF]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function datasetCsv(input: Dataset, shareable = true): string {
  const dataset = validateDataset(input);
  return `${CSV_HEADERS.join(',')}\r\n${dataset.records.map(record => {
    const hidden = shareable && suppressionReason(record, dataset.minimumGroupSize) !== null;
    const exported = { ...record, numerator: hidden ? null : record.numerator, denominator: hidden ? null : record.denominator, minimumGroupSize: dataset.minimumGroupSize };
    return CSV_HEADERS.map(header => cell(exported[header as keyof typeof exported])).join(',');
  }).join('\r\n')}${dataset.records.length ? '\r\n' : ''}`;
}
