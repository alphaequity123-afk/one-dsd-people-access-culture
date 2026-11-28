import { TOOLKIT_STEP_LESSONS, TOOLKIT_TOOL } from "@/lib/content/courses/rise/equity-analysis-toolkit";

/**
 * Connection map (owner-accepted 2026-11-27): when Ask is used from a page that is part of a connected pair,
 * Ask is told the other half, so its answer can point to the matching tool step or lesson.
 */
export type ScreenConnection = { label: string; href: string };

export function screenConnections(path: string): ScreenConnection[] {
  const clean = path.replace(/\/$/, "");
  const lesson = TOOLKIT_STEP_LESSONS.find(item => clean === item.href);
  if (lesson) return [{ label: `The "${lesson.step}" step in the DHS Equity Analysis Toolkit tool`, href: TOOLKIT_TOOL }];
  if (clean.startsWith("/courses/dhs-equity-analysis-toolkit")) return [{ label: "The DHS Equity Analysis Toolkit tool", href: TOOLKIT_TOOL }];
  if (clean === TOOLKIT_TOOL || clean === "/learn/equity-toolkit") return TOOLKIT_STEP_LESSONS.map(item => ({ label: `Lesson on ${item.step}`, href: item.href }));
  if (clean.startsWith("/courses/dc-s3-equity-vs-equality")) return [{ label: "The DHS Equity Analysis Toolkit tool", href: TOOLKIT_TOOL }];
  if (clean.startsWith("/minnesota-communities")) return TOOLKIT_STEP_LESSONS.filter(item => /results|Engaging/.test(item.step)).map(item => ({ label: `Lesson on ${item.step} (using community briefs)`, href: item.href }));
  return [];
}
