import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import { PAGE_AREAS, PRIMARY_SECTIONS } from "@/lib/program/page-purpose";

it("shows Home plus the five v2 pillars, with Ask and Themes and collections one link away", () => {
  expect(PRIMARY_SECTIONS.map(([label]) => label)).toEqual(["Practice", "Leadership", "Communities", "Knowledge", "Charter"]);
  for (const [, href] of PRIMARY_SECTIONS) expect(href === "/practice" || existsSync(path.join(process.cwd(), "app", href, "page.tsx")), href).toBe(true);
  expect(PAGE_AREAS.support.links.slice(0, 2)).toEqual([["Support", "/support"], ["Ask", "/ask"]]);
  expect(PAGE_AREAS.learn.links).toContainEqual(["Themes and collections", "/collections"]);
});

it("shows a short menu: no Themes and collections or Community Outreach tab", () => {
  const header = readFileSync(path.join(process.cwd(), "components/dsd-program-header.tsx"), "utf8");
  expect(header).toContain(">Home</Link>");
  expect(header).not.toContain(">Themes and collections</Link>");
  expect(header).not.toContain(">Community Outreach and Engagement</Link>");
  expect(readFileSync(path.join(process.cwd(), "app/learn/cultural-intelligence/page.tsx"), "utf8")).toContain('href="/community-outreach"');
});

it("keeps the live One DSD landing page on Home and does not speak as 'us'", () => {
  const home = readFileSync(path.join(process.cwd(), "app/home/page.tsx"), "utf8");
  // Owner decision 2026-11-25: Home is the live One DSD landing page; Ask opens from the banner on every page.
  expect(home.indexOf("<HomeTaskChips")).toBeLessThan(home.indexOf('aria-labelledby="pilot-pathways"'));
  expect(home).toContain("One DSD Leadership");
  expect(home).not.toMatch(/Tell us|we&apos;ll|we'll/);
});
