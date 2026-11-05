import data from "./sourcing.json";

// Potential sources for recruitment, outreach and engagement. Unlike the
// organization registry, these are places to reach people, not organizations
// with a recorded connection. A source shows a Department of Human Services
// record only when a public record exists.

export type SourcingUse = "Recruitment" | "Outreach" | "Engagement";

export type SourcingEntry = {
  name: string;
  alsoKnownAs?: string;
  kind: string;
  uses: SourcingUse[];
  communities: string[];
  region: string;
  what: string;
  howToUse: string;
  languages?: string[];
  website?: string;
  contact?: string;
  dhsRecord?: string;
  checked: string;
};

export type SourcingCategory = { category: string; title: string; intro: string; entries: SourcingEntry[] };

export const SOURCING_CHECKED: string = data.checked;
export const SOURCING_CATEGORIES: SourcingCategory[] = data.categories as unknown as SourcingCategory[];
export const SOURCING_USES: SourcingUse[] = ["Recruitment", "Outreach", "Engagement"];

export function sourcingEntries(): Array<SourcingEntry & { category: string; categoryTitle: string }> {
  return SOURCING_CATEGORIES.flatMap(c => c.entries.map(entry => ({ ...entry, category: c.category, categoryTitle: c.title })));
}
