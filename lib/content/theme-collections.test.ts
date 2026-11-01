import { describe, expect, it } from "vitest";
import type { ContentItem } from "./types";
import { featuredThemeItems, findTheme, THEME_CONTEXT_LINKS } from "./theme-collections";
import { RESOURCE_THEMES } from "./resource-organization";

function item(id: string, status: ContentItem["status"] = "approved"): ContentItem {
  return { id, title: id, type: "learning_module", authority: "learning", layer: "L2", summary: "", body: [], nextActions: [], tags: [], intents: [], owner: "test", reviewDate: "", status, scope: "agencywide", accessibility: "pending", version: "1" };
}

describe("application-wide theme collections", () => {
  it("uses the existing eight theme identifiers and has contextual links for each", () => {
    expect(RESOURCE_THEMES).toHaveLength(8);
    expect(Object.keys(THEME_CONTEXT_LINKS).sort()).toEqual(RESOURCE_THEMES.map(theme => theme.id).sort());
    expect(findTheme("identity")?.title).toContain("Culture");
    expect(findTheme("unknown")).toBeUndefined();
    for (const links of Object.values(THEME_CONTEXT_LINKS)) for (const link of links) expect(link.href).toMatch(/^\/(?!\/)/);
  });

  it("retains multiple subject memberships without duplicating an entry, and excludes nonpublic status", () => {
    const shared = item("course-disability-and-language");
    const retired = item("course-div-f01-white-privilege", "retired");
    const draft = item("course-div-f01-white-privilege", "under_review");
    const rows = [shared, shared, retired, draft];
    for (const theme of ["identity", "access", "disability"] as const) {
      expect(featuredThemeItems(rows, theme).learning.map(entry => entry.id)).toEqual([shared.id]);
    }
  });
});
