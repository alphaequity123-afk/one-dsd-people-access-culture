import { describe, expect, it } from "vitest";
import { cleanCourseMediaManifest, mediaForPage, type CourseMediaItem } from "./course-media";

const h = (c: string) => c.repeat(64);
const base = { format: "course-media-v1", id: "cm-test", title: "Test", kind: "video", summary: "", pages: ["/courses/x"], media: h("a") + ".mp4", captions: h("b") + ".vtt", transcript: h("c") + ".txt", durationSeconds: 60, chapters: [{ title: "One", start: 0 }] };

describe("course media manifests", () => {
  it("accepts a complete manifest and drops unknown fields", () => {
    const item = cleanCourseMediaManifest({ ...base, extra: "x" }, "cm-test")!;
    expect(item.id).toBe("cm-test");
    expect("extra" in item).toBe(false);
  });
  it("rejects a mismatched id, wrong media type, unsafe page or non-hash file", () => {
    expect(cleanCourseMediaManifest(base, "other")).toBeNull();
    expect(cleanCourseMediaManifest({ ...base, kind: "audio" }, "cm-test")).toBeNull();
    expect(cleanCourseMediaManifest({ ...base, pages: ["https://example.com"] }, "cm-test")).toBeNull();
    expect(cleanCourseMediaManifest({ ...base, pages: ["/a/../b"] }, "cm-test")).toBeNull();
    expect(cleanCourseMediaManifest({ ...base, media: "video.mp4" }, "cm-test")).toBeNull();
  });
  it("matches pages exactly and serves public addresses", () => {
    const item = cleanCourseMediaManifest(base, "cm-test") as CourseMediaItem;
    expect(mediaForPage([item], "/courses/x/")).toHaveLength(1);
    expect(mediaForPage([item], "/courses/xy")).toHaveLength(0);
    expect(mediaForPage([item], "/courses/x")[0].media).toBe("/learning/course-media/" + base.media);
  });
});
