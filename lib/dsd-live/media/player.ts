/** Plain helpers for the course player, kept out of the component so they can be tested without a browser. */

export type Chapter = { title: string; start: number };

/** The index of the chapter playing at a given time: the last chapter that has started. Before the first, the first. */
export function chapterAt(chapters: Chapter[], time: number): number {
  let index = 0;
  for (let i = 0; i < chapters.length; i++) if (time + 0.25 >= chapters[i].start) index = i;
  return index;
}

/** Minutes and seconds, or hours, minutes and seconds for long recordings. */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

/** Spoken form for screen readers, for example "4 minutes 5 seconds". */
export function spokenTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds)), m = Math.floor(s / 60), r = s % 60;
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  return m ? (r ? `${unit(m, "minute")} ${unit(r, "second")}` : unit(m, "minute")) : unit(r, "second");
}

type Seekable = { currentTime: number; paused?: boolean; play?: () => Promise<void> | void };

/** Move the recording to a chapter and play from there. A browser that blocks playback still lands on the chapter. */
export function seekTo(media: Seekable | null | undefined, start: number): void {
  if (!media) return;
  media.currentTime = start;
  try {
    const result = media.play?.();
    if (result && typeof (result as Promise<void>).catch === "function") (result as Promise<void>).catch(() => {});
  } catch {
    // Playback can be refused; the position is already set.
  }
}
