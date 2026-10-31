export interface Observation {
  id: string;
  program: string;
  goal: string;
  measure: string;
  group: string;
  period: string;
  periodOrder: number;
  numerator: number | null;
  denominator: number | null;
  source: string;
  sourceDate: string;
  practice: boolean;
}

export interface Dataset {
  schemaVersion: 1;
  title: string;
  notes: string;
  minimumGroupSize: number;
  records: Observation[];
}

export const GOALS = [
  { id: '1', title: 'Eliminate disparities' },
  { id: '2', title: 'Community engagement' },
  { id: '3', title: 'Hiring and retention' },
  { id: '4', title: 'Learning and development' },
  { id: '5', title: 'Contracts and procurement' },
  { id: '6', title: 'Communication and accessibility' },
  { id: 'other', title: 'Other DHS work' },
] as const;

export const MAX_DATA_BYTES = 2 * 1024 * 1024;
export const MAX_RECORDS = 1500;
const MAX_COUNT = 1_000_000_000;
const RECORD_KEYS = ['id', 'program', 'goal', 'measure', 'group', 'period', 'periodOrder', 'numerator', 'denominator', 'source', 'sourceDate', 'practice'];

function object(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) {
    throw new Error(`${label} must contain named fields.`);
  }
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some(key => !keys.includes(key)) || keys.some(key => !Object.hasOwn(result, key))) {
    throw new Error(`${label} has missing or unexpected fields.`);
  }
  return result;
}

function text(value: unknown, label: string, max: number, required = true): string {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
    || (required && !value.trim())) {
    throw new Error(`${label} must be ${required ? 'nonempty ' : ''}text of at most ${max} characters.`);
  }
  return value;
}

function count(value: unknown, label: string, denominator = false): number | null {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < (denominator ? 1 : 0) || value > MAX_COUNT) {
    throw new Error(`${label} must be a whole number ${denominator ? 'greater than zero' : 'at least zero'}, or blank when unknown.`);
  }
  return value;
}

export function validSourceDate(value: string): boolean {
  if (value === '') return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function validateDataset(input: unknown): Dataset {
  const data = object(input, ['schemaVersion', 'title', 'notes', 'minimumGroupSize', 'records'], 'The working copy');
  if (data.schemaVersion !== 1) throw new Error('This working copy is not supported. Open an exported data-exploration working copy.');
  const title = text(data.title, 'The title', 200);
  const notes = text(data.notes, 'Notes', 6000, false);
  if (typeof data.minimumGroupSize !== 'number' || !Number.isSafeInteger(data.minimumGroupSize)
    || data.minimumGroupSize < 20 || data.minimumGroupSize > MAX_COUNT) {
    throw new Error('The minimum group size must be a whole number of at least 20.');
  }
  if (!Array.isArray(data.records) || data.records.length > MAX_RECORDS) {
    throw new Error(`Use at most ${MAX_RECORDS} observations in one working copy.`);
  }
  const ids = new Set<string>();
  const combinations = new Set<string>();
  const periodOrders = new Map<string, number>();
  const orderPeriods = new Map<string, string>();
  const seriesGoals = new Map<string, string>();
  const records = data.records.map((raw, index): Observation => {
    const label = `Observation ${index + 1}`;
    const entry = object(raw, RECORD_KEYS, label);
    const id = text(entry.id, `${label}: ID`, 120);
    if (ids.has(id)) throw new Error(`${label} repeats an ID. Give each observation its own ID.`);
    ids.add(id);
    const program = text(entry.program, `${label}: program`, 200);
    const goal = text(entry.goal, `${label}: goal`, 10);
    if (!GOALS.some(item => item.id === goal)) throw new Error(`${label}: choose a goal from 1 through 6, or other.`);
    const measure = text(entry.measure, `${label}: measure`, 300);
    const group = text(entry.group, `${label}: group`, 200);
    const seriesKey = JSON.stringify([program, measure, group]);
    if (seriesGoals.has(seriesKey) && seriesGoals.get(seriesKey) !== goal) {
      throw new Error(`${label}: keep the same goal for a group and measure across periods.`);
    }
    seriesGoals.set(seriesKey, goal);
    const period = text(entry.period, `${label}: period`, 120);
    if (typeof entry.periodOrder !== 'number' || !Number.isSafeInteger(entry.periodOrder) || Math.abs(entry.periodOrder) > 1_000_000) {
      throw new Error(`${label}: period order must be a whole number between -1000000 and 1000000.`);
    }
    const numerator = count(entry.numerator, `${label}: number meeting the measure`);
    const denominator = count(entry.denominator, `${label}: number included`, true);
    if (numerator !== null && denominator !== null && numerator > denominator) {
      throw new Error(`${label}: the number meeting the measure cannot exceed the number included.`);
    }
    const source = text(entry.source, `${label}: source`, 1000, false);
    const sourceDate = text(entry.sourceDate, `${label}: source date`, 10, false);
    if (!validSourceDate(sourceDate)) throw new Error(`${label}: use a real source date in YYYY-MM-DD form, or leave it blank.`);
    if (typeof entry.practice !== 'boolean') throw new Error(`${label}: practice must be true or false.`);
    const combination = JSON.stringify([program, measure, group, period]);
    if (combinations.has(combination)) throw new Error(`${label} repeats a group, measure and period. Combine duplicate entries before importing.`);
    combinations.add(combination);
    const periodKey = JSON.stringify([program, measure, period]);
    const orderKey = JSON.stringify([program, measure, entry.periodOrder]);
    if ((periodOrders.has(periodKey) && periodOrders.get(periodKey) !== entry.periodOrder)
      || (orderPeriods.has(orderKey) && orderPeriods.get(orderKey) !== period)) {
      throw new Error(`${label}: use one consistent order for each period within a measure.`);
    }
    periodOrders.set(periodKey, entry.periodOrder);
    orderPeriods.set(orderKey, period);
    return { id, program, goal, measure, group, period, periodOrder: entry.periodOrder, numerator, denominator, source, sourceDate, practice: entry.practice };
  });
  const result: Dataset = { schemaVersion: 1, title, notes, minimumGroupSize: data.minimumGroupSize, records };
  if (new TextEncoder().encode(JSON.stringify(result)).length > MAX_DATA_BYTES) {
    throw new Error('This working copy would exceed 2 MB. Use fewer observations or shorten the source notes.');
  }
  return result;
}

export function parseWorkingCopy(value: string): Dataset {
  if (new TextEncoder().encode(value).length > MAX_DATA_BYTES) throw new Error('Choose a working copy smaller than 2 MB.');
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { throw new Error('This file could not be read. Choose a downloaded working copy.'); }
  return validateDataset(parsed);
}

function knownCounts(record: Observation): boolean {
  return record.numerator !== null && record.denominator !== null
    && Number.isSafeInteger(record.numerator) && Number.isSafeInteger(record.denominator)
    && record.numerator >= 0 && record.denominator > 0 && record.numerator <= record.denominator
    && record.denominator <= MAX_COUNT;
}

export function suppressionReason(record: Observation, minimumGroupSize: number): string | null {
  if (!knownCounts(record)) return 'Not enough information';
  if (!Number.isSafeInteger(minimumGroupSize) || minimumGroupSize < 20) return 'Privacy setting needs review';
  const numerator = record.numerator!;
  const denominator = record.denominator!;
  if (denominator < minimumGroupSize) return 'Group too small to display';
  if ((numerator > 0 && numerator < 6) || (denominator - numerator > 0 && denominator - numerator < 6)) {
    return 'Small counts are hidden';
  }
  return null;
}

export function rate(record: Observation, minimumGroupSize: number): number | null {
  return suppressionReason(record, minimumGroupSize) === null ? record.numerator! / record.denominator! * 100 : null;
}

export function observations(dataset: Dataset, filters: { goal?: string; program?: string; measure?: string; period?: string } = {}): Observation[] {
  return dataset.records.filter(record => Object.entries(filters).every(([key, value]) => !value || record[key as keyof Observation] === value));
}

export function comparePeriods(current: Observation, earlier: Observation, minimumGroupSize: number): { current: number | null; earlier: number | null; change: number | null; message: string } {
  const currentRate = rate(current, minimumGroupSize);
  const earlierRate = rate(earlier, minimumGroupSize);
  if (current.program !== earlier.program || current.goal !== earlier.goal || current.measure !== earlier.measure
    || current.group !== earlier.group || current.practice !== earlier.practice || current.periodOrder <= earlier.periodOrder) {
    return { current: currentRate, earlier: earlierRate, change: null, message: 'Choose earlier and current observations for the same group and measure.' };
  }
  if (currentRate === null || earlierRate === null) {
    return { current: currentRate, earlier: earlierRate, change: null, message: 'A change cannot be calculated because information is missing or hidden.' };
  }
  if (!current.source.trim() || !earlier.source.trim() || current.source !== earlier.source) {
    return { current: currentRate, earlier: earlierRate, change: null, message: 'Confirm the sources and measure definitions are comparable before calculating a change.' };
  }
  const change = currentRate - earlierRate;
  return { current: currentRate, earlier: earlierRate, change, message: Math.abs(change) < 0.00000001 ? 'The recorded rates are the same.' : `The recorded rate is ${Math.abs(change).toFixed(1)} percentage points ${change > 0 ? 'higher' : 'lower'}.` };
}

export function emptyDataset(): Dataset {
  return { schemaVersion: 1, title: 'Explore your data', notes: '', minimumGroupSize: 20, records: [] };
}
