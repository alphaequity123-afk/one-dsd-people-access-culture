import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/product/request-context", () => ({ requestedContentScope: async () => "dsd" }));
vi.mock("@/lib/auth/request", () => ({ editingModeFromCookies: async () => false }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, getAll: () => [], has: () => false }), headers: async () => new Headers() }));
vi.mock("next/navigation", async original => ({ ...await original<typeof import("next/navigation")>(), usePathname: () => "/", useRouter: () => ({ push() {} }), useSearchParams: () => new URLSearchParams() }));
vi.mock("@/components/related-readings", () => ({ RelatedReadings: () => null }));
vi.mock("@/components/learning-journey-link", () => ({ LearningJourneyLink: () => null }));
vi.mock("@/components/program-context", async original => ({ ...await original<typeof import("@/components/program-context")>(), ProgramContextNote: () => null }));
vi.mock("@/components/start-client", () => ({ StartClient: () => <div data-start-finder /> }));

import ClasPage from "@/app/learn/clas/page";
import LearnPage from "@/app/learn/page";
import LibraryPage from "@/app/library/page";
import StartPage from "@/app/start/page";
import CollaborationPage from "@/app/learn/collaboration/page";
import JourneyPage from "@/app/learn/paths/[journeyId]/page";
import { developmentModel } from "@/lib/program/development";

const html = (e: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(e).replaceAll("&#x27;", "'").replaceAll("&amp;", "&").replaceAll("&quot;", '"');
const visible = (page: string) => page.replace(/<details[^>]*class="course-more-item"[^>]*>[\s\S]*?<\/details>/g, "");

// Hub pages show a short set of choices; everything else sits in closed panels, still on the page.
describe("hub pages keep their content in closed panels", () => {
  it("clas", async () => {
    const page = html(await ClasPage({ searchParams: Promise.resolve({}) }));
    for (const t of ["Learn the standards", "Prepare a plan", "Find a reference", 'id="learning"', 'id="resources"', 'id="courses"', 'id="connections"', "Connect CLAS with the wider program", "Go to the original standards", "thinkculturalhealth.hhs.gov", "Three ways into"]) expect(page, t).toContain(t);
    expect(page).not.toMatch(/<details[^>]*\sopen/);
    const q = html(await ClasPage({ searchParams: Promise.resolve({ q: "interpret" }) }));
    expect(q).toMatch(/<details[^>]*open/);
  });
  it("learn", async () => {
    const page = html(await LearnPage({ searchParams: Promise.resolve({}) }));
    for (const t of ["The Core 15", "Course series", "Search the collection", "Take it into your work", "Understanding DHS"]) expect(page, t).toContain(t);
    expect(page.indexOf("Search the collection")).toBeLessThan(page.indexOf("The Core 15"));
  });
  it("finds The Water We Swim In by title", async () => {
    const page = html(await LearnPage({ searchParams: Promise.resolve({ q: "Water We Swim In" }) }));
    expect(page).toContain('href="/learn/water-we-swim-in/collection"');
    expect(page).not.toContain("No matching resources");
  });
  it("library", async () => {
    const page = html(await LibraryPage({ searchParams: Promise.resolve({}) }));
    for (const t of ["More ways to explore", "Understanding DHS", 'id="find-resource"', 'id="resource-formats"']) expect(page, t).toContain(t);
    expect(page.indexOf('id="find-resource"')).toBeLessThan(page.indexOf("On this page"));
    const search = html(await LibraryPage({ searchParams: Promise.resolve({ q: "interpreter" }) }));
    expect(search).toContain("results-title");
  });
  it("start", async () => {
    const page = html(await StartPage());
    for (const t of ['id="new-to-dsd"', "From learning to equity in practice", "Getting to know the program"]) expect(page, t).toContain(t);
    expect(visible(page)).not.toContain('id="new-to-dsd"');
    expect(page.indexOf("data-start-finder")).toBeLessThan(page.indexOf('id="new-to-dsd"'));
  });
  it("collaboration", async () => {
    const page = html(await CollaborationPage({ searchParams: Promise.resolve({}) }));
    expect(page).toContain("Keep exploring");
    expect(page).not.toMatch(/<details[^>]*\sopen/);
    expect(page).toContain("Download or share this page");
  });
  it("paths", async () => {
    for (const journey of developmentModel.journeys) {
      const page = html(await JourneyPage({ params: Promise.resolve({ journeyId: journey.id }) }));
      expect(page).toContain("Courses and resources for this step");
      expect(page).toContain("Download or share this page");
      for (const stage of developmentModel.stages) expect(page).toContain(`id="${stage.id}"`);
    }
  });
});
