import { beforeEach, expect, it, vi } from "vitest";
import type { Doc } from "@/lib/intelligence/retrieval/search";
const library = vi.hoisted(() => ({ staff: vi.fn(), program: vi.fn() }));
vi.mock("@/lib/intelligence/retrieval/ask-library", () => ({ recentStaffDocs: library.staff, recentProgramResources: library.program }));
vi.mock("./state-pages", () => ({ statePageDocs: () => [] }));
import { siteSearch } from "./site-search";
const course: Doc = { kind: "content", id: "coaching-course", title: "Coaching Conversations That Help People Grow", href: "/courses/gc-coaching-conversations", authority: "learning", type: "program_destination", status: "published", reviewDate: "", scope: "dsd", summary: "Practice coaching conversations.", text: "Coaching conversations help people grow.", tags: ["coaching"], intents: [] };
beforeEach(() => { library.staff.mockReset().mockResolvedValue([]); library.program.mockReset().mockResolvedValue({ destinations: [course] }); });
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
