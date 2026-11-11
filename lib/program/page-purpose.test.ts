import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import { PAGE_AREAS, PRIMARY_SECTIONS } from "@/lib/program/page-purpose";

it("keeps Support in the main menu, with Ask and Themes and collections one link away", () => {
  expect(PRIMARY_SECTIONS.map(([label]) => label)).toEqual(["Start", "Learn", "Practice", "Support", "One DSD"]);
  expect(PAGE_AREAS.support.links.slice(0, 2)).toEqual([["Support", "/support"], ["Ask", "/ask"]]);
  expect(PAGE_AREAS.learn.links).toContainEqual(["Themes and collections", "/collections"]);
});

it("shows a short menu: Leadership, no Themes and collections or Community Outreach tab", () => {
  const header = readFileSync(path.join(process.cwd(), "components/dsd-program-header.tsx"), "utf8");
  expect(header).toContain(">Leadership</Link>");
  expect(header).not.toContain(">Themes and collections</Link>");
  expect(header).not.toContain(">Community Outreach and Engagement</Link>");
  expect(readFileSync(path.join(process.cwd(), "app/learn/cultural-intelligence/page.tsx"), "utf8")).toContain('href="/community-outreach"');
});

it("orders the landing page: cards, then the finder, then the Ask window, and does not speak as 'us'", () => {
  const home = readFileSync(path.join(process.cwd(), "app/home/page.tsx"), "utf8");
  expect(home.indexOf('className="w doors"')).toBeLessThan(home.indexOf("<HomeTaskFinder />"));
  expect(home.indexOf("<HomeTaskFinder />")).toBeLessThan(home.indexOf("<HomeAsk "));
  expect(home).not.toMatch(/Tell us|we&apos;ll|we'll/);
});
