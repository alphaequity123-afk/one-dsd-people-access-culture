import type { CoursePack } from './source-types';
import type { EditableSurfaceValues } from '../editable-surface-contract';
import reviewedData from './historical-course-editorial.json';

type Change = { path: (string | number)[]; before: unknown; after: unknown };
type Decision = { courseId: string; changes: Change[]; retiredAudio: string };
const decisions = new Map((reviewedData.courses as Decision[]).map(row => [row.courseId, row]));
export function historicalIntroductionLink(courseId: string): { href: string; label: string } | undefined {
  return (reviewedData.reuseLinks as Record<string, { href: string; label: string }>)[courseId];
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([key, item]) => JSON.stringify(key) + ':' + stable(item)).join(',') + '}';
  return JSON.stringify(value) ?? 'undefined';
}
function at(value: unknown, path: (string | number)[]): unknown {
  return path.reduce<unknown>((node, key) => node && typeof node === 'object' ? (node as Record<string | number, unknown>)[key] : undefined, value);
}
function assign(value: unknown, path: (string | number)[], after: unknown): void {
  const parent = at(value, path.slice(0, -1));
  if (!parent || typeof parent !== 'object' || !path.length) throw new Error('Invalid reviewed course path');
  (parent as Record<string | number, unknown>)[path[path.length - 1]] = structuredClone(after);
}

/** Exact-value presentation overlay. Archived courses and owner publications are never mutated. */
export function inspectHistoricalCourseEditorial(pack: CoursePack): { pack: CoursePack; applied: boolean; conflicts: string[] } {
  const decision = decisions.get(pack.course.id);
  if (!decision) return { pack, applied: false, conflicts: [] };
  const conflicts = decision.changes.filter(change => {
    const current = stable(at(pack, change.path));
    return current !== stable(change.before) && current !== stable(change.after);
  }).map(change => change.path.join('.'));
  // Never replace a later owner revision with a whole older course pack.
  // Known rejected audio is retired independently; all other recordings stay intact.
  const copy = structuredClone(pack);
  if (copy.course.introAudio === decision.retiredAudio) copy.course.introAudio = '';
  if (conflicts.length) return { pack: copy, applied: false, conflicts };
  for (const change of decision.changes) assign(copy, change.path, change.after);
  return { pack: copy, applied: true, conflicts: [] };
}

export function withHistoricalCourseEditorial(pack: CoursePack): CoursePack {
  return inspectHistoricalCourseEditorial(pack).pack;
}

export function withReviewedHistoricalSurface(surfaceId: string, values: EditableSurfaceValues): EditableSurfaceValues {
  if (surfaceId.startsWith('course.') && values.pack && typeof values.pack === 'object') {
    return { ...values, pack: withHistoricalCourseEditorial(values.pack as unknown as CoursePack) };
  }
  if (surfaceId !== 'equity-toolkit.home') return values;
  const copy = { ...values };
  for (const field of reviewedData.toolkitFields) {
    if (copy[field.key] === field.before) copy[field.key] = field.after;
  }
  return copy;
}
