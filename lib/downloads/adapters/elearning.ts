import "server-only";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { DownloadKind } from "../catalog";
import type { ResourceDocument } from "../model";

/** One downloadable eLearning item: the kind and id the download route takes. */
export type ElearningDownloadId = { kind: DownloadKind; id: string };

/**
 * Downloadable copies of courses, lessons and curricula. Returns null for anything not published.
 * Each family lives in its own module so a download loads only the content it needs.
 */
export async function elearningDocument(kind: DownloadKind, id: string, scope: StaffProgramScope): Promise<ResourceDocument | null> {
  switch (kind) {
    case "course":
    case "lesson":
      return (await import("./elearning-courses")).courseDownloadDocument(kind, id, scope);
    case "clas-curriculum":
    case "clas-lesson":
    case "toolkit-curriculum":
    case "toolkit-lesson":
    case "intercultural-curriculum":
    case "intercultural-lesson":
      return (await import("./elearning-curricula")).curriculumDownloadDocument(kind, id, scope);
    case "water-we-swim-in":
    case "leadership-styles":
    case "reading":
      return (await import("./elearning-pathways")).pathwayDownloadDocument(kind, id, scope);
    case "learn-page":
      return (await import("./elearning-learn-pages")).learnPageDownloadDocument(id, scope);
    default:
      return null;
  }
}

/** Every eLearning item that can be downloaded in this program view. Used by tests and checks. */
export async function elearningDownloadIds(scope: StaffProgramScope): Promise<ElearningDownloadId[]> {
  const [courses, curricula, pathways, learnPages] = await Promise.all([
    import("./elearning-courses").then((mod) => mod.courseDownloadIds(scope)),
    import("./elearning-curricula").then((mod) => mod.curriculumDownloadIds(scope)),
    import("./elearning-pathways").then((mod) => mod.pathwayDownloadIds(scope)),
    import("./elearning-learn-pages").then((mod) => mod.learnPageDownloadIds(scope)),
  ]);
  return [...courses, ...curricula, ...pathways, ...learnPages];
}
