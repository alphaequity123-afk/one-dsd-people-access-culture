import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import pilot from "@/lib/content/community-research/african-american.json";
import accessData from "@/lib/content/community-research/_minnesota-access.json";
import additions from "@/lib/content/community-collection-additions.json";
import { additionsNotInResearch, communityResearchProblems, minnesotaAccessProblems, selectCommunityResearch, type CommunityResearch, type MinnesotaAccess } from "@/lib/content/community-research-policy";
import { CommunityResearchSections } from "./community-research-sections";

const access = accessData as MinnesotaAccess;
const research = pilot as CommunityResearch;
const minimal = (id: string): CommunityResearch => ({
  communityId: id, people: [], institutions: [],
  disability: { intro: "Background for preparing questions.", questions: ["What words do you use?"], context: [{ heading: "Context", body: ["Sourced context."], sources: [{ label: "Source", href: "https://example.org/a" }] }] },
  organizations: { intro: "Starting points.", sources: [{ label: "Source", href: "https://example.org/a" }], entries: [{ name: "Example", kind: "organization", scope: "minnesota", type: "Group", location: "St. Paul", purpose: "Example purpose.", href: "https://example.org/", checked: "2026-10-30" }] },
  about: { lastChecked: "2026-10-30", sources: [{ label: "Source", href: "https://example.org/a" }] },
});
const headingLevels = (html: string) => [...html.matchAll(/<h([1-6])[\s>]/g)].map(match => Number(match[1]));

describe("community research policy", () => {
  it("accepts the pilot and the shared Minnesota access block", () => {
    expect(communityResearchProblems(pilot, "african-american")).toEqual([]);
    expect(minnesotaAccessProblems(accessData)).toEqual([]);
  });
  it("never accepts research for pages under standing deference", () => {
    for (const id of ["native-american", "tribal-nations", "alaska-native"]) {
      expect(selectCommunityResearch(minimal(id), id)).toBeNull();
    }
  });
  it("refuses wiki links, plain HTTP, drafts, scaffolding and outside-review wording", () => {
    const withIntro = (intro: string) => ({ ...minimal("deaf-deafblind-hard-of-hearing"), organizations: { ...minimal("x").organizations, intro } });
    const id = "deaf-deafblind-hard-of-hearing";
    expect(selectCommunityResearch(minimal(id), id)).not.toBeNull();
    expect(selectCommunityResearch(withIntro("Reviewed in this pass."), id)).toBeNull();
    expect(selectCommunityResearch(withIntro("Prepared with community review."), id)).toBeNull();
    expect(selectCommunityResearch(withIntro("Prepared with paid advisors and co-designers."), id)).toBeNull();
    expect(selectCommunityResearch(withIntro("Community reviewers helped."), id)).toBeNull();
    expect(selectCommunityResearch(withIntro("This section is still being prepared."), id)).toBeNull();
    expect(selectCommunityResearch(withIntro("Details are under review."), id)).toBeNull();
    expect(selectCommunityResearch(withIntro("She was a senior adviser to the governor."), id)).not.toBeNull();
    expect(selectCommunityResearch(withIntro("This community believes one thing."), id)).toBeNull();
    expect(selectCommunityResearch({ ...minimal(id), draftNotes: [] }, id)).toBeNull();
    const link = (href: string) => { const data = minimal(id); data.about.sources = [{ label: "Source", href }]; return data; };
    expect(selectCommunityResearch(link("https://en.wikipedia.org/wiki/Minnesota"), id)).toBeNull();
    expect(selectCommunityResearch(link("http://example.org/"), id)).toBeNull();
  });
  it("refuses the same person or institution in two sections", () => {
    const data = minimal("deaf-deafblind-hard-of-hearing");
    data.institutions = [{ name: "Example", type: "Group", location: "St. Paul", body: ["Text."], connectToWork: "What would you ask?", sources: [{ label: "Source", href: "https://example.org/a" }] }];
    expect(communityResearchProblems(data, data.communityId).join(" ")).toContain("show each person or institution once");
  });
  it("hides additions the pilot covers and leaves other communities alone", () => {
    const addition = additions["african-american"];
    expect(additionsNotInResearch(addition, research)).toEqual({ contributor: false, institution: false, resource: false, supplements: [] });
    const latino = additions.latino;
    expect(additionsNotInResearch(latino, null)).toEqual({ contributor: true, institution: true, resource: true, supplements: latino.supplements ?? [] });
    expect(additionsNotInResearch(latino, research).contributor).toBe(true);
  });
});

describe("CommunityResearchSections", () => {
  it("renders the pilot with headings in order, disclosures, alt text and credit lines", () => {
    const html = renderToStaticMarkup(<CommunityResearchSections research={research} access={access} />);
    const levels = headingLevels(html);
    expect(levels[0]).toBe(2);
    levels.forEach((level, index) => { if (index > 0) expect(level - levels[index - 1]).toBeLessThanOrEqual(1); });
    expect((html.match(/<details/g) ?? []).length).toBeGreaterThan(research.people.length + research.institutions.length);
    expect(html.match(/<summary>/g)?.length).toBe(html.match(/<details/g)?.length);
    const images = [...html.matchAll(/<img [^>]*>/g)].map(match => match[0]);
    expect(images.length).toBe(research.people.filter(person => person.photo).length + 1);
    for (const image of images) expect(image).toMatch(/alt="[^"]{10,}"/);
    expect(html.match(/<figcaption>/g)?.length).toBe(images.length);
    expect(html).toContain("Image source");
    expect(html).toContain("Prepared for One DHS and One DSD People, Access and Culture");
    expect(html).not.toContain("Last checked");
    expect(html).toContain('href="/support/right-person"');
    expect(html).toContain("Who defines disability here?");
    expect(html).toContain("What does the label unlock?");
    expect(html).toContain("Access routes in Minnesota");
    expect(html).not.toMatch(/community review|endorse|verification status|editor's note|wikipedia|\bAI\b/i);
    // Penumbra and the Spokesman-Recorder are pointers in the lists, not second entries.
    expect(html).toContain('href="#research-institution-penumbra-theatre"');
    expect(html).toContain('href="#research-institution-minnesota-spokesman-recorder"');
  });
  it("renders a page with no people, institutions or reading chapters", () => {
    const html = renderToStaticMarkup(<CommunityResearchSections research={minimal("deaf-deafblind-hard-of-hearing")} access={access} />);
    expect(html).not.toContain("research-people");
    expect(html).toContain("Disability and access");
    expect(html).toContain("Organizations and media");
    const levels = headingLevels(html);
    levels.forEach((level, index) => { if (index > 0) expect(level - levels[index - 1]).toBeLessThanOrEqual(1); });
  });
});

const gate = vi.hoisted(() => ({ communityAvailable: true, parentAvailable: true, interculturalAvailable: true }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/lib/product/request-context", () => ({ requestedContentScope: async () => "dsd" }));
vi.mock("@/lib/content/prepare-editable-surface", () => ({ prepareEditableSurface: async (id: string) => ({ available: id === "learn.intercultural" ? gate.interculturalAvailable : gate.parentAvailable, values: {} }) }));
vi.mock("@/lib/content/intercultural-community-list", () => ({
  getAvailableInterculturalCommunities: async () => gate.communityAvailable ? [{ id: "african-american" }, { id: "deaf-deafblind-hard-of-hearing" }, { id: "native-american" }] : [],
}));
vi.mock("./editable-surface", () => ({
  prepareEditableSurface: async () => ({ available: true, canEdit: false, values: {} }),
  EditableSurfaceRegion: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/lib/content/staff-surface-registry", () => ({
  applyCommunityBriefValues: (raw: unknown) => raw,
  communityBriefSurfaceId: (id: string) => `brief.${id}`,
  stringValue: () => "",
}));
vi.mock("./resource-downloads", () => ({ ResourceDownloads: () => null }));
vi.mock("./community-experience-controls", () => ({
  CommunityExperience: ({ brief }: { brief: React.ReactNode }) => <div>{brief}</div>,
  CommunityPractice: () => null,
}));

describe("community page with the database mocked", () => {
  beforeEach(() => { gate.communityAvailable = true; gate.parentAvailable = true; gate.interculturalAvailable = true; });
  const page = async (id: string) => {
    const { CommunityDesignPage } = await import("./community-design-page");
    return renderToStaticMarkup(await CommunityDesignPage({ id }));
  };
  it("shows the pilot beneath the page once, with no duplicate additions", async () => {
    const html = await page("african-american");
    expect(html).toContain('id="research-people"');
    expect(html.indexOf('id="community-history"')).toBeLessThan(html.indexOf('id="research-people"'));
    expect((html.match(/<h4>Toni Stone<\/h4>/g) ?? []).length).toBe(1);
    expect(html).not.toContain("A person to learn about");
    expect(html).not.toContain("Community resource");
    expect(html).toContain("Try it in your work");
  });
  it("withholds research when a publication gate is closed", async () => {
    gate.parentAvailable = false;
    expect(await page("african-american")).not.toContain("research-people");
    gate.parentAvailable = true;
    gate.communityAvailable = false;
    expect(await page("african-american")).not.toContain("research-people");
  });
  it("keeps research and additions when only the intercultural topic is withdrawn", async () => {
    gate.interculturalAvailable = false;
    expect(await page("african-american")).toContain('id="research-people"');
    expect(await page("deaf-deafblind-hard-of-hearing")).toContain('id="community-collection-addition-title"');
  });
  it("withholds additions when the directory or the community is withdrawn", async () => {
    gate.parentAvailable = false;
    expect(await page("deaf-deafblind-hard-of-hearing")).not.toContain('id="community-collection-addition-title"');
    gate.parentAvailable = true;
    gate.communityAvailable = false;
    expect(await page("deaf-deafblind-hard-of-hearing")).not.toContain('id="community-collection-addition-title"');
  });
  it("shows the Deaf page with its own research and no empty history heading", async () => {
    const html = await page("deaf-deafblind-hard-of-hearing");
    expect(html).toContain("<h1>");
    expect(html).toContain("research-people");
    expect(html).not.toContain("community-history");
  });
  it("keeps the Native deference notice and adds no research", async () => {
    const html = await page("native-american");
    expect(html).toContain("defers to the Office of Indian Affairs");
    expect(html).not.toContain("research-people");
    expect(html).not.toContain("research-disability");
  });
});
