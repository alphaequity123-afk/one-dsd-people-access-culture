import { describe, expect, it } from "vitest";
import { parseEditableSurfaceValues } from "./editable-surface-contract";
import {
  CULTURAL_FRAMEWORKS,
  CULTURAL_INTELLIGENCE_SURFACE,
  CULTURAL_INTELLIGENCE_VISIBLE_FIELDS,
  culturalIntelligenceVisibleText,
} from "./cultural-intelligence-hub";

describe("Cultural Intelligence collection framing", () => {
  it("keeps the legacy publication schema while falling back from retired framing", () => {
    const legacy = {
      ...CULTURAL_INTELLIGENCE_SURFACE.approvedValues,
      scopeLine: "The four CQ® capabilities are the foundation.",
      foundationBook: "David Livermore's book anchors the collection.",
      foundationBody: "One DHS and One DSD share one foundation: careful research on culture.",
      applyRoutine: "The book's routine frames the work.",
    };
    expect(parseEditableSurfaceValues(CULTURAL_INTELLIGENCE_SURFACE, legacy)).toEqual(legacy);
    expect(CULTURAL_INTELLIGENCE_VISIBLE_FIELDS.has("foundationBook")).toBe(false);
    expect(culturalIntelligenceVisibleText("scopeLine", legacy.scopeLine)).toMatch(/range of practices/i);
    expect(culturalIntelligenceVisibleText("foundationBody", legacy.foundationBody)).toMatch(/listening/i);
    expect(culturalIntelligenceVisibleText("applyRoutine", legacy.applyRoutine)).not.toMatch(/book/i);
    expect(culturalIntelligenceVisibleText("intro", "This program is built around CQ.")).not.toMatch(/\bCQ\b/);
  });

  it("preserves unrelated owner wording and presents complementary frameworks", () => {
    expect(culturalIntelligenceVisibleText("intro", "A locally edited introduction.")).toBe("A locally edited introduction.");
    expect(CULTURAL_FRAMEWORKS.map(item => item.id)).toEqual(expect.arrayContaining(["idi", "implicit-bias", "psychological-safety", "person-centered", "accessibility"]));
    expect(CULTURAL_FRAMEWORKS.map(item => item.id)).not.toContain("livermore");
  });
});
