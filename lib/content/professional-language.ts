import surfaceData from "./professional-language-revisions.json";
import courseData from "./course-language-revisions.json";
import partialCourseData from "./course-partial-language-revisions.json";

export type LanguageChange = { path: (string | number)[]; before: string; after: string; beforeVariants?: string[] };
export type LanguageRevision = { target: string; kind: string; changes: LanguageChange[]; status: string };
type CourseRevision = { courseId: string; changes: LanguageChange[]; status: string };
const revisions: LanguageRevision[] = [
  ...surfaceData.revisions as LanguageRevision[],
  ...(courseData.courses as CourseRevision[]).map(row => ({ target: `course.${row.courseId}`, kind: "surface", status: row.status,
    changes: row.changes.map(change => ({ ...change, path: ["pack", ...change.path] })) })),
];
// Partial course corrections are kept separate from full-pack editorial acceptance.
for (const row of partialCourseData.courses) {
  if (revisions.some(revision => revision.target === `course.${row.courseId}`)) throw new Error(`Duplicate full/partial course revision: ${row.courseId}`);
  revisions.push({ target: `course.${row.courseId}`, kind: "surface", status: row.review.status === "accepted" ? "reviewed" : "draft",
    changes: row.changes.map(change => ({ ...change, path: ["pack", ...change.path] })) });
}
const approved = new Map(revisions.filter(row => row.status === "reviewed").map(row => [row.target, row]));
const at = (value: unknown, path: (string | number)[]): unknown => path.reduce<unknown>((node, key) => node && typeof node === "object" ? (node as Record<string | number, unknown>)[key] : undefined, value);

/** Exact-value revisions change presentation, never stored originals or later owner wording. */
export function inspectLanguageRevision<T>(target: string, value: T, revision = approved.get(target)): { value: T; applied: boolean; conflicts: string[] } {
  if (!revision || revision.status !== "reviewed") return { value, applied: false, conflicts: [] };
  const conflicts = revision.changes.filter(change => {
    const current = at(value, change.path);
    return current !== change.before && current !== change.after && !change.beforeVariants?.includes(current as string);
  }).map(change => change.path.join("."));
  if (conflicts.length) return { value, applied: false, conflicts };
  const copy = structuredClone(value);
  for (const change of revision.changes) {
    const parent = at(copy, change.path.slice(0, -1));
    if (!parent || typeof parent !== "object" || !change.path.length) throw new Error(`Invalid language revision for ${target}`);
    (parent as Record<string | number, unknown>)[change.path[change.path.length - 1]] = change.after;
  }
  return { value: copy, applied: true, conflicts: [] };
}

export function withProfessionalLanguage<T>(target: string, value: T): T {
  return inspectLanguageRevision(target, value).value;
}
