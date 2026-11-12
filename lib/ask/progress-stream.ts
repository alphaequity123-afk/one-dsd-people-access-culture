/**
 * How an open Ask page follows an answer while it is prepared: one line of JSON at a time.
 * Shared by the server, which writes the lines, and the page, which reads them.
 */
export const ASK_PROGRESS_TYPE = "application/x-ndjson";

export type AskStage = "reading" | "checking" | "writing" | "finishing";
export type AskLiveEvent =
  | { type: "stage"; stage: AskStage }
  | { type: "text"; text: string }
  | { type: "reset" };

const STAGES: readonly string[] = ["reading", "checking", "writing", "finishing"];

/**
 * Read the lines as they arrive. Progress is passed on; the finished answer is returned.
 * A connection that closes before the finished answer arrives is an error, so the page
 * can say so and offer to try again.
 */
export async function readAskProgress(body: ReadableStream<Uint8Array>, onEvent: (event: AskLiveEvent) => void): Promise<unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: { value: unknown } | undefined;
  const take = (line: string) => {
    if (!line.trim()) return;
    let event: { type?: unknown; stage?: unknown; text?: unknown; result?: unknown };
    try { event = JSON.parse(line); } catch { return; }
    if (!event || typeof event !== "object") return;
    if (event.type === "done") result = { value: event.result };
    else if (event.type === "stage" && typeof event.stage === "string" && STAGES.includes(event.stage)) onEvent({ type: "stage", stage: event.stage as AskStage });
    else if (event.type === "text" && typeof event.text === "string") onEvent({ type: "text", text: event.text });
    else if (event.type === "reset") onEvent({ type: "reset" });
  };
  try {
    for (;;) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      for (let end = buffer.indexOf("\n"); end >= 0; end = buffer.indexOf("\n")) {
        take(buffer.slice(0, end));
        buffer = buffer.slice(end + 1);
      }
      if (done) { take(buffer); break; }
    }
  } finally {
    reader.releaseLock();
  }
  if (!result) throw new Error("ask_progress_incomplete");
  return result.value;
}

/** A short, plain line for what is under way. */
export function stageLine(stage: AskStage): string {
  if (stage === "checking") return "Checking public sources…";
  if (stage === "writing") return "Writing your answer…";
  if (stage === "finishing") return "Adding sources and next steps…";
  return "Looking through the program’s material…";
}
