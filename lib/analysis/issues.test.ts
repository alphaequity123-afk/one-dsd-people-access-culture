// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ANALYSIS_LIMITS, analysisRequestSchema } from "./contract";
import { plainIssue } from "./issues";

const source = (overrides: Record<string, unknown> = {}) => ({ id: "doc-1", title: "Program description", text: "The notice is mailed.", ...overrides });
const first = (body: unknown) => {
  const parsed = analysisRequestSchema.safeParse(body);
  if (parsed.success) throw new Error("expected a validation problem");
  return plainIssue(parsed.error.issues[0]);
};

describe("plainIssue", () => {
  it("names the source by its position and says what to do, never the library's own wording", () => {
    expect(first({ instrumentId: "equity-analysis", sources: [source(), source({ id: "doc-2", title: "   " })] })).toBe("Give source 2 a title.");
    expect(first({ instrumentId: "equity-analysis", sources: [source({ text: "" })] })).toBe("Source 1 has no text. Paste the text or remove the source.");
    expect(first({ instrumentId: "equity-analysis", sources: [source(), source({ id: "doc-2", text: "x".repeat(ANALYSIS_LIMITS.sourceCharacters + 1) })] })).toBe("Source 2 holds more than 50,000 characters; shorten it.");
    expect(first({ instrumentId: "equity-analysis", sources: [source({ title: "t".repeat(ANALYSIS_LIMITS.titleCharacters + 1) })] })).toBe("The title of source 1 is longer than 300 characters; shorten it.");
  });
  it("keeps the request-level sentences", () => {
    expect(first({ instrumentId: "equity-analysis", sources: [] })).toBe("Add at least one source to analyze.");
    expect(first({ instrumentId: "something-else", sources: [source()] })).toBe("Choose one of the analysis types on the page.");
    expect(first({ instrumentId: "equity-analysis", sources: [source(), source()] })).toBe("Each source needs its own id.");
    expect(first({ instrumentId: "equity-analysis", sources: [source()], context: "c".repeat(ANALYSIS_LIMITS.contextCharacters + 1) })).toBe("Shorten what you want to know; it holds more than 2,000 characters.");
    expect(first({ instrumentId: "equity-analysis", sources: [source()], communityId: "Not Valid" })).toBe("The community was not recognized.");
    expect(plainIssue(undefined)).toBe("The request was not complete.");
  });
  it("never repeats the submitted text", () => {
    const message = first({ instrumentId: "equity-analysis", sources: [source({ title: "", text: "Secret words about a person" })] });
    expect(message).not.toContain("Secret");
    expect(message).not.toMatch(/expected|>=|<=|string/);
  });
});
