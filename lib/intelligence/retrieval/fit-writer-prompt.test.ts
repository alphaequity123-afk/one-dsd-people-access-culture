import { describe, expect, it } from "vitest";
import { fitWriterPrompt } from "./brain";

describe("fitWriterPrompt", () => {
  const directory = Array.from({ length: 200 }, (_, i) => ({ href: "/x" + i, label: "y".repeat(100) }));
  const knowledge = Array.from({ length: 14 }, () => ({ text: "k".repeat(4000) }));
  const research = { answer: "r".repeat(30_000), sources: Array.from({ length: 30 }, () => ({ url: "u".repeat(150) })) };
  const build = (d: unknown[], k: unknown[], r: unknown) => JSON.stringify({ d, k, r });
  it("leaves a small prompt alone", () => {
    expect(fitWriterPrompt("s", directory.slice(0, 5), knowledge.slice(0, 1), undefined, build).step).toBe(0);
  });
  it("fits an oversized prompt and keeps knowledge and research", () => {
    const { user, step } = fitWriterPrompt("s", directory, knowledge, research, build, 50_000);
    expect(step).toBeGreaterThan(0);
    expect(Buffer.byteLength(user)).toBeLessThanOrEqual(50_000);
    const parsed = JSON.parse(user);
    expect(parsed.k.length).toBe(14);
    expect(parsed.r.answer.length).toBeGreaterThan(5000);
  });
});
