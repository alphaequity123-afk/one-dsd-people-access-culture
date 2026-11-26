import developmentModel from "@/lib/program/development.json";
import { programCatalog, type Tier } from "@/lib/program/catalog";
import { PODCASTS } from "@/lib/content/podcasts";

/**
 * The Knowledge browser's index (v2 prototype, owner decision 2026-11-26): every course, guide, reading, policy
 * reference and podcast in one list, filterable by learning path, Start / Apply / Lead and format. Nothing is
 * removed: items come from the program catalog as they are. The tier is the catalog's suggestion only; every item
 * stays open to everyone.
 */
export { FORMATS, FORMAT_LABEL } from "@/lib/program/knowledge-formats";
export type { Format, LearningPath, KnowledgeRow } from "@/lib/program/knowledge-formats";
import type { Format, LearningPath, KnowledgeRow } from "@/lib/program/knowledge-formats";

const KIND_FORMAT: Partial<Record<string, Format>> = { course: "course", lesson: "course", resource: "guide", reading: "reading", policy: "policy" };

function pathIndex(): Map<string, string[]> {
  const byHref = new Map<string, string[]>();
  for (const journey of developmentModel.journeys) {
    for (const link of journey.links) {
      const href = link.href.split("#")[0];
      byHref.set(href, [...(byHref.get(href) ?? []), journey.id]);
    }
  }
  return byHref;
}

export function learningPaths(): LearningPath[] {
  return developmentModel.journeys.map(journey => ({ id: journey.id, title: journey.title }));
}

export function knowledgeRows(): KnowledgeRow[] {
  const paths = pathIndex();
  const seen = new Set<string>();
  const rows: KnowledgeRow[] = [];
  for (const item of programCatalog()) {
    const format = KIND_FORMAT[item.kind];
    if (!format || seen.has(item.href)) continue;
    seen.add(item.href);
    rows.push([item.title, item.href, format, item.tier, paths.get(item.href.split("#")[0]) ?? []]);
  }
  for (const podcast of PODCASTS) {
    // Each podcast has its own page; its course link may already be listed as the course itself.
    const href = `/podcasts/${podcast.id}`;
    if (seen.has(href)) continue;
    seen.add(href);
    rows.push([podcast.title, href, "audio", "start", paths.get(podcast.href.split("#")[0]) ?? []]);
  }
  return rows;
}
