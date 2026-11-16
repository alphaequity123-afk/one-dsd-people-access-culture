import decisions from "./resource-organization-data.json";
import type { ContentItem } from "./types";

/** Subject, purpose and learning level are independent choices. */
export const RESOURCE_THEMES = [
  { id: "identity", title: "Culture, identity and intercultural practice", description: "Explore identity, racial equity, cultural understanding and the assumptions people bring to their work." },
  { id: "access", title: "Accessibility, language and communication", description: "Make information, conversations and participation easier to access and use." },
  { id: "disability", title: "Disability rights and person-centered services", description: "Support choice, belonging and meaningful access through disability-informed practice." },
  { id: "policy", title: "Policy, programs and public decisions", description: "Examine policies, legislation, budgets, contracts and the decisions that shape services." },
  { id: "workforce", title: "Workplace culture and staff development", description: "Strengthen hiring, supervision, collaboration, opportunity and everyday work experience." },
  { id: "partnership", title: "Community partnership and shared influence", description: "Learn with communities, involve people in decisions and explain what their contributions changed." },
  { id: "leadership", title: "Leadership and organizational change", description: "Connect direction, responsibility and support with lasting improvements in practice." },
  { id: "evidence", title: "Evidence, learning and improvement", description: "Use evidence, reflection and evaluation to understand what changed and what to improve." },
] as const;

export type ResourceThemeId = (typeof RESOURCE_THEMES)[number]["id"];
export type ResourceLearningLevel = "foundation" | "intermediate" | "advanced";
export const RESOURCE_LEARNING_LEVELS = [
  { id: "foundation", title: "Foundation", description: "Build understanding and a useful starting vocabulary." },
  { id: "intermediate", title: "Intermediate", description: "Apply concepts to a situation, task or decision." },
  { id: "advanced", title: "Advanced", description: "Examine complex situations, competing considerations and sustained change." },
] as const;

/** Historical URLs retain their meanings, especially culture = workplace culture. */
export const RESOURCE_LEGACY_THEME_LABELS: Readonly<Record<string, string>> = {
  culture: "Workplace culture and well-being",
  intercultural: "Intercultural practice",
  structural: "Fair access and how systems work",
  facilitation: "Learning together",
};

type DiscoverableResource = Pick<ContentItem, "id" | "type" | "tags">;
type OrganizationDecision = {
  title: string;
  themes: string[];
  level: string | null;
  basis: string;
  levelBasis: string;
  legacyThemes: string[];
};
const reviewed: Readonly<Record<string, OrganizationDecision>> = decisions;
const themeIds = new Set<string>(RESOURCE_THEMES.map(theme => theme.id));
const levelIds = new Set<string>(RESOURCE_LEARNING_LEVELS.map(level => level.id));

// Future additions can carry explicit, controlled subject tags. Unknown subjects
// remain visible in the full collection and are reported for editorial review.
// Text inside a lesson never expands facet membership.
const EXACT_SUBJECT_TAGS: Readonly<Record<string, readonly ResourceThemeId[]>> = {
  identity: ["identity"], intercultural: ["identity"], "intercultural learning": ["identity"],
  "cultural humility": ["identity"], "racial equity": ["identity"], "implicit bias": ["identity"],
  access: ["access"], accessibility: ["access"], "language access": ["access"], "plain language": ["access"],
  disability: ["disability"], "disability rights": ["disability"], "person-centered": ["disability"],
  policy: ["policy"], legislation: ["policy"], "equity analysis": ["policy"], procurement: ["policy"],
  workforce: ["workforce"], hiring: ["workforce"], supervision: ["workforce"], "workplace culture": ["workforce"],
  partnership: ["partnership"], "community engagement": ["partnership"], "co-design": ["partnership"], "shared design": ["partnership"],
  leadership: ["leadership"], "organizational change": ["leadership"],
  evidence: ["evidence"], evaluation: ["evidence"], measurement: ["evidence"],
};

function controlledThemes(values: readonly string[]): ResourceThemeId[] {
  return [...new Set(values.filter((id): id is ResourceThemeId => themeIds.has(id)))];
}

/** Canonical IDs can have several relevant homes without creating copied content. */
export function resourceThemeIds(item: DiscoverableResource): ResourceThemeId[] {
  const decision = reviewed[item.id];
  if (decision) return controlledThemes(decision.themes);
  return controlledThemes(item.tags.flatMap<string>(tag => {
    const normalized = tag.trim().toLowerCase();
    if (normalized.startsWith("theme:")) return [normalized.slice(6)];
    return EXACT_SUBJECT_TAGS[normalized] ?? [];
  }));
}

/** Learning depth is never inferred from staff seniority or the L1–L4 use layers. */
export function resourceLearningLevel(item: DiscoverableResource): ResourceLearningLevel | null {
  if (item.type !== "learning_module" && item.type !== "scenario") return null;
  const decision = reviewed[item.id];
  if (decision) return decision.level && levelIds.has(decision.level) ? decision.level as ResourceLearningLevel : null;
  const explicit = new Set(item.tags.map(tag => tag.trim().toLowerCase().replace(/^level:/, "")).map(tag => tag === "foundations" ? "foundation" : tag).filter(tag => levelIds.has(tag)));
  return explicit.size === 1 ? [...explicit][0] as ResourceLearningLevel : null;
}

export function matchesResourceTheme(item: DiscoverableResource, theme?: string | null): boolean {
  if (!theme) return true;
  if (themeIds.has(theme)) return resourceThemeIds(item).includes(theme as ResourceThemeId);
  if (Object.hasOwn(RESOURCE_LEGACY_THEME_LABELS, theme)) return reviewed[item.id]?.legacyThemes.includes(theme) ?? false;
  return false;
}

export function matchesResourceLevel(item: DiscoverableResource, level?: string | null): boolean {
  if (!level) return true;
  const normalized = level.toLowerCase() === "foundations" ? "foundation" : level.toLowerCase();
  return levelIds.has(normalized) && resourceLearningLevel(item) === normalized;
}

/** Read-only evidence for classification review and gap reports. */
export function resourceOrganizationDecision(id: string): Readonly<OrganizationDecision> | undefined {
  return reviewed[id];
}

export function resourceOrganizationCoverage(items: readonly DiscoverableResource[]) {
  const uncategorizedIds = items.filter(item => resourceThemeIds(item).length === 0).map(item => item.id);
  const learningWithoutLevelIds = items.filter(item => (item.type === "learning_module" || item.type === "scenario") && resourceLearningLevel(item) === null).map(item => item.id);
  return { total: items.length, categorized: items.length - uncategorizedIds.length, uncategorizedIds, learningWithoutLevelIds };
}
