import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
vi.mock("next/navigation", async original => ({ ...await original<typeof import("next/navigation")>(), useRouter: () => ({ push() {}, replace() {} }) }));
import { handOffSearch, SEARCH_HANDOFF_KEYS, takeHandOff } from "./private-search";
import { CourseFinder, matchingCourses } from "./course-finder";
import { matchingSources } from "./source-finder";
import { CommunityDirectory } from "./community-directory";
import { SiteSearchPage } from "./site-search-page";
import { isPrivateBrowserStorageKey } from "@/lib/client/storage-keys";

afterEach(() => { window.sessionStorage.clear(); vi.unstubAllGlobals(); });

describe("typed search words never go into the address (owner rule 2026-11-16)", () => {
  it("hands words to the next page through session storage once, and the keys are registered for clearing", () => {
    handOffSearch(SEARCH_HANDOFF_KEYS.ask, "How do I plan interpreter access?");
    expect(takeHandOff(SEARCH_HANDOFF_KEYS.ask)).toBe("How do I plan interpreter access?");
    expect(takeHandOff(SEARCH_HANDOFF_KEYS.ask)).toBe("");
    window.sessionStorage.setItem(SEARCH_HANDOFF_KEYS.ask, JSON.stringify("from the home page"));
    expect(takeHandOff(SEARCH_HANDOFF_KEYS.ask)).toBe("from the home page");
    expect(SEARCH_HANDOFF_KEYS.ask).toBe("ask-pending-question");
    for (const key of Object.values(SEARCH_HANDOFF_KEYS)) expect(isPrivateBrowserStorageKey("session", key), key).toBe(true);
  });

  it("filters courses and sources in the page with the same matching as before", () => {
    const courses = [
      { id: "a", title: "Language access basics", summary: "", href: "/courses/a", level: "Foundation", detail: "1 hour · 3 lessons", series: "" },
      { id: "b", title: "Leading change", summary: "Collaboration across teams", href: "/courses/b", level: "Advanced", detail: "", series: "" },
    ];
    expect(matchingCourses(courses, "COLLABORATION", "").map(c => c.id)).toEqual(["b"]);
    expect(matchingCourses(courses, "", "Foundation").map(c => c.id)).toEqual(["a"]);
    const source = { name: "Radio K", kind: "Media", uses: ["Outreach" as const], communities: ["somali"], region: "Twin Cities", what: "Somali-language radio", howToUse: "", checked: "2026-11", category: "media", languages: ["Somali"] };
    expect(matchingSources([source], { category: "", use: "", community: "", q: "somali" })).toHaveLength(1);
    expect(matchingSources([source], { category: "colleges", use: "", community: "", q: "" })).toHaveLength(0);
  });

  it("keeps the address unchanged while narrowing courses and communities", () => {
    const before = window.location.href;
    render(<CourseFinder all={[{ id: "a", title: "Language access basics", summary: "", href: "/courses/a", level: "", detail: "", series: "" }]} initial={{ q: "", level: "", browse: false, page: 1 }} />);
    fireEvent.change(screen.getByLabelText("Find a course"), { target: { value: "language" } });
    fireEvent.submit(screen.getByRole("button", { name: "Find courses" }).closest("form")!);
    expect(screen.getByRole("heading", { name: "1 matching courses" })).toBeTruthy();
    render(<CommunityDirectory entries={[{ id: "somali", title: "Somali", native: false }, { id: "hmong", title: "Hmong", native: false }]} featuredIds={["somali"]} initialQuery="" copy={{ searchLabel: "Find a community", searchExample: "", searchButton: "Search" }} />);
    fireEvent.change(screen.getByLabelText("Find a community"), { target: { value: "hmo" } });
    expect(screen.getByText("1 matching brief")).toBeTruthy();
    expect(window.location.href).toBe(before);
  });

  it("sends the full search in a request body, not the address", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [{ id: "r1", title: "Interpreter guide", href: "/library/r1", excerpt: "", area: "learn", external: false }] })));
    vi.stubGlobal("fetch", fetcher);
    handOffSearch(SEARCH_HANDOFF_KEYS.siteSearch, "interpreter");
    await act(async () => { render(<SiteSearchPage />); });
    expect(await screen.findByText("Interpreter guide")).toBeTruthy();
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe("/api/search");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body).q).toBe("interpreter");
    fireEvent.click(screen.getByRole("link", { name: "Ask this as a question" }));
    expect(window.sessionStorage.getItem("ask-pending-question")).toBe("interpreter");
  });
});
