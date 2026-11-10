import data from "./water-curriculum.json";
import { normalizePracticeContent, type PracticeModule } from "./clas-curriculum-practice";
import type { Chapter } from "@/lib/learning/vtt";

/**
 * The Water We Swim In as a curriculum collection (owner request, 2026-11-10): each module keeps its
 * text unchanged and gains a CLAS-style learning layer, 4K photographs and a two-host podcast in the
 * program's podcast voices. Media appear only after the release step marks them ready.
 */
export type WaterImage = { slot: "hero" | "chapter"; chapter: string | null; src: string; alt: string; width: number; height: number };
export type WaterPodcast = {
  title: string; summary: string; src: string; captions: string; transcript: string;
  durationSeconds: number; chapters: Chapter[]; mediaReady: boolean;
};
export type WaterLesson = { id: string; reflection: string; podcast: WaterPodcast | null; images: WaterImage[] };

type Raw = { format: string; modules: Array<Record<string, unknown> & { id: string; reflection?: string; podcast?: WaterPodcast | null; images?: WaterImage[] }> };
const raw = data as unknown as Raw;
const practice = normalizePracticeContent({ format: raw.format, modules: raw.modules });

const PREFIX = (id: string) => `/learning/water-we-swim-in/${id}/`;
const local = (id: string, path: unknown) => typeof path === "string" && path.startsWith(PREFIX(id)) && !path.includes("..");

/** A podcast is shown only when the release step has verified its audio, captions and chapters. */
export function readyPodcast(id: string, podcast: WaterPodcast | null | undefined): WaterPodcast | null {
  if (!podcast || podcast.mediaReady !== true) return null;
  if (!local(id, podcast.src) || !local(id, podcast.captions) || !local(id, podcast.transcript)) return null;
  if (!(podcast.durationSeconds > 0) || !podcast.chapters.length) return null;
  const ordered = podcast.chapters.every((c, i, list) => c.title.trim() && c.start >= 0 && c.start < podcast.durationSeconds && (i === 0 || c.start > list[i - 1].start));
  return ordered ? podcast : null;
}

export function waterLesson(id: string): WaterLesson | null {
  const m = raw.modules.find(item => item.id === id);
  if (!m) return null;
  return {
    id,
    reflection: typeof m.reflection === "string" ? m.reflection : "",
    podcast: readyPodcast(id, m.podcast),
    images: (m.images ?? []).filter(img => local(id, img.src) && img.alt && img.width > 0 && img.height > 0),
  };
}

export function waterPractice(id: string): PracticeModule | null {
  return practice.modules.find(m => m.id === id) ?? null;
}

/** Recall shown at the start of a module: the previous module's recall questions. Module 1 has none. */
export function waterRecall(id: string) {
  const index = raw.modules.findIndex(m => m.id === id);
  return index > 0 ? waterPractice(raw.modules[index - 1].id)?.recall ?? [] : [];
}

export const waterModuleId = (number: number) => String(number).padStart(2, "0");
