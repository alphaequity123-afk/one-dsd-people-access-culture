import { describe, expect, it } from "vitest";
import { readAskProgress, stageLine, type AskLiveEvent } from "./progress-stream";

function body(text: string, chunkSize = 11): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream({ start(controller) {
    for (let at = 0; at < bytes.length; at += chunkSize) controller.enqueue(bytes.slice(at, at + chunkSize));
    controller.close();
  } });
}
const lines = (...events: unknown[]) => events.map(event => JSON.stringify(event) + "\n").join("");

describe("following an answer as it is prepared", () => {
  it("passes on progress in order and returns the finished answer", async () => {
    const seen: AskLiveEvent[] = [];
    const result = await readAskProgress(body(lines(
      { type: "wait" }, { type: "stage", stage: "reading" }, { type: "stage", stage: "writing" },
      { type: "text", text: "Send materials" }, { type: "text", text: "Send materials ahead — café ✅" }, { type: "wait" },
      { type: "stage", stage: "finishing" }, { type: "done", result: { kind: "answer", answer: { shortAnswer: "Send materials ahead — café ✅" } } },
    )), event => seen.push(event));
    expect(seen).toEqual([
      { type: "stage", stage: "reading" }, { type: "stage", stage: "writing" },
      { type: "text", text: "Send materials" }, { type: "text", text: "Send materials ahead — café ✅" }, { type: "stage", stage: "finishing" },
    ]);
    expect(result).toEqual({ kind: "answer", answer: { shortAnswer: "Send materials ahead — café ✅" } });
  });
  it("returns a failure sent as the finished result, so the page can show it", async () => {
    expect(await readAskProgress(body(lines({ type: "wait" }, { type: "done", result: { error: "Ask could not finish this answer." } })), () => undefined))
      .toEqual({ error: "Ask could not finish this answer." });
  });
  it("skips anything it does not recognise", async () => {
    const seen: AskLiveEvent[] = [];
    const result = await readAskProgress(body("not json\n" + lines({ type: "stage", stage: "unknown" }, { type: "text" }, 7, { type: "reset" }, { type: "done", result: 1 })), event => seen.push(event));
    expect(seen).toEqual([{ type: "reset" }]);
    expect(result).toBe(1);
  });
  it("treats a connection that closes early as an error", async () => {
    await expect(readAskProgress(body(lines({ type: "stage", stage: "writing" }, { type: "text", text: "Half an ans" })), () => undefined)).rejects.toThrow("ask_progress_incomplete");
  });
  it("reads a last line that has no line ending", async () => {
    expect(await readAskProgress(body(JSON.stringify({ type: "done", result: "ok" })), () => undefined)).toBe("ok");
  });
  it("describes each stage in plain words", () => {
    for (const stage of ["reading", "checking", "writing", "finishing"] as const) expect(stageLine(stage)).toMatch(/^[A-Z][a-z’ ]+…$/);
  });
});
