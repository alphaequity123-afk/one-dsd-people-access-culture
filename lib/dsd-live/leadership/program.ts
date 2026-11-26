import source from "@/data/dsd-live/leadership/source.json";
import { dsdLeadershipReading } from "../dsd-practice/leadership-readings";

export type LeadershipSpan = {
  text: string;
  href?: string;
  bold?: boolean;
  italic?: boolean;
  field?: string;
};

export type LeadershipBlock = {
  style: string;
  spans: LeadershipSpan[];
};

export type LeadershipPage = {
  id: string;
  title: string;
  type: string;
  competencyId?: string;
  number?: number;
  contentsTitle?: string;
  related?: {
    capability: string;
    resources: string[];
    styleId: string;
    crosswalkId: string;
  };
  blocks: LeadershipBlock[];
};

export const leadershipPages: LeadershipPage[] = source.pages;
export const competencies = source.competencies;
export type LeadershipCompetency = (typeof competencies)[number];

const byId = new Map(leadershipPages.map(page => [page.id, page]));

export function getLeadershipPage(id: string): LeadershipPage | undefined {
  return byId.get(id);
}

export function pageHref(id: string) {
  return `/learn/leadership/read/${encodeURIComponent(id)}`;
}

/** Titles for printed continuations need enough context to stand alone as web links. */
export function readingTitle(page: LeadershipPage): string {
  const revised = dsdLeadershipReading(page.id);
  if (revised) return revised.title;
  if (page.type === "crosswalk") {
    const start = Number(page.id.split("_")[1] ?? 0) + 1;
    return `Article and course crosswalk, articles ${start}–${Math.min(start + 7, 51)}`;
  }
  if (page.type === "research") {
    const start = Number(page.id.split("_")[1] ?? 0) + 1;
    return `${page.title}, studies ${start}–${start + 1}`;
  }
  if (page.type === "contents" && page.id !== "contents") {
    return page.blocks.filter(b => b.style === "Heading3").map(blockText).join(" · ");
  }
  if (page.id === "growth_01") return "Leadership and growth in your role";
  if (page.id === "growth_02") return "Leadership and growth across programs";
  return page.title;
}

export function blockText(block: LeadershipBlock) {
  return block.spans.filter(span => !span.field).map(span => span.text).join("").trim();
}

export function adjacentReadings(page: LeadershipPage) {
  const group = page.competencyId
    ? leadershipPages.filter(p => p.competencyId === page.competencyId)
    : leadershipPages;
  const index = group.findIndex(p => p.id === page.id);
  return { previous: group[index - 1], next: group[index + 1] };
}
