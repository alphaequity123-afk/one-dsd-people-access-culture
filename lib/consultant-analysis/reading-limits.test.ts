import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { ASK_READING_LIMITS, extractDocumentUpload, withReadingLimits } from "./uploads";

const long = new TextEncoder().encode("Leadership is a relationship. ".repeat(10_000)); // 300,000 characters

describe("reading limits", () => {
  it("keeps the small per-source limit for the consultant tools", async () => {
    await expect(extractDocumentUpload(long, "report.txt")).rejects.toThrow(/too much text/);
  });
  it("lets Ask read a long document whole", async () => {
    const result = await withReadingLimits(ASK_READING_LIMITS, () => extractDocumentUpload(long, "report.txt"));
    expect(result.text.length).toBeGreaterThan(290_000);
  });
  it("still refuses a document beyond what Ask can read", async () => {
    const huge = new TextEncoder().encode("word ".repeat(1_000_000)); // 5 million characters
    await expect(withReadingLimits(ASK_READING_LIMITS, () => extractDocumentUpload(huge, "huge.txt"))).rejects.toThrow(/too much text/);
  });
});
