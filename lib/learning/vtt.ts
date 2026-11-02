/** WebVTT cue parsing and the active-cue arithmetic shared by the synced transcripts. */
export type Cue = { start: number; end: number; text: string };
export type Chapter = { title: string; start: number };

/** "00:01:02.500", "01:02.500" or "62.5" to seconds; NaN when the text is not a timestamp. */
export function parseTimestamp(text: string): number {
  const parts = text.trim().split(':');
  if (parts.length < 1 || parts.length > 3 || parts.some(p => !/^\d+(\.\d+)?$/.test(p))) return NaN;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

/** Cues in file order. Cue identifiers, NOTE/STYLE blocks and inline voice tags are dropped. */
export function parseVtt(text: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = text.replace(/\r\n?/g, '\n').split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const timing = lines.findIndex(l => l.includes('-->'));
    if (timing < 0) continue;
    const [from, to] = lines[timing].split('-->').map(s => s.trim().split(/\s+/)[0]);
    const start = parseTimestamp(from), end = parseTimestamp(to);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;
    const body = lines.slice(timing + 1).join(' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (body) cues.push({ start, end, text: body });
  }
  return cues;
}

/** Joins consecutive caption fragments until a sentence ends, so the transcript highlights whole sentences. */
export function groupCuesIntoSentences(cues: Cue[]): Cue[] {
  const sentences: Cue[] = [];
  let open: Cue | null = null;
  for (const cue of cues) {
    open = open ? { start: open.start, end: cue.end, text: `${open.text} ${cue.text}` } : { ...cue };
    if (/[.!?]["')\]]?$/.test(open.text)) { sentences.push(open); open = null; }
  }
  if (open) sentences.push(open);
  return sentences;
}

/**
 * Index of the item playing at `time`: the one whose range contains it, otherwise the last one that
 * has started (so the highlight stays through a pause between cues). -1 before the first item.
 */
export function activeIndex(items: { start: number; end?: number }[], time: number): number {
  let active = -1;
  for (let i = 0; i < items.length; i++) {
    if (items[i].start > time) break;
    active = i;
  }
  return active;
}

/** Cue index at which each chapter begins: the first cue starting at or after the chapter start. */
export function chapterBoundaries(cues: Cue[], chapters: Chapter[]): Map<number, number> {
  const map = new Map<number, number>();
  chapters.forEach((chapter, c) => {
    let cue = cues.findIndex(k => k.start >= chapter.start - 0.05);
    if (cue < 0 && cues.length) cue = cues.length - 1;
    if (cue >= 0 && !map.has(cue)) map.set(cue, c);
  });
  return map;
}

export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
