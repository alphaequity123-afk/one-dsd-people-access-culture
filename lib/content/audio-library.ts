import "server-only";
import { PODCASTS } from "./podcasts";

export type AudioFormat = "MP3" | "WAV" | "M4A";

export type AudioLibraryEntry = {
  /** Stable identifier, safe to use in element ids after slugging. */
  id: string;
  title: string;
  /** Site-relative URL of the recording. */
  src: string;
  format: AudioFormat;
  sizeBytes: number | null;
  /** Known length in seconds, or null when it is only discoverable by loading the file. */
  durationSeconds: number | null;
  /** The complete spoken text, when it ships beside the recording. */
  transcript: string | null;
  /** Where the recording is used, with chapters or a transcript when available. */
  related: { label: string; href: string } | null;
};

export type AudioLibraryShelf = {
  id: "podcasts" | "learning-examples";
  title: string;
  intro: string;
  entries: AudioLibraryEntry[];
};


/** Staff listening includes the published podcasts. Lesson samples stay in their lesson context. */
export function listAudioLibraryShelves(): AudioLibraryShelf[] {
  const entries: AudioLibraryEntry[] = PODCASTS.map(podcast => ({
    id: `podcast/${podcast.id}`,
    title: podcast.title,
    src: podcast.src,
    format: "MP3",
    sizeBytes: podcast.bytes,
    durationSeconds: podcast.durationSeconds,
    transcript: null,
    related: { label: "Chapters and the complete transcript", href: podcast.href },
  }));
  return entries.length ? [{
    id: "podcasts", title: "Podcasts",
    intro: "Longer conversations to listen to in full. Each podcast also has its own page with chapters and a complete transcript.",
    entries,
  }] : [];
}

export function countAudioLibraryEntries(shelves: readonly AudioLibraryShelf[]): number {
  return shelves.reduce((total, shelf) => total + shelf.entries.length, 0);
}

/** A shared player must respect the same podcast publication gate as its full page. */
export function filterAudioShelvesByPublication(shelves: readonly AudioLibraryShelf[], availablePodcastIds: ReadonlySet<string>): AudioLibraryShelf[] {
  return shelves.map(shelf => ({ ...shelf, entries: shelf.entries.filter(entry =>
    !entry.id.startsWith("podcast/") || availablePodcastIds.has(entry.id.slice("podcast/".length)),
  ) })).filter(shelf => shelf.entries.length > 0);
}
