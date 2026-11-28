import guide from "./guide.json";

/** The leadership styles guide: sixteen styles in four groups, built from the owner's guide by scripts/leadership/build_styles_guide.py. */
export type StyleGroup = { id: string; title: string; description: string };
export type LabeledItem = { label: string; text: string };
export type ImpactPoint = { tone: "help" | "risk"; title: string; text: string[] };
export type LeadershipStyle = {
  slug: string;
  name: string;
  group: string;
  summary: string;
  staff: string;
  opener: string;
  related: string[];
  look: { paragraphs: string[]; behaviors_intro: string; behaviors: LabeledItem[] };
  swot: { helps: string[]; falls_short: string[]; on_purpose: string[]; at_risk: string[] };
  impact: { intro: string[]; points: ImpactPoint[]; what_to_do_intro: string; what_to_do: LabeledItem[] };
};

export const styleGroups = guide.groups as StyleGroup[];
export const leadershipStyles = guide.styles as LeadershipStyle[];

export function getStyle(slug: string) {
  return leadershipStyles.find(style => style.slug === slug);
}

export function stylesInGroup(groupId: string) {
  return leadershipStyles.filter(style => style.group === groupId);
}

export function styleHref(slug: string) {
  return `/learn/leadership/styles/${slug}`;
}

/** The short practice scenario for the same style in the leadership readings (read/style_*). */
export function styleScenarioId(slug: string) {
  return `style_${slug.replace(/-/g, "_")}`;
}

export function styleForScenario(id: string) {
  return leadershipStyles.find(style => styleScenarioId(style.slug) === id);
}

/** The whole guide as Word and PDF, one copy per application. */
export function guideDownloads(unitId: "dhs" | "dsd") {
  const base = `/downloads/leadership/${unitId === "dsd" ? "one-dsd" : "one-dhs"}-leadership-styles-guide`;
  return { docx: `${base}.docx`, pdf: `${base}.pdf` };
}
