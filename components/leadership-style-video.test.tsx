import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LeadershipStyleVideo } from "./leadership-style-video";

const root = "/learning/leadership-videos/";
const manifest = {
  format: "leadership-video-v1",
  style: "servant",
  video: `${root}${"a".repeat(64)}.mp4`,
  captions: `${root}${"b".repeat(64)}.vtt`,
  transcript: `${root}${"c".repeat(64)}.txt`,
};

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("individual leadership video", () => {
  it("shows the independently published player, captions and transcript for the requested style", async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => manifest }));
    vi.stubGlobal("fetch", fetcher);
    const { container } = render(<LeadershipStyleVideo style="servant" title="Servant leadership" />);
    await waitFor(() => expect(screen.getByLabelText("Servant leadership video")).toBeTruthy());
    expect(fetcher).toHaveBeenCalledWith(`${root}servant.json`, expect.objectContaining({ cache: "no-store" }));
    expect(container.querySelector("video source")?.getAttribute("src")).toBe(manifest.video);
    expect(container.querySelector("track[kind='captions']")?.getAttribute("src")).toBe(manifest.captions);
    expect(screen.getByRole("link", { name: "Read the transcript" }).getAttribute("href")).toBe(manifest.transcript);
  });

  it.each([
    { ...manifest, style: "democratic" },
    { ...manifest, captions: "https://example.org/captions.vtt" },
    { ...manifest, transcript: `${root}not-a-hash.txt` },
    { ...manifest, format: "unknown" },
  ])("does not show media from a mismatched or invalid manifest", async (invalid) => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => invalid }));
    vi.stubGlobal("fetch", fetcher);
    render(<LeadershipStyleVideo style="servant" title="Servant leadership" />);
    await waitFor(() => expect(fetcher).toHaveBeenCalled());
    expect(screen.queryByLabelText("Servant leadership video")).toBeNull();
    expect(screen.queryByRole("link", { name: "Read the transcript" })).toBeNull();
  });

  it("keeps the lesson quiet when no media is published", async () => {
    const fetcher = vi.fn(async () => ({ ok: false }));
    vi.stubGlobal("fetch", fetcher);
    render(<LeadershipStyleVideo style="democratic" title="Democratic leadership" />);
    await waitFor(() => expect(fetcher).toHaveBeenCalled());
    expect(screen.queryByLabelText("Democratic leadership video")).toBeNull();
  });
});
