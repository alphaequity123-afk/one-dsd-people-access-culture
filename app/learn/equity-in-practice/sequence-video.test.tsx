import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import SequenceVideo from "./sequence-video";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("tutorial video playback", () => {
  it("pauses Geffen and other audio/video without pausing itself", () => {
    vi.stubGlobal("React", React);
    const view = render(<><audio data-testid="geffen" src="/audio/geffen-read-aloud/example.mp3" /><audio data-testid="podcast" /><video data-testid="other-video" /><SequenceVideo className="player" src="/video.mp4" poster="/poster.png" title="Worked example" /></>);
    const current = view.getByLabelText("Worked example video with captions") as HTMLVideoElement;
    const others = [view.getByTestId("geffen"), view.getByTestId("podcast"), view.getByTestId("other-video")] as HTMLMediaElement[];
    const pauses = others.map(media => { Object.defineProperty(media, "paused", { configurable: true, value: false }); return vi.spyOn(media, "pause").mockImplementation(() => {}); });
    const ownPause = vi.spyOn(current, "pause").mockImplementation(() => {});
    expect(pauses.every(spy => spy.mock.calls.length === 0)).toBe(true);
    fireEvent.play(current);
    for (const pause of pauses) expect(pause).toHaveBeenCalledTimes(1);
    expect(ownPause).not.toHaveBeenCalled();
  });
  it("retains manual controls, no autoplay and the user’s chosen caption mode", () => {
    vi.stubGlobal("React", React);
    const view = render(<SequenceVideo className="player" src="/video.mp4" poster="/poster.png" title="Worked example" />);
    const current = view.getByLabelText("Worked example video with captions") as HTMLVideoElement;
    const track = { mode: "showing" };
    Object.defineProperty(current, "textTracks", { configurable: true, value: [track] });
    const play = vi.spyOn(current, "play").mockResolvedValue();
    expect(current.controls).toBe(true); expect(current.autoplay).toBe(false); expect(current.preload).toBe("metadata");
    fireEvent.loadedMetadata(current);
    expect(track.mode).toBe("showing"); expect(play).not.toHaveBeenCalled();
  });
  it("attaches the matching caption file and provides a transcript fallback", () => {
    vi.stubGlobal("React", React);
    const view = render(<SequenceVideo className="player" src="/video.mp4" poster="/poster.png" title="Worked example" captions="/captions.vtt" transcript="/transcript.txt" />);
    const track = view.container.querySelector("track");
    expect(track?.getAttribute("src")).toBe("/captions.vtt");
    expect(track?.getAttribute("kind")).toBe("captions");
    expect(view.getByText("Read the transcript for Worked example").getAttribute("href")).toBe("/transcript.txt");
    fireEvent.error(view.getByLabelText("Worked example video with captions"));
    expect(view.getByRole("status").textContent).toContain("could not be loaded");
  });
});
