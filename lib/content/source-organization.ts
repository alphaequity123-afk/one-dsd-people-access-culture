import decisions from "./source-organization-data.json";
import { RESOURCE_THEMES, resourceOrganizationDecision, resourceThemeIds, type ResourceThemeId } from "./resource-organization";
import type { Citation, RegisterSource } from "./source-register";

type SubjectDecision = { themes: string[]; basis: string };
const sourceOverrides: Readonly<Record<string, SubjectDecision>> = decisions.sourceOverrides;
const citationOverrides: Readonly<Record<string, SubjectDecision>> = decisions.citationOverrides;
const themeIds = new Set<string>(RESOURCE_THEMES.map(theme => theme.id));

function controlledThemes(values: readonly string[]): ResourceThemeId[] {
  const selected = new Set(values.filter((id): id is ResourceThemeId => themeIds.has(id)));
  return RESOURCE_THEMES.map(theme => theme.id).filter(id => selected.has(id));
}

/** Register IDs and catalog IDs use different prefixes for the same course. */
function catalogId(citation: Citation): string {
  if (citation.resourceType === "authored_course" || citation.resourceType === "recovered_course") return `course-${citation.resourceId}`;
  if (citation.resourceType === "practice_guide") return `practice-guide-${citation.resourceId}`;
  return citation.resourceId;
}

function citationDecision(citation: Citation) {
  const key = `${citation.resourceType}:${citation.resourceId}`;
  const explicit = citationOverrides[key];
  if (explicit) return { key, themes: controlledThemes(explicit.themes), basis: explicit.basis };
  const id = catalogId(citation);
  const resource = resourceOrganizationDecision(id);
  return {
    key,
    themes: resource ? resourceThemeIds({ id, type: "external_reference", tags: [] }) : [],
    basis: resource ? `Cited by ${citation.resourceTitle}. ${resource.basis}` : "No reviewed subject membership for this referring resource.",
  };
}

/**
 * Specific source decisions take precedence over citing-course membership:
 * a plain-language guide does not acquire every subject of every citing course.
 * Other sources retain the reviewed themes of the resources that use them.
 * Titles, domains and source bodies never trigger fuzzy classification.
 */
export function sourceOrganizationDecision(source: RegisterSource) {
  const explicit = sourceOverrides[source.sourceId];
  const references = source.citations.map(citationDecision);
  return {
    themes: explicit ? controlledThemes(explicit.themes) : controlledThemes(references.flatMap(reference => reference.themes)),
    basis: explicit?.basis ?? "Subject connections from the reviewed resources that cite this source.",
    method: explicit ? "reviewed_source" as const : "citing_resources" as const,
    references,
  };
}

export function sourceThemeIds(source: RegisterSource): ResourceThemeId[] {
  return sourceOrganizationDecision(source).themes;
}

export function matchesSourceTheme(source: RegisterSource, theme?: string | null): boolean {
  return !theme || sourceThemeIds(source).includes(theme as ResourceThemeId);
}

export function sourceOrganizationCoverage(sources: readonly RegisterSource[]) {
  const decisions = sources.map(source => ({ sourceId: source.sourceId, ...sourceOrganizationDecision(source) }));
  const uncategorizedIds = decisions.filter(decision => !decision.themes.length).map(decision => decision.sourceId);
  return {
    total: sources.length,
    categorized: sources.length - uncategorizedIds.length,
    uncategorizedIds,
    unclassifiedCitationKeys: [...new Set(decisions.flatMap(decision => decision.references.filter(reference => !reference.themes.length).map(reference => reference.key)))].sort(),
    themes: Object.fromEntries(RESOURCE_THEMES.map(theme => [theme.id, decisions.filter(decision => decision.themes.includes(theme.id)).length])),
  };
}
