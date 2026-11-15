import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { needsFullAnswerPath, usedSourceNumbers, visibleFastText, writeFastAnswer } from "./fast-answer";

const stream = (parts: string[]) => {
  const encoder = new TextEncoder();
  const lines = [...parts.map(delta => "data: " + JSON.stringify({ type: "response.output_text.delta", delta }) + "\n\n"), "data: " + JSON.stringify({ type: "response.completed" }) + "\n\n"];
  return new Response(new ReadableStream<Uint8Array>({ start(controller) { for (const line of lines) controller.enqueue(encoder.encode(line)); controller.close(); } }), { status: 200 });
};

afterEach(() => { vi.unstubAllEnvs(); });

describe("the fast answer", () => {
  it("leaves documents and outside research to the full path, and keeps ordinary questions", () => {
    expect(needsFullAnswerPath("Draft a memo about interpreter scheduling")).toBe(true);
    expect(needsFullAnswerPath("Search the web for the newest federal rule")).toBe(true);
    expect(needsFullAnswerPath("Can you export this to Excel?")).toBe(true);
    expect(needsFullAnswerPath("How should I plan an accessible meeting?")).toBe(false);
    expect(needsFullAnswerPath("What is the current policy on interpreters?")).toBe(false);
  });

  it("never shows the closing line that names the passages used", () => {
    expect(visibleFastText("Send materials ahead.\nUSED: 1, 3")).toBe("Send materials ahead.");
    expect(visibleFastText("Send materials ahead.\nUS")).toBe("Send materials ahead.");
    expect(visibleFastText("Send materials ahead.")).toBe("Send materials ahead.");
    expect(usedSourceNumbers("Answer.\nUSED: 1, 3, 9", 3)).toEqual([1, 3]);
    expect(usedSourceNumbers("Answer.\nUSED: none", 3)).toEqual([]);
  });

  it("shows the answer as it is written and returns the passages it relied on", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const shown: string[] = [];
    const fetcher = vi.fn(async () => stream(["Send materials ", "ahead of time.", "\nUS", "ED: 2"])) as unknown as typeof fetch;
    const result = await writeFastAnswer({ question: "How do I prepare?", history: [], sources: [{ id: "a", title: "A", excerpt: "x" }, { id: "b", title: "B", excerpt: "y" }], onText: text => shown.push(text), fetcher });
    expect(result.text).toBe("Send materials ahead of time.");
    expect(result.used).toEqual([2]);
    expect(shown.at(-1)).toBe("Send materials ahead of time.");
    expect(shown.every(text => !text.includes("US"))).toBe(true);
    for (let index = 1; index < shown.length; index++) expect(shown[index].startsWith(shown[index - 1])).toBe(true);
  });

  it("fails loudly so the full path can take over", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    await expect(writeFastAnswer({ question: "q", history: [], sources: [], fetcher: (async () => new Response("no", { status: 500 })) as unknown as typeof fetch })).rejects.toThrow("fast_answer_http_500");
    await expect(writeFastAnswer({ question: "q", history: [], sources: [], fetcher: (async () => stream(["\nUSED: none"])) as unknown as typeof fetch })).rejects.toThrow("fast_answer_empty");
  });
});
