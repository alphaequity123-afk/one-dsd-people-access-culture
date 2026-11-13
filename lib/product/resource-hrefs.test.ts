import { describe, expect, it } from "vitest";
import { canonicalResourceHref, LEGACY_RESOURCE_DESTINATIONS } from "./resource-hrefs";
import { learningStageHref } from "../content/learning-journey";

describe("resource destinations after the layout refactor", () => {
  it.each(Object.entries(LEGACY_RESOURCE_DESTINATIONS))("retains the earlier bookmark %s", (before, after) => {
    expect(canonicalResourceHref(before)).toBe(after);
    expect(canonicalResourceHref(after)).toBe(after);
  });
  it.each(["orientation", "foundations", "intercultural-practice", "application", "systems-practice", "leadership-continuity"])("keeps the %s stage aligned with its current learning level", stage => {
    expect(canonicalResourceHref(`/learn#${stage}`)).toBe(learningStageHref(stage));
  });
  it("preserves working topic anchors, workspace anchors, source footnotes and outside destinations", () => {
    for (const href of ["/learn?theme=structural#start-here", "/my-work?view=workspace#my-path-title", "/source-reading/abc?section=2#footnote-7", "https://example.org/learn#orientation", "#main", "/learn/paths#level-foundations"]) expect(canonicalResourceHref(href)).toBe(href);
    expect(canonicalResourceHref("/learn?view=one_dsd#foundations")).toBe("/learn/paths?view=one_dsd#level-foundations");
  });
});
