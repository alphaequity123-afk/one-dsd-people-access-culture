import { SUPERVISOR_MANAGER_COURSE_PACKS } from "./courses/authored/supervisor-manager";
import type { CoursePack } from "./courses/source-types";
import placement from "./supervisor-job-aids-placement.json";
import type { AskIntent, ContentItem } from "./types";

/**
 * Standalone job aids for the 19 supervisor and manager courses (ids ja-sm-*).
 *
 * The content comes from each course pack's jobAid, which the importer builds
 * from the Markdown source (scripts/content/import-supervisor-courses.mjs), so
 * the course page and the standalone resource never drift apart. The placement
 * (themes, level, tags) in supervisor-job-aids-placement.json is the owner's
 * organization decision for both the job aid and its course;
 * scripts/content/register-supervisor-job-aids.mjs writes it into the
 * organization JSON files that the library filters read.
 */
const OWNER = "Equity and Inclusion Operations Consultant";
const REVIEW = "2026-10-31";
const V = "1.0.0";
const PROVENANCE = "Built from the course's job aid in the supervisor and manager curriculum; the owner approved all 19 courses on October 31, 2026.";
const GENERIC_SUBTITLE = "A one-page reminder";

export type SupervisorCoursePlacement = {
  themes: string[];
  legacyThemes: string[];
  level: "foundation" | "intermediate" | "advanced";
  progression: "applying" | "leading";
  journeys: string[];
  intents: AskIntent[];
  tags: string[];
  basis: string;
};
export const SUPERVISOR_COURSE_PLACEMENT: Readonly<Record<string, SupervisorCoursePlacement>> = Object.fromEntries(
  Object.entries(placement as unknown as Record<string, SupervisorCoursePlacement | string>).filter((entry): entry is [string, SupervisorCoursePlacement] => typeof entry[1] !== "string"),
);

export const supervisorJobAidId = (courseId: string) => `ja-${courseId}`;
export const supervisorJobAidHref = (courseId: string) => `/resources/${supervisorJobAidId(courseId)}`;

/** The job aid's purpose is the resource's short answer. */
export function supervisorJobAidSummary(pack: CoursePack): string {
  return pack.jobAid.use?.purpose || pack.jobAid.subtitle;
}

/** One paragraph per section keeps the page and its downloads plain text, like the other job aids. */
function jobAidBody(pack: CoursePack): string[] {
  const { jobAid } = pack;
  const body: string[] = [];
  if (jobAid.use?.remember.length) body.push(`Remember. ${jobAid.use.remember.join(" ")}`);
  for (const section of jobAid.sections) body.push(`${section.heading.replace(/[.:]+$/, "")}. ${section.items.join(" ")}`);
  if (jobAid.use?.doNext) body.push(`Do next. ${jobAid.use.doNext}`);
  return body;
}

export function supervisorJobAid(pack: CoursePack): ContentItem {
  const { course, jobAid } = pack;
  const courseplacement = SUPERVISOR_COURSE_PLACEMENT[course.id];
  if (!courseplacement) throw new Error(`No placement for the job aid of ${course.id}`);
  const subtitle = jobAid.subtitle && jobAid.subtitle !== GENERIC_SUBTITLE ? jobAid.subtitle : undefined;
  return {
    id: supervisorJobAidId(course.id),
    title: jobAid.title,
    type: "job_aid",
    authority: "guidance",
    layer: "L2",
    summary: supervisorJobAidSummary(pack),
    ...(subtitle ? { whyItMatters: subtitle } : {}),
    body: jobAidBody(pack),
    nextActions: [
      { label: `Take the course: ${course.title}`, href: `/courses/${course.id}` },
      { label: "For supervisors and managers", href: "/leading" },
    ],
    tags: [...courseplacement.tags],
    intents: [...courseplacement.intents],
    owner: OWNER,
    reviewDate: REVIEW,
    status: "approved",
    scope: "agencywide",
    accessibility: "pending",
    provenance: PROVENANCE,
    version: V,
  };
}

export const SUPERVISOR_JOB_AIDS: ContentItem[] = SUPERVISOR_MANAGER_COURSE_PACKS.map(supervisorJobAid);
