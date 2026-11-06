import figures from "./community-figures.json";
import type { CommunityFigureGroup } from "./community-crosswalk";

// Plain-language wording for the statewide figures on community pages ("Numbers, with care").
// Shared by the page section and its downloadable copy so both say the same thing.

export type CommunityFigure = { status: string; estimate?: number | null; marginOfError?: number | null; universeCount?: number | null; percentOfMinnesota?: number | null; note?: string };
export type CommunityFigureMeasure = { key: string; label: string; table: string; page: number; universe: string; unit: string; note?: string };

export const COMMUNITY_FIGURES = figures;
export const FIGURE_MEASURES = (figures.measures as CommunityFigureMeasure[]).filter(m => m.key !== "households");
export const FIGURES_SOURCE = figures.sources.chartbook;
export const DISABILITY_BRIEF_SOURCE = figures.sources.disabilityBrief;
export const FIGURES_PER_100_NOTE = "“About N in 100” is worked out from the report's published counts; the report itself prints counts, not percentages.";

const number = (n: number) => n.toLocaleString("en-US");

export function figureValue(measure: CommunityFigureMeasure, figure: CommunityFigure | undefined): string {
  if (!figure || figure.status !== "published" || figure.estimate == null) {
    return figure?.status === "suppressed" ? "Not shown: too few survey responses" : "Not available";
  }
  const money = measure.unit === "dollars";
  const main = money ? `$${number(figure.estimate)}` : `${number(figure.estimate)} people`;
  const moe = figure.marginOfError != null ? ` (give or take ${money ? "$" : ""}${number(figure.marginOfError)})` : "";
  const share = figure.universeCount ? ` out of ${number(figure.universeCount)}, about ${Math.round((figure.estimate / figure.universeCount) * 100)} in 100` : "";
  const ofState = figure.percentOfMinnesota != null ? `, ${figure.percentOfMinnesota}% of Minnesotans` : "";
  return `${main}${moe}${share}${ofState}`;
}

type BriefValue = { group: string; status: string; estimate?: number | null };
const DISABILITY_BRIEF = figures.disabilityBrief as unknown as { groups: BriefValue[] };

/** When the chartbook hides a group's disability count, the February 2026 disability brief may print one. */
export function disabilityFromBrief(groupName: string): string | null {
  const row = DISABILITY_BRIEF.groups.find(item => item.group === groupName);
  if (!row || row.status !== "published" || row.estimate == null) return null;
  return `${number(row.estimate)} people, from the disability brief (${DISABILITY_BRIEF_SOURCE.date}). Few survey responses and no printed margin of error, so read with extra caution.`;
}

/** The figure shown for one measure of one group, exactly as the community page shows it. */
export function groupFigureText(group: CommunityFigureGroup, measure: CommunityFigureMeasure): string {
  const groupFigures = group.figures as Record<string, CommunityFigure>;
  const fromBrief = measure.key === "disabilityAges18to64" && groupFigures[measure.key]?.status !== "published" ? disabilityFromBrief(group.name) : null;
  return fromBrief ?? figureValue(measure, groupFigures[measure.key]);
}
