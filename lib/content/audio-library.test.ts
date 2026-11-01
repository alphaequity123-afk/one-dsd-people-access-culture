import { describe, expect, it } from "vitest";
import { countAudioLibraryEntries, filterAudioShelvesByPublication, type AudioLibraryEntry, type AudioLibraryShelf } from "./audio-library";

const entry = (id: string): AudioLibraryEntry => ({ id, title: id, src: `/audio/${id}.mp3`, format: "MP3", sizeBytes: null, durationSeconds: null, transcript: null, related: null });

describe("public audio shelves", () => {
  it("excludes withdrawn podcasts from the shared player and count", () => {
    const shelves: AudioLibraryShelf[] = [{ id: "podcasts", title: "Podcasts", intro: "", entries: [entry("podcast/approved"), entry("podcast/withdrawn")] }];
    const result = filterAudioShelvesByPublication(shelves, new Set(["approved"]));
    expect(result[0].entries.map(item => item.id)).toEqual(["podcast/approved"]);
    expect(countAudioLibraryEntries(result)).toBe(1);
    expect(filterAudioShelvesByPublication(shelves, new Set())).toEqual([]);
  });
});
