import { beforeEach, expect, it, vi } from "vitest";
import type { Doc } from "@/lib/intelligence/retrieval/search";
const library = vi.hoisted(() => ({ staff: vi.fn(), program: vi.fn(), supplements: vi.fn() }));
vi.mock("@/lib/intelligence/retrieval/ask-library", () => ({ recentStaffDocs: library.staff, recentProgramResources: library.program }));
vi.mock("@/lib/intelligence/retrieval/published-resource-supplements", () => ({ publishedResourceSupplements: library.supplements }));
vi.mock("./state-pages", () => ({ statePageDocs: () => [] }));
import { siteSearch } from "./site-search";
const course: Doc = { kind: "content", id: "coaching-course", title: "Coaching Conversations That Help People Grow", href: "/courses/gc-coaching-conversations", authority: "learning", type: "program_destination", status: "published", reviewDate: "", scope: "dsd", summary: "Practice coaching conversations.", text: "Coaching conversations help people grow.", tags: ["coaching"], intents: [] };
beforeEach(() => { library.staff.mockReset().mockResolvedValue([]); library.program.mockReset().mockResolvedValue({ destinations: [course] }); library.supplements.mockReset().mockResolvedValue([]); });
it("finds published courses from the same program library as Ask", async () => {
  const hits = await siteSearch("coaching", "dsd");
  expect(hits.some(hit => hit.href === course.href)).toBe(true);
  expect(library.program).toHaveBeenCalledWith("dsd");
});
it("refreshes program publications instead of retaining withdrawn courses forever", async () => {
  expect((await siteSearch("coaching", "dsd")).some(hit => hit.href === course.href)).toBe(true);
  library.program.mockResolvedValue({ destinations: [] });
  expect((await siteSearch("coaching", "dsd")).some(hit => hit.href === course.href)).toBe(false);
});
it("keeps staff results and deduplicates multiple passages at the same destination", async () => {
  library.staff.mockResolvedValue([{ ...course, id: "staff-course" }]);
  library.program.mockResolvedValue({ destinations: [course, { ...course, id: "course-anchor", href: course.href + "#practice" }] });
  expect((await siteSearch("coaching", "dsd")).filter(hit => hit.href.split("#")[0] === course.href)).toHaveLength(1);
});
it("shows readable course excerpts without leaking HTML or clipped link attributes", async () => {
  const text = `<p>${"Introductory background. ".repeat(25)}</p><p>For <a href="https://example.org/${"long-destination/".repeat(35)}accessible-meetings">accessible meetings</a>, share notes &amp; offer captions.</p><p>Return an accurate account of decisions.</p>`;
  const htmlCourse = { ...course, id: "accessible-meetings", title: "Equity in Remote and Hybrid Work", tags: ["accessible meetings"], text };
  library.program.mockResolvedValue({ destinations: [htmlCourse] });
  const hit = (await siteSearch("accessible meetings", "dsd")).find(row => row.id === htmlCourse.id);
  expect(hit?.href).toBe(course.href);
  expect(hit?.excerpt).toContain("accessible meetings, share notes & offer captions.");
  expect(hit?.excerpt).toContain("Return an accurate account of decisions.");
  expect(hit?.excerpt).not.toMatch(/<\/?[a-z]|href=|example\.org|long-destination|&amp;/i);
  expect(htmlCourse.text).toBe(text);
});
it("finds substantive transcript passages and reviewed readings beyond their titles", async () => {
  const transcript: Doc = { ...course, id: "audio-passage", title: "A learning conversation", href: "/learning/course-media/example.mp3#t=12", type: "public_media_transcript", summary: "A conversation about invitations.", text: "Confirm how people can request interpretation before the invitation is sent.", tags: [] };
  const reading: Doc = { ...course, id: "reviewed-reading", title: "Communication guidance", href: "/source-reading/example?section=2", type: "source_reading_section", summary: "Reviewed outside reading.", text: "Qualified interpreters support effective communication for companions as well as the person receiving services.", tags: [] };
  library.supplements.mockResolvedValue([transcript, reading]);
  expect((await siteSearch("request interpretation", "dsd")).some(hit => hit.href === transcript.href)).toBe(true);
  expect((await siteSearch("qualified interpreters companions", "dsd")).some(hit => hit.href === reading.href)).toBe(true);
  expect(library.supplements).toHaveBeenCalledWith("dsd", expect.arrayContaining([course]));
  library.supplements.mockResolvedValue([]);
  expect((await siteSearch("request interpretation", "dsd")).some(hit => hit.href === transcript.href)).toBe(false);
});
