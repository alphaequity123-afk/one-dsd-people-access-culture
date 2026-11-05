import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { staffWriteClosedResponse } from "@/lib/product/staff-lock";
import { cloneAgentsEnabled } from "@/lib/intelligence/clone/config";
import { readBoundedJson } from "@/lib/http/request";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { consumeRequestLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { paused } from "@/lib/intelligence/orchestrator";
import { admitRun, finishRun, openLedger } from "@/lib/intelligence/clone/ledger";
import type { DatabaseSync } from "node:sqlite";
import { analysisRequestSchema } from "@/lib/analysis/contract";
import { plainIssue } from "@/lib/analysis/issues";
import { analyze, isRefusal, promptTooLarge } from "@/lib/analysis/service";

export const maxDuration = 180;
export const runtime = "nodejs";

/**
 * Analyze a document. Nothing in the request body is stored, logged or written anywhere:
 * sources travel with the request and the result goes back to the browser only.
 */
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
const KEEP_ALIVE_MS = 10_000;
const BODY_LIMIT_BYTES = 1_000_000;
const RATE_LIMIT = { scope: "staff-analyze", limit: 10, windowSeconds: 600 } as const;
const FAILED_MESSAGE = "The analysis could not be finished. Please try again in a few minutes, or work through the questions on the page yourself.";

/**
 * An analysis can take over 30 seconds, and some networks cut a silent connection at about that point.
 * Spaces are valid before JSON, so sending them keeps the connection open and the body still parses.
 * The status is sent first, so a failure at this stage is reported as { error } in the body.
 * Whatever the work does, the keep-alive stops and the stream closes: a rejected promise is reported
 * as { error }, and a client that goes away stops the keep-alive at once.
 */
function patientJson(work: () => Promise<unknown>) {
  const encoder = new TextEncoder();
  let open = true;
  let beat: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (text: string) => {
        if (!open) return;
        try { controller.enqueue(encoder.encode(text)); } catch { open = false; }
      };
      const close = () => {
        if (beat) { clearInterval(beat); beat = undefined; }
        if (!open) return;
        open = false;
        try { controller.close(); } catch { /* already closed by the client */ }
      };
      send(" ");
      beat = setInterval(() => send(" "), KEEP_ALIVE_MS);
      void work()
        .then(body => JSON.stringify(body), () => JSON.stringify({ error: FAILED_MESSAGE }))
        .then(text => { send(text); close(); }, () => close());
    },
    cancel() {
      open = false;
      if (beat) { clearInterval(beat); beat = undefined; }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store, no-transform", "x-accel-buffering": "no" } });
}

/** The ledger never turns a finished analysis into a failed response: a write that fails is logged by name only. */
function settleRun(db: DatabaseSync, runId: string, status: "completed" | "refused" | "failed") {
  try { finishRun(db, runId, status); } catch (error) { console.error("analyze_ledger_failed", error instanceof Error ? error.name : "unknown"); }
}
function closeLedger(db: DatabaseSync) {
  try { db.close(); } catch (error) { console.error("analyze_ledger_failed", error instanceof Error ? error.name : "unknown"); }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request)) return json({ error: "Please use Analyze a document from its page on this site." }, 403);
  if (await paused()) return json({ error: "Analyze a document is paused for now. You can still browse resources." }, 503);
  if (!cloneAgentsEnabled()) return staffWriteClosedResponse();
  const body = await readBoundedJson(request, BODY_LIMIT_BYTES);
  if (!body.ok) return json({ error: body.message }, body.status);
  const input = analysisRequestSchema.safeParse(body.value);
  if (!input.success) return json({ error: plainIssue(input.error.issues[0]) }, 400);
  // A request the model adapters would refuse for size can never succeed, so it is answered
  // before the request limit and the ledger are charged.
  const tooLarge = promptTooLarge(input.data);
  if (tooLarge) return json({ error: tooLarge }, 413);
  const limit = await consumeRequestLimit(request, RATE_LIMIT);
  if (!limit.allowed) return NextResponse.json({ error: "Please wait a few minutes before analyzing another document." }, { status: 429, headers: rateLimitHeaders(limit) });
  const db = openLedger();
  let id: string | null;
  try {
    id = admitRun(db);
  } catch (error) {
    closeLedger(db);
    console.error("analyze_failed", error instanceof Error ? error.name : "unknown");
    return json({ error: FAILED_MESSAGE }, 503);
  }
  if (!id) {
    closeLedger(db);
    return json({ error: "Analyze a document has reached its limit for now. Please try again a little later." }, 429);
  }
  const runId = id;
  const data = input.data;
  return patientJson(async () => {
    try {
      const outcome = await analyze(data);
      if (await paused()) { settleRun(db, runId, "failed"); return { error: "Analyze a document was paused, so no result was shared." }; }
      if (isRefusal(outcome)) { settleRun(db, runId, "refused"); return outcome; }
      settleRun(db, runId, "completed");
      return outcome;
    } catch (error) {
      console.error("analyze_failed", error instanceof Error ? error.name : "unknown");
      settleRun(db, runId, "failed");
      return { error: FAILED_MESSAGE };
    } finally { closeLedger(db); }
  });
}
