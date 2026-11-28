import type { RiseCourse } from "./types";
import { equityVsEquality } from "./equity-vs-equality";

export type { RiseCourse, RiseLesson, RiseBlock, RiseSection } from "./types";
export { riseLessons } from "./types";

/** Courses rebuilt in the Rise structure. Each one replaces the earlier pages at the same address. */
const RISE_COURSES: RiseCourse[] = [equityVsEquality];

export function riseCourse(courseId: string): RiseCourse | undefined {
  return RISE_COURSES.find(course => course.id === courseId);
}
