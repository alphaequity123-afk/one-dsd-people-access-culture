import { describe, expect, it } from "vitest";
import { communityAskHref } from "./community-ask";
describe("community brief handoff", () => {
  it("leaves Native community links unchanged", () => {
    expect(communityAskHref("tribal-nations", true)).toBe("/ask");
  });
  it("asks about respectful engagement and preserves the brief and part", () => {
    const url = new URL(communityAskHref("somali", false, "history"), "https://example.test");
    expect(url.pathname).toBe("/ask");
    expect(url.searchParams.get("community")).toBe("somali");
    expect(url.searchParams.get("communityPart")).toBe("history");
    expect(url.searchParams.has("q")).toBe(false);
  });
});
