import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import course from "@/lib/content/water-foundation-course.json";
import { WaterFoundationCourse } from "./water-foundation-course";

vi.mock("@/components/app-link", () => ({
  default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
  SourceLink: (props: AnchorHTMLAttributes<HTMLAnchorElement> & { original?: boolean }) => <a href={props.href}>{props.children}</a>,
}));
const availability = vi.hoisted(() => vi.fn());
vi.mock("@/lib/content/cultural-intelligence-publication", () => ({ culturalIntelligenceHubAvailable: availability }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
afterEach(cleanup);

describe("Accepted foundation course", () => {
  it("seeks chapters and changes the learning objective without forcing playback", () => {
    const { container } = render(<WaterFoundationCourse />);
    const video = container.querySelector("video")!;
    const chapter = course.chapters[6];
    fireEvent.click(screen.getByRole("button", { name: new RegExp(chapter.title) }));
    expect(video.currentTime).toBe(chapter.start);
    expect(screen.getByText(chapter.objective)).toBeTruthy();
    video.currentTime = chapter.start - 0.000001;
    fireEvent.seeked(video);
    expect(screen.getByText(chapter.objective)).toBeTruthy();
    expect(video.paused).toBe(true);
    expect(video.autoplay).toBe(false);
    expect(container.querySelector("track")?.hasAttribute("default")).toBe(false);
  });
  it("keeps the full transcript and original source URLs accessible through keyboard tabs", () => {
    render(<WaterFoundationCourse />);
    const overview = screen.getByRole("tab", { name: "Overview" });
    fireEvent.keyDown(overview, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Transcript" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText(course.scenes[0].narration.split("\n\n")[0])).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Sources" }));
    for (const source of course.sources) expect(screen.getByRole("link", { name: source.title }).getAttribute("href")).toBe(source.url);
    expect(screen.queryByText(/Geffen|Download 4K|AI narration/i)).toBeNull();
  });
  it("removes the course and its metadata when Cultural Intelligence is withdrawn", async () => {
    availability.mockResolvedValue(false);
    const { default: page, generateMetadata } = await import("@/app/learn/water-we-swim-in/course/page");
    await expect(page()).rejects.toThrow("NOT_FOUND");
    expect(await generateMetadata()).toEqual({ title: "Learning and resources" });
    availability.mockResolvedValue(true);
    expect(await page()).toBeTruthy();
  });
});
