import type { Chapter } from '@/lib/learning/vtt';

/** Per-module walkthrough audio fields in lib/content/clas-curriculum.json, added by the media agent. */
export type Walkthrough = { audio: string; captions: string | null; transcript: string | null; chapters: Chapter[]; durationSeconds: number };

const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** Null when the module has no walkthrough fields yet, so pages render without them. */
export function walkthroughOf(module: unknown): Walkthrough | null {
  if (typeof module !== 'object' || module === null) return null;
  const raw = (module as { walkthrough?: unknown }).walkthrough;
  if (typeof raw !== 'object' || raw === null) return null;
  const w = raw as Record<string, unknown>;
  const audio = text(w.audio);
  if (!audio) return null;
  const chapters: Chapter[] = Array.isArray(w.chapters)
    ? w.chapters.flatMap(c => {
      if (typeof c !== 'object' || c === null) return [];
      const { title, start } = c as { title?: unknown; start?: unknown };
      return typeof title === 'string' && title.trim() && Number.isFinite(Number(start)) ? [{ title: title.trim(), start: Number(start) }] : [];
    })
    : [];
  return { audio, captions: text(w.captions), transcript: text(w.transcript), chapters, durationSeconds: Number.isFinite(Number(w.durationSeconds)) ? Number(w.durationSeconds) : 0 };
}
