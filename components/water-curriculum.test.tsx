import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import type { WaterLesson } from "@/lib/content/water-curriculum";

const podcast = {
  title: "Talking it through", summary: "Two colleagues discuss the module.", src: "/learning/water-we-swim-in/02/podcast.mp3",
  captions: "/learning/water-we-swim-in/02/podcast.vtt", transcript: "/learning/water-we-swim-in/02/podcast.txt",
  durationSeconds: 720, chapters: [{ title: "Opening", start: 0 }, { title: "Closing", start: 600 }], mediaReady: true,
};
// The release step has not published the podcast yet; this stands in for a ready one.
vi.mock("@/lib/content/water-curriculum", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/content/water-curriculum")>();
  return { ...actual, waterLesson: (id: string) => ({ ...(actual.waterLesson(id) ?? { id, reflection: "", images: [] }), id, podcast } as WaterLesson) };
});
import WaterModulePage from "@/app/learn/water-we-swim-in/[module]/page";
import { WATER_MODULES } from "@/lib/content/water-we-swim-in";

afterEach(() => { cleanup(); });
const before = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("Water We Swim In module podcast (owner rule 2026-11-10)", () => {
  it("renders the ready podcast right under the module title and goal, in the shared Podcast panel, before recall, downloads and the module text", async () => {
    const waterModule = WATER_MODULES[1];
    const view = render(await WaterModulePage({ params: Promise.resolve({ module: waterModule.slug }) }));
    const title = view.getByRole("heading", { level: 1 });
    const audio = view.container.querySelector("audio")!;
    expect(audio.getAttribute("src")).toBe(podcast.src);
    expect(view.container.querySelectorAll("h2")[0].textContent).toBe(`Listen: ${podcast.title}`);
    expect(before(title, audio)).toBe(true);
    // The shared Podcast panel names itself for screen readers only: no visible label bar or length (owner 2026-11-10).
    const panel = view.getByRole("group", { name: "Podcast" });
    expect(panel.getAttribute("data-featured-media")).toBe("podcast");
    expect(panel.contains(audio)).toBe(true);
    expect(panel.querySelector(".featured-media-label, .featured-media__label")).toBeNull();
    expect(panel.textContent).not.toMatch(/Podcast ·|about \d+ minutes?/);
    const downloads = view.getByText("Download or share this module");
    expect(before(audio, downloads)).toBe(true);
    const photo = view.container.querySelector(".water-figure-hero");
    if (photo) expect(before(audio, photo)).toBe(true);
    const recall = view.queryByRole("heading", { name: /Before you start: a quick recall/ });
    if (recall) expect(before(audio, recall)).toBe(true);
    expect(view.getByRole("link", { name: "Read the transcript" }).getAttribute("href")).toBe(podcast.transcript);
  });
});
