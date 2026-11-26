import { describe, expect, it } from "vitest";
import { askPageFor, askPageTitle, cleanAskPageTitle, normalizeAskPath, readAskPage } from "./page-context";

const fakeDocument = (heading: string | null, title = "") => ({
  title,
  querySelector: (selector: string) => (heading !== null && selector.includes("h1") ? { textContent: heading } : null),
}) as unknown as Pick<Document, "querySelector" | "title">;

describe("the page Ask was opened from", () => {
  it("keeps a clean address and title", () => {
    expect(readAskPage({ path: "/minnesota-communities/somali", title: "Somali Minnesotans" })).toEqual({ path: "/minnesota-communities/somali", title: "Somali Minnesotans" });
    expect(readAskPage({ path: "/library/ja-language-access-checklist/", title: "  Language   access\nchecklist " })).toEqual({ path: "/library/ja-language-access-checklist", title: "Language access checklist" });
  });

  it("leaves out the query and fragment, which can carry what someone typed", () => {
    expect(normalizeAskPath("/search?q=my+client+Jane")).toBe("/search");
    expect(normalizeAskPath("/learn#podcast")).toBe("/learn");
  });

  it.each([
    undefined, null, "", "/library", 42, [],
    { path: "/library" },
    { title: "Library" },
    { path: 7, title: "Library" },
    { path: "/library", title: 7 },
    { path: "/library", title: "Library", body: "text typed on the page" },
    { path: "https://example.com/page", title: "Elsewhere" },
    { path: "//example.com/page", title: "Elsewhere" },
    { path: "library", title: "Library" },
    { path: "/library/<script>", title: "Library" },
    { path: "/library", title: "   " },
    { path: "/" + "a".repeat(400), title: "Long" },
    { path: "/library", title: "x".repeat(500) },
  ])("ignores a missing or malformed hint: %j", value => {
    expect(readAskPage(value)).toBeUndefined();
  });

  it("gives no page for Home, Ask itself or a person's own work", () => {
    for (const path of ["/", "/home", "/ask", "/ask/records", "/my-work", "/my-work/plan", "/my-view"]) {
      expect(readAskPage({ path, title: "Anything" }), path).toBeUndefined();
      expect(askPageFor(path, fakeDocument("Anything")), path).toBeUndefined();
    }
    expect(readAskPage({ path: "/homework-guide", title: "Guide" })).toEqual({ path: "/homework-guide", title: "Guide" });
  });

  it("keeps a long title short, without hidden characters", () => {
    const title = cleanAskPageTitle("A​B " + "word ".repeat(60));
    expect(title.length).toBeLessThanOrEqual(161);
    expect(title.endsWith("…")).toBe(true);
    expect(title).not.toContain("​");
  });

  it("names the page by its main heading, or by the browser title without the site name", () => {
    expect(askPageTitle(fakeDocument("Somali Minnesotans", "Somali | One DSD"))).toBe("Somali Minnesotans");
    expect(askPageTitle(fakeDocument(null, "DHS Equity Policy | One DSD People, Access and Culture"))).toBe("DHS Equity Policy");
    expect(askPageFor("/equity-policy", fakeDocument(" ", "DHS Equity Policy | One DSD"))).toEqual({ path: "/equity-policy", title: "DHS Equity Policy" });
    expect(askPageFor("/equity-policy", fakeDocument(null, ""))).toBeUndefined();
  });
});
