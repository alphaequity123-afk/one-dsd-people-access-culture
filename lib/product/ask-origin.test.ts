import { describe, expect, it } from "vitest";
import { withLearningTrailForAsk } from "./ask-origin";
describe("practice to Ask", () => {
  it("preserves a valid learning trail without carrying a question", () => {
    const href = withLearningTrailForAsk("/ask?path=gp-6", { learningPath: "hire-fairly", learningFamily: "managers" });
    const url = new URL(href, "https://example.test");
    expect(url.searchParams.get("path")).toBe("gp-6");
    expect(url.searchParams.get("learningPath")).toBe("hire-fairly");
    expect(url.searchParams.get("learningFamily")).toBe("managers");
    expect(url.searchParams.has("q")).toBe(false);
  });
  it("rejects arbitrary trail values and leaves other links alone", () => {
    expect(withLearningTrailForAsk("/ask?path=gp-6", { learningPath: "https://other.example" })).toBe("/ask?path=gp-6");
    expect(withLearningTrailForAsk("/library", { learningPath: "hire-fairly" })).toBe("/library");
  });
});
