import { describe, expect, it } from "vitest";
import { screenConnections } from "./screen-connections";

describe("connected pages for Ask", () => {
  it("points a Toolkit lesson to its step in the tool", () => {
    const [link] = screenConnections("/courses/dhs-equity-analysis-toolkit/dhs-equity-analysis-toolkit-5");
    expect(link.href).toBe("/equity-review/toolkit");
    expect(link.label).toContain("Data");
  });
  it("points the tool to a lesson for each of the six steps and preparation", () => {
    expect(screenConnections("/equity-review/toolkit")).toHaveLength(7);
  });
  it("points community briefs to the results and engagement lessons", () => {
    expect(screenConnections("/minnesota-communities/somali").map(link => link.label).join(" ")).toMatch(/results[\s\S]*Engaging/);
  });
  it("adds nothing for unrelated pages", () => {
    expect(screenConnections("/learn/leadership")).toEqual([]);
  });
});
