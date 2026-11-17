import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/courses/example" }));
import { CourseMediaForPage, CourseMediaJumpSlot, CourseMediaSlot } from "./course-media-for-page";

const item = (id: string, kind: "video" | "audio") => ({
  id, title: `Title ${id}`, kind, summary: "", media: `/learning/course-media/${id}.${kind === "video" ? "mp4" : "mp3"}`,
  captions: `/learning/course-media/${id}.vtt`, transcript: `/learning/course-media/${id}.txt`, durationSeconds: 300, chapters: [],
});
const before = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

function respond(items: unknown[]) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ items }) })));
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("published course media sits under the page title (owner rule 2026-11-10)", () => {
  it("goes into the page's slot, videos first, in the shared panel, before the outline, with no visible label or length", async () => {
    respond([item("talk", "audio"), item("intro", "video")]);
    const view = render(<main id="main"><header><h1>Course</h1><CourseMediaJumpSlot /></header><CourseMediaSlot /><section><h2>Course outline</h2></section><CourseMediaForPage /></main>);
    await waitFor(() => expect(view.container.querySelectorAll("[data-course-media-slot] [data-featured-media]")).toHaveLength(2));
    const slot = view.container.querySelector("[data-course-media-slot]")!;
    const [first, second] = slot.querySelectorAll("[data-featured-media]");
    expect(first.getAttribute("data-featured-media")).toBe("video");
    expect(first).toBe(view.getByRole("group", { name: "Video explainer" }));
    expect(first.querySelector("video")).not.toBeNull();
    expect(second.getAttribute("data-featured-media")).toBe("audio");
    expect(second).toBe(view.getByRole("group", { name: "Listen" }));
    expect(second.querySelector("audio")).not.toBeNull();
    for (const panel of [first, second]) {
      expect(panel.querySelector(".featured-media-label, .featured-media__label")).toBeNull();
      expect(panel.textContent).not.toMatch(/Video explainer|Listen ·|about \d+ minutes?/);
    }
    // The title area's jump button reads plainly, without minutes.
    const jump = view.getByRole("link", { name: "Watch the lesson" });
    expect(jump.textContent).toBe("Watch the lesson");
    expect(jump.getAttribute("href")).toBe("#course-media");
    expect(before(slot, view.getByRole("heading", { name: "Course outline" }))).toBe(true);
    expect(slot.querySelector("video track")?.getAttribute("src")).toBe("/learning/course-media/intro.vtt");
    expect(view.getAllByRole("link", { name: /^Read the full transcript for/ })).toHaveLength(2);
  });
  it("without a slot, goes right after the title's header, not to the foot of the page", async () => {
    respond([item("intro", "video")]);
    const view = render(<main id="main"><header><h1>Page</h1><p>Intro</p></header><section><h2>Readings</h2></section><CourseMediaForPage /></main>);
    await waitFor(() => expect(view.container.querySelector("[data-course-media-placed] video")).not.toBeNull());
    const placed = view.container.querySelector("[data-course-media-placed]")!;
    expect(placed.previousElementSibling?.tagName).toBe("HEADER");
    expect(before(placed, view.getByRole("heading", { name: "Readings" }))).toBe(true);
  });
  it("shows nothing when nothing is published", async () => {
    respond([]);
    const view = render(<main id="main"><h1>Page</h1><CourseMediaSlot /><CourseMediaForPage /></main>);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(view.container.querySelector("[data-featured-media]")).toBeNull();
  });
});

it("seeks after metadata when a chapter is selected before loading", async () => {
  respond([{ ...item("chaptered", "video"), chapters: [{ title: "Start", start: 0 }, { title: "Review", start: 80 }] }]);
  const play=vi.spyOn(HTMLMediaElement.prototype,"play").mockResolvedValue();
  const load=vi.spyOn(HTMLMediaElement.prototype,"load").mockImplementation(()=>{});
  const v=render(<main id="main"><h1>Course</h1><CourseMediaSlot /><CourseMediaForPage /></main>);
  await waitFor(()=>expect(v.container.querySelector("video")).not.toBeNull());
  const video=v.container.querySelector("video")!;
  expect(video.getAttribute("aria-label")).toBe("Title chaptered: video recording");
  fireEvent.click(v.getByRole("button",{name:"Review"}));
  expect(load).toHaveBeenCalled(); expect(video.currentTime).toBe(0);
  fireEvent.loadedMetadata(video); expect(video.currentTime).toBe(80);
  await waitFor(()=>expect(play).toHaveBeenCalled());
  play.mockRestore();load.mockRestore();
});

it("distinguishes the three published recordings from their matching written lesson regions", async () => {
  const titles = ["Cultural intelligence in everyday work", "Read a source with care", "Make a useful connection"];
  respond(titles.map((title,index)=>({...item(`cm-cultural-intelligence-explainer-ev-v${index+1}`,"video"),title})));
  const v=render(<main id="main"><h1>Cultural intelligence</h1><CourseMediaSlot />{titles.map((title,index)=><section key={title} aria-labelledby={`written-${index}`}><h2 id={`written-${index}`}>{title}</h2><p>Written lesson.</p></section>)}<CourseMediaForPage /></main>);
  await waitFor(()=>expect(v.container.querySelectorAll("video")).toHaveLength(3));
  for (const title of titles) {
    expect(v.getByRole("region",{name:title})).toBeTruthy();
    const recording=v.getByRole("region",{name:`${title}: video recording`});
    expect(recording.querySelector("h2")?.textContent).toBe(title);
    expect(recording.querySelector("video")?.getAttribute("aria-label")).toBe(`${title}: video recording`);
  }
  const ids=[...v.container.querySelectorAll("[id]")].map(el=>el.id);
  expect(new Set(ids).size).toBe(ids.length);
});

it("distinguishes three same-title versions across page and individual media slots", async () => {
  const title="Preparing for a conversation";
  respond([1,2,3].map(n=>({...item(`version-${n}`,"video"),title})));
  const v=render(<main id="main"><h1>Learning</h1><CourseMediaSlot /><section><h2>Practice</h2><CourseMediaSlot itemId="version-2" /></section><CourseMediaForPage /></main>);
  await waitFor(()=>expect(v.container.querySelectorAll("video")).toHaveLength(3));
  for (const n of [1,2,3]) {
    const name=`${title}: video recording, ${n} of 3`;
    const region=v.getByRole("region",{name});
    expect(region.querySelector("video")?.getAttribute("aria-label")).toBe(name);
    expect(v.getByRole("link",{name:`Read the full transcript for ${name}`})).toBeTruthy();
  }
  expect(v.getAllByRole("heading",{name:title})).toHaveLength(3);
});
