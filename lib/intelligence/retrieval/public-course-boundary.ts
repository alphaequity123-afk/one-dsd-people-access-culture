import { isRetiredCulturalWorkshop, REFERRAL_ONLY_COURSE_IDS } from '@/lib/program/retired-features';

/** Match the public route's standing retirement/referral policy. Preserved
 * source files and old publications do not make a redirected course teachable. */
export function publicCourseSourceEligible(course: { id: string; title?: string; author?: string }): boolean {
  return !REFERRAL_ONLY_COURSE_IDS.has(course.id) && !isRetiredCulturalWorkshop(course);
}

export function publicRetrievalDocumentEligible(doc: { id: string; title: string; href: string }): boolean {
  if (isRetiredCulturalWorkshop(doc)) return false;
  const courseId = doc.href.match(/^\/(?:courses|share\/courses|library|resources)\/(?:course-)?([^/?#]+)(?:[/?#]|$)/)?.[1];
  return !courseId || publicCourseSourceEligible({ id: courseId, title: doc.title });
}
