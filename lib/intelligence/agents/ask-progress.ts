/**
 * What a person can be shown while an answer is being prepared.
 * These carry no record of the person: they exist only for the open page.
 */
import type { AskLiveEvent, AskStage } from "@/lib/ask/progress-stream";

export type { AskStage };

/**
 * A stage that is under way; the answer so far, in full, each one replacing the last;
 * or a reset, which sets aside what has been shown because the answer is being written again.
 */
export type AskProgress = AskLiveEvent;

export type AskProgressSink = (event: AskProgress) => void;

/** Calls the sink without letting a closed page or a display error interrupt the answer. */
export function reportProgress(sink: AskProgressSink | undefined, event: AskProgress): void {
  if (!sink) return;
  try { sink(event); } catch { /* The page went away; the answer continues and is recorded as usual. */ }
}
