// The long catalog pages show one page of compact rows at a time. These tests walk every page of
// each catalog and check that every entry is still reachable, that pages hold no more rows than
// promised, and that the list is searchable and announces its count.
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/components/resource-downloads", () => ({ ResourceDownloads: ({ id }: { id: string }) => <span data-downloads={id} /> }));
vi.mock("@/components/resource-format-links", () => ({ ResourceFormatLinks: () => null }));
vi.mock("@/components/program-context", () => ({ ProgramContextNote: () => null }));
vi.mock("@/lib/product/request-context", () => ({ requestedContentScope: async () => "dsd" }));
vi.mock("@/lib/content/courses/published", () => ({ courseLink: (href: string) => href }));
vi.mock("@/components/editable-surface", () => ({
  prepareEditableSurface: async () => ({ available: true, values: { introKicker: "Learning and resources", introTitle: "Research and sources" } }),
  EditableSurfaceRegion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import PoliciesPage from "@/app/community-outreach/policies/page";
import SourcesPage from "@/app/learn/sources/page";
import ReadingsPage from "@/app/learn/readings/page";
import CountyAgenciesPage from "@/app/community-outreach/county-agencies/page";
import OrganizationDirectory from "@/app/community-outreach/organizations/page";
import { getPoliciesData, policyHref } from "@/lib/content/hub/dsd-policies";
import { registerSourcesForStaff, sourceAnchor } from "@/lib/content/source-register";
import { unavailableExternalUrl } from "@/lib/content/external-readings";
import { readings, readingHref } from "@/lib/content/reading-collection";
import { getCountyAgencies } from "@/lib/content/hub/county-agencies";
import { ORGANIZATIONS, organizationHref } from "@/lib/content/hub/organizations";

type Page = (props: { searchParams: Promise<Record<string, string>> }) => Promise<ReactElement>;

async function render(page: Page, params: Record<string, string> = {}): Promise<string> {
  return renderToStaticMarkup(await page({ searchParams: Promise.resolve(params) }));
}

function decode(html: string): string {
  return html.replace(/&amp;/g, "&");
}

/** Render every page of a catalog; return the HTML of each. */
async function allPages(page: Page, params: Record<string, string> = {}): Promise<string[]> {
  const first = await render(page, params);
  const count = /Showing \d+–\d+ of (\d+)/.exec(first);
  expect(count, "the result count is shown").toBeTruthy();
  const pages = [first];
  for (let n = 2; ; n += 1) {
    if (!decode(pages[pages.length - 1]).includes(`page=${n}`)) break;
    pages.push(await render(page, { ...params, page: String(n) }));
  }
  return pages;
}

function countOf(html: string, needle: RegExp): number {
  return (html.match(needle) ?? []).length;
}

describe("paged catalog pages", () => {
  it("policies: 12 per page, every policy reachable through its own page link", async () => {
    const pages = await allPages(PoliciesPage as Page);
    const policies = getPoliciesData().policies;
    expect(pages.length).toBe(Math.ceil(policies.length / 12));
    for (const html of pages) expect(countOf(html, /<li[^>]*id="policy-/g)).toBeLessThanOrEqual(12);
    const all = pages.join("\n");
    for (const p of policies) expect(all, p.id).toContain(`href="${policyHref(p.id)}"`);
    expect(pages[0]).toContain('role="status"');
    expect(pages[0]).toContain(`Showing 1–12 of ${policies.length} policies`);
    expect(pages[0]).toMatch(/<label[^>]*for="policy-q"/);
    expect(pages[0]).toContain('aria-current="page"');
    expect(pages[0]).toContain('data-downloads="policies"');
    for (const kind of getPoliciesData().kinds) expect(pages[0]).toContain(kind.intro.replace(/&/g, "&amp;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;"));
  });

  it("policies: search and filters narrow the list and keep the choices in page links", async () => {
    const html = await render(PoliciesPage as Page, { q: "interpreter" });
    expect(html).toMatch(/matching polic/);
    const legacy = await render(PoliciesPage as Page, { search: "interpreter" });
    expect(legacy).toContain(/Showing [^<]+/.exec(html)![0]);
    const statutes = await allPages(PoliciesPage as Page, { kind: "statute" });
    const ids = getPoliciesData().policies.filter(p => p.kind === "statute").map(p => p.id);
    const all = statutes.join("\n");
    for (const id of ids) expect(all).toContain(`href="${policyHref(id)}"`);
    expect(decode(statutes[0])).toContain("kind=statute&page=2");
  });

  it("sources: 12 per page, every available outside source reachable, and links to one source find its page", async () => {
    const outside = registerSourcesForStaff().flatMap(g => g.sources).filter(s => s.kind === "external" && s.href);
    const expected = outside.filter(s => !unavailableExternalUrl(s.href!));
    const pages = await allPages(SourcesPage as Page);
    expect(pages.length).toBe(Math.ceil(expected.length / 12));
    for (const html of pages) expect(countOf(html, /<li[^>]*id="source-/g)).toBeLessThanOrEqual(12);
    const all = pages.join("\n");
    for (const s of expected) expect(all, s.sourceId).toContain(`id="${sourceAnchor(s)}"`);
    for (const s of outside.filter(s => unavailableExternalUrl(s.href!))) expect(all, s.sourceId).not.toContain(`id="${sourceAnchor(s)}"`);
    const last = expected[expected.length - 1];
    const found = await render(SourcesPage as Page, { find: sourceAnchor(last) });
    expect(found).toContain(`id="${sourceAnchor(last)}"`);
    expect(pages[0]).toContain('data-downloads="register"');
    expect(pages[0]).toMatch(/<label[^>]*for="source-q"/);
    expect(pages[0]).toContain('role="status"');
  });

  it("readings: 12 per page, every book reachable through its own page, and the theme filter still works", async () => {
    const pages = await allPages(ReadingsPage as Page);
    expect(pages.length).toBe(Math.ceil(readings.length / 12));
    const all = pages.join("\n");
    for (const book of readings) expect(all, book.id).toContain(`href="${readingHref(book.id)}"`);
    for (const html of pages) expect(countOf(html, /<h2/g)).toBeLessThanOrEqual(2);
    const theme = readings.find(book => book.themes.length)!.themes[0];
    const themed = await allPages(ReadingsPage as Page, { theme });
    const themedAll = themed.join("\n");
    for (const book of readings.filter(b => b.themes.includes(theme))) expect(themedAll).toContain(`href="${readingHref(book.id)}"`);
    expect(decode(themed[0])).toContain(`theme=${theme}`);
  });

  it("county agencies: every county and its contact details reachable, with letter jumps and links to one county", async () => {
    const data = getCountyAgencies();
    const pages = await allPages(CountyAgenciesPage as Page);
    const all = pages.join("\n");
    for (const c of data.counties) {
      expect(all, c.county).toContain(`id="county-${c.fips}"`);
      expect(all).toContain(c.sourceUrl.replace(/&/g, "&amp;"));
      if (c.phone) expect(all).toContain(c.phone);
    }
    for (const html of pages) expect(countOf(html, /id="county-\d/g)).toBeLessThanOrEqual(12);
    const last = data.counties.slice().sort((a, b) => a.county.localeCompare(b.county))[data.counties.length - 1];
    expect(await render(CountyAgenciesPage as Page, { find: `county-${last.fips}` })).toContain(`id="county-${last.fips}"`);
    const letter = await render(CountyAgenciesPage as Page, { letter: "a" });
    expect(letter).toContain("Aitkin");
    expect(letter).not.toContain(">Wright<");
    expect(pages[0]).toContain('data-downloads="county-agencies"');
  });

  it("organizations: a compact list, every organization reachable through its own page", async () => {
    const pages = await allPages(OrganizationDirectory as Page);
    const all = pages.join("\n");
    for (const org of ORGANIZATIONS) expect(all, org.slug).toContain(`href="${organizationHref(org.slug)}"`);
    for (const html of pages) expect(countOf(html, /<h2/g)).toBeLessThanOrEqual(2);
    expect(pages[0]).toContain('data-downloads="organizations"');
    expect(pages[0]).toContain('role="status"');
  });
});
