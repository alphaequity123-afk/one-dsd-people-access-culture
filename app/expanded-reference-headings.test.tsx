import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
vi.mock("@/components/app-link", () => ({ default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>, SourceLink: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a> }));
vi.mock("@/components/multimedia/engagement-reference-map", () => ({ EngagementReferenceMap: () => null }));
vi.mock("@/components/resource-downloads", () => ({ ResourceDownloads: () => null }));
vi.mock("@/components/ui", () => ({ PageIntro: ({ title }: { title: string }) => <h1>{title}</h1> }));
import TeamKitsPage from "./team-kits/page";
import UnderstandingDhsPage from "./understanding-dhs/page";
afterEach(cleanup);

describe("expanded reference-page heading hierarchy", () => {
  it.each([["Team kits", TeamKitsPage], ["Understanding DHS", UnderstandingDhsPage]] as const)("gives %s topic headings a parent level without changing disclosure controls", (_title, Page) => {
    const { container } = render(<Page />);
    for (const disclosure of container.querySelectorAll("details")) disclosure.open = true;
    const headings = [...container.querySelectorAll("h1,h2,h3,h4,h5,h6")];
    expect(headings[0].tagName).toBe("H1");
    let previous = 0;
    for (const heading of headings) {
      const level = Number(heading.tagName.slice(1));
      expect(level, heading.textContent || "heading").toBeLessThanOrEqual(previous + 1);
      previous = level;
    }
    const childHeadings = container.querySelectorAll("h3");
    expect(childHeadings.length).toBeGreaterThan(0);
    for (const heading of childHeadings) {
      const parent = heading.closest("details");
      const summary = parent?.querySelector(":scope > summary");
      expect(summary?.querySelector("h2")).toBeTruthy();
      expect((summary?.querySelector("h2") as HTMLElement).style.fontSize).toBe("inherit");
    }
  });
});
