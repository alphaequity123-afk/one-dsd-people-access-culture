import { describe, expect, it } from "vitest";
import { sseEvents } from "./sse";

function stream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({ start(controller) { for (const chunk of chunks) controller.enqueue(encoder.encode(chunk)); controller.close(); } });
}
async function all(chunks: string[]) {
  const out: Array<{ event: string; data: string }> = [];
  for await (const event of sseEvents(stream(chunks))) out.push(event);
  return out;
}

describe("reading a streamed reply", () => {
  it("reads events split across chunks, with either line ending", async () => {
    expect(await all(["event: a\ndata: {\"x\":", "1}\n\nda", "ta: two\r\n\r\n: comment\n\ndata: three"])).toEqual([
      { event: "a", data: "{\"x\":1}" }, { event: "message", data: "two" }, { event: "message", data: "three" },
    ]);
  });
  it("joins several data lines and keeps characters that span chunks", async () => {
    const bytes = new TextEncoder().encode("data: café\ndata: second\n\n");
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(bytes.slice(0, 10)); controller.enqueue(bytes.slice(10)); controller.close(); } });
    const out: string[] = [];
    for await (const event of sseEvents(body)) out.push(event.data);
    expect(out).toEqual(["café\nsecond"]);
  });
});
