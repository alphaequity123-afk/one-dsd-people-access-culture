import "server-only";
import { publishedCourses } from "@/lib/content/courses/published";
import { loadStaffContentSnapshot, type StaffProgramScope } from "@/lib/content/staff-publications";
import selfDirected from "@/lib/content/self-directed-data.json";

/** Anything that teaches or cites the National Culturally and Linguistically Appropriate Services Standards. */
export const clasMatch = (value: unknown) => /\bCLAS\b|culturally and linguistically appropriate/i.test(JSON.stringify(value));

/** The CLAS collection page's courses, references and self-directed courses, for the page and its search. */
export async function clasCollection(scope: StaffProgramScope) {
  const [published, snapshot] = await Promise.all([publishedCourses(scope), loadStaffContentSnapshot({ scope })]);
  const courses = published.map(row => row.pack).filter(clasMatch);
  const teaching = courses.filter(p => clasMatch(p.course) || clasMatch(p.jobAid));
  const references = courses.filter(p => !teaching.includes(p));
  const resources = snapshot.items.filter(r => r.status === "approved").filter(clasMatch);
  const directed = selfDirected.filter(clasMatch);
  return { courses, teaching, references, resources, directed };
}

export type ClasCollection = Awaited<ReturnType<typeof clasCollection>>;

/** Stable keys for the items a search can show or hide. */
export const clasKey = {
  course: (id: string) => `course:${id}`,
  resource: (id: string) => `resource:${id}`,
  directed: (number: number | string) => `directed:${number}`,
};

/** The items whose full text contains the words, exactly as the page has always matched them. */
export function clasMatches(collection: ClasCollection, q: string): string[] {
  const text = q.trim().toLowerCase();
  const includes = (value: unknown) => !text || JSON.stringify(value).toLowerCase().includes(text);
  return [
    ...collection.courses.filter(includes).map(p => clasKey.course(p.course.id)),
    ...collection.resources.filter(includes).map(r => clasKey.resource(r.id)),
    ...collection.directed.filter(includes).map(c => clasKey.directed(c.number)),
  ];
}
