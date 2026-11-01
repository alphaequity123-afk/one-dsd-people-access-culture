import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ showSources: false, showCommunities: false }));
vi.mock("@/lib/product/request-context", () => ({ requestedContentScope: async () => "dsd" }));
vi.mock("@/lib/content/prepare-editable-surface", () => ({
  prepareEditableSurface: async (id: string) => ({ available: id === "sources.page" ? state.showSources : id === "communities.index" ? state.showCommunities : false }),
}));
vi.mock("@/lib/content/cultural-intelligence-publication", () => ({ culturalIntelligenceHubAvailable: async () => false }));
vi.mock("@/components/resource-theme-pathway", () => ({ ResourceThemePathway: () => null }));
vi.mock("@/lib/content/courses/published", () => ({
  publishedCourses: async () => [{ pack: { course: { id: "disability-and-language" } } }],
  courseContentItem: () => ({ id: "course-disability-and-language", title: "Public course", type: "learning_module", status: "approved", tags: [] }),
  courseHref: (id: string) => `/courses/${id}`,
}));
vi.mock("@/lib/content/staff-publications", () => ({ loadStaffContentSnapshot: async () => ({ items: [
  { id: "course-div-f01-white-privilege", title: "Unpublished item", type: "learning_module", status: "under_review", tags: [] },
] }) }));
vi.mock("@/lib/content/self-directed", () => ({ selfDirectedHref: () => null, selfDirectedItems: () => [] }));
vi.mock("@/lib/content/reading-collection", () => ({ searchReadings: () => [], readingHref: (id: string) => `/learn/readings/${id}` }));
vi.mock("@/lib/content/source-organization", () => ({ matchesSourceTheme: () => true }));
vi.mock("@/lib/content/source-register", () => ({
  registerSourcesForStaff: () => [{ sources: [{ sourceId: "public-source", title: "Public source", kind: "external", href: "https://example.org" }] }],
  sourceAnchor: () => "public-source",
}));

import ThemeCollectionPage from "./page";

describe("theme collection page", () => {
  it("uses theme-filtered destinations and does not show unpublished items or unavailable surfaces", async () => {
    state.showSources = false; state.showCommunities = false;
    const html = renderToStaticMarkup(await ThemeCollectionPage({ params: Promise.resolve({ theme: "identity" }) }));
    expect(html).toContain("Public course");
    expect(html).toContain("/courses/disability-and-language");
    expect(html).toContain("/learn?theme=identity");
    expect(html).toContain("/audio-library?theme=identity");
    expect(html).not.toContain("Unpublished item");
    expect(html).not.toContain("/learn/sources?theme=identity");
    expect(html).not.toContain("/minnesota-communities");
  });

  it("includes source and community examples only when their surfaces are available", async () => {
    state.showSources = true; state.showCommunities = true;
    const html = renderToStaticMarkup(await ThemeCollectionPage({ params: Promise.resolve({ theme: "identity" }) }));
    expect(html).toContain("Public source");
    expect(html).toContain("/learn/sources?theme=identity#public-source");
    expect(html).toContain("/minnesota-communities");
  });
});
