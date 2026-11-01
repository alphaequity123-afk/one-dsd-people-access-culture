import { RESOURCE_THEMES, resourceThemeIds, type ResourceThemeId } from "./resource-organization";
import type { ContentItem } from "./types";

/** Each card points to an existing destination; it does not copy its content. */
export type ThemeContextLink = { title: string; href: string; description: string; gate?: "communities" | "programs" | "cultural" };
export const THEME_CONTEXT_LINKS: Readonly<Record<ResourceThemeId, readonly ThemeContextLink[]>> = {
  identity: [
    { title: "Cultural intelligence in everyday work", href: "/learn/cultural-intelligence", description: "Connect perspectives, power and practical questions.", gate: "cultural" },
    { title: "Minnesota communities", href: "/minnesota-communities", description: "Explore community context without assuming what is true of an individual.", gate: "communities" },
  ],
  access: [{ title: "Plan cultural and language access", href: "/practice/clas", description: "Consider communication, participation and the responsibilities that apply." }],
  disability: [{ title: "DSD programs and services", href: "/one-dsd/programs", description: "Connect disability-informed practice with service context.", gate: "programs" }],
  policy: [{ title: "DSD programs and services", href: "/one-dsd/programs", description: "Explore service questions and links to official guidance.", gate: "programs" }],
  workforce: [{ title: "Leadership and the employee life cycle", href: "/one-dsd/leadership#life-cycle", description: "Consider role design, opportunity, development and retention." }],
  partnership: [{ title: "Minnesota communities", href: "/minnesota-communities", description: "Learn about context and prepare questions for people affected.", gate: "communities" }],
  leadership: [{ title: "Leadership in everyday work", href: "/leading", description: "Find starting points for leaders, supervisors, managers, directors and people exploring leadership." }],
  evidence: [{ title: "How the program works", href: "/program/model", description: "Connect evidence, practice, progress and impact." }],
};

export const findTheme = (id: string) => RESOURCE_THEMES.find(theme => theme.id === id);

/** Show only approved, classified catalog entries and keep one copy per ID. */
export function featuredThemeItems(items: readonly ContentItem[], theme: ResourceThemeId, limit = 3) {
  const unique = new Map<string, ContentItem>();
  for (const item of items) {
    if (item.status === "approved" && resourceThemeIds(item).includes(theme)) unique.set(item.id, item);
  }
  const entries = [...unique.values()];
  return {
    learning: entries.filter(item => item.type === "learning_module" || item.type === "scenario").slice(0, limit),
    practical: entries.filter(item => item.type !== "learning_module" && item.type !== "scenario").slice(0, limit),
  };
}
