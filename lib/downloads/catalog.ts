import type { AnyDownloadFormat } from "./model";

/**
 * Resource kinds anyone can download. Owner decision, November 6, 2026: every resource and every
 * eLearning (courses, lessons, curricula) is downloadable and shareable as Word, Excel, PowerPoint and PDF.
 */
export const DOWNLOAD_KINDS = [
  "library",
  "scenario",
  "program",
  "amplify",
  "team",
  "leadership",
  "brief",
  "path",
  "area",
  "equity-toolkit",
  "community-connections",
  "learning-journey",
  "measurement",
  "sources",
  "equity-framework",
  "operationalizing-equity",
  "understanding-dhs",
  "support-directory",
  "toolkit-studio",
  // eLearning (lib/downloads/adapters/elearning.ts)
  "course",
  "lesson",
  "clas-curriculum",
  "clas-lesson",
  "toolkit-curriculum",
  "toolkit-lesson",
  "intercultural-curriculum",
  "intercultural-lesson",
  "water-we-swim-in",
  "leadership-styles",
  "reading",
  "learn-page",
  // Community Outreach and Engagement and related public pages (lib/downloads/adapters/hub.ts)
  "organization",
  "policy",
  "community-outreach",
  "community",
  "equity-review",
] as const;

/** Kinds served by the eLearning adapter. */
export const ELEARNING_KINDS = new Set<string>(["course", "lesson", "clas-curriculum", "clas-lesson", "toolkit-curriculum", "toolkit-lesson", "intercultural-curriculum", "intercultural-lesson", "water-we-swim-in", "leadership-styles", "reading", "learn-page"]);
/** Kinds served by the Community Outreach adapter. */
export const HUB_KINDS = new Set<string>(["organization", "policy", "community-outreach", "community", "equity-review"]);
export type DownloadKind = (typeof DOWNLOAD_KINDS)[number];

export function isDownloadKind(value: string): value is DownloadKind {
  return (DOWNLOAD_KINDS as readonly string[]).includes(value);
}

export type DownloadScope = "one-dhs" | "dsd";

export function downloadHref(kind: DownloadKind, id: string, format: AnyDownloadFormat, scope?: DownloadScope): string {
  const query = new URLSearchParams({ format });
  if (scope) query.set("view", scope === "dsd" ? "one_dsd" : "one_dhs");
  return `/api/downloads/${kind}/${encodeURIComponent(id)}?${query.toString()}`;
}
