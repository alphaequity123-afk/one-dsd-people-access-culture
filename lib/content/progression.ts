import decisions from "./resource-organization-data.json";
import tags from "./progression-level-tags.json";
import { progressionLevel, type ProgressionLevelId } from "@/lib/program/progression-levels";

/** Reviewed learning levels map onto the one personal path (levels 2 to 4). */
const FROM_REVIEWED: Record<string, ProgressionLevelId> = { foundation: "foundations", intermediate: "applying", advanced: "leading" };
const TAGGED = new Map<string, ProgressionLevelId>(
  (["oriented", "foundations", "applying", "leading"] as const).flatMap(level => tags[level].map(id => [id, level] as const)),
);

export function resourceProgressionLevel(id: string): ProgressionLevelId | null {
  const tagged = TAGGED.get(id);
  if (tagged) return tagged;
  const reviewed = (decisions as unknown as Record<string, { level?: string }>)[id]?.level;
  return reviewed ? FROM_REVIEWED[reviewed] ?? null : null;
}

/** The name shown on cards and pages, e.g. "Foundations". */
export function progressionLabel(id: ProgressionLevelId): string {
  return progressionLevel(id).title;
}
