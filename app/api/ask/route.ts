import type { NextRequest } from "next/server";
import { DEFAULT_PRODUCT_CONTEXT } from "@/lib/product/federation";
import { staffWriteClosedResponse } from "@/lib/product/staff-lock";
import { NextResponse } from "next/server";
import { z } from "zod";
import { cloneAgentsEnabled } from "@/lib/intelligence/clone/config";
import { readBoundedJson } from "@/lib/http/request";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { consumeRequestLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { ask, paused } from "@/lib/intelligence/orchestrator";
import { toStaffAskResult } from "@/lib/intelligence/agents/ask";
import { PracticeArtifactSchema } from "@/lib/content/practice-artifact";
import { AskWorkProductSchema } from "@/lib/ask/work-product";
import { admitRun, finishRun, openLedger } from "@/lib/intelligence/clone/ledger";
import type { AskProgress, AskProgressSink } from "@/lib/intelligence/agents/ask-progress";
import { ASK_PROGRESS_TYPE } from "@/lib/ask/progress-stream";

export const maxDuration = 180;
export const runtime = "nodejs";
const Input = z.object({
  question: z.string().trim().min(1).max(4000),
  responseMode: z.enum(["text", "spoken"]).optional(),
  mode: z.enum(["question", "review"]).optional(),
  pathId: z.string().regex(/^[a-z0-9-]{1,80}$/).optional(),
  contextPreference: z.enum(["one_dhs", "one_dsd"]).optional(),
  researchMode: z.enum(["auto", "program_only", "web_results", "current_web", "deep_research"]).optional(),
  history: z.array(z.object({ question: z.string().max(1000), answer: z.string().max(2500) }).strict()).max(4).optional(),
  priorArtifact: PracticeArtifactSchema.optional(),
  priorWorkProduct: AskWorkProductSchema.optional(),
  /** Ask Live: what is on the person's screen. Used for this answer only, never stored. */
  screen: z.object({
    path: z.string().regex(/^\/\S{0,299}$/),
    title: z.string().max(300),
    focus: z.string().max(1500).optional(),
    text: z.string().max(6000).optional(),
  }).strict().optional(),
}).strict();
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
const KEEP_ALIVE_MS = 10_000;

/**
 * An answer can take over 30 seconds, and some networks cut a silent connection at about that point.
 * Spaces are valid before JSON, so sending them keeps the connection open and the body still parses.
 * The status is sent first, so a failure at this stage is reported as { error } in the body.
 */
function patientJson(work: () => Promise<unknown>) {
  const encoder = new TextEncoder();
  let open = true;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (text: string) => {
        if (!open) return;
        try { controller.enqueue(encoder.encode(text)); } catch { open = false; }
      };
      send(" ");
      const beat = setInterval(() => send(" "), KEEP_ALIVE_MS);
      void work().then(body => {
        clearInterval(beat);
        send(JSON.stringify(body));
        if (open) { open = false; controller.close(); }
      });
    },
    cancel() { open = false; },
  });
  return new Response(stream, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store, no-transform", "x-accel-buffering": "no" } });
}

/**
 * The same patient connection, for a page that can show progress: one line of JSON at a time.
 * The page sees which part of the work is under way and the answer as it is written, and the
 * last line carries the finished, checked answer. Nothing here is recorded.
 */
function progressLines(work: (report: AskProgressSink) => Promise<unknown>) {
  const encoder = new TextEncoder();
  let open = true;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const line = (value: AskProgress | { type: "wait" } | { type: "done"; result: unknown }) => {
        if (!open) return;
        try { controller.enqueue(encoder.encode(JSON.stringify(value) + "\n")); } catch { open = false; }
      };
      line({ type: "wait" });
      const beat = setInterval(() => line({ type: "wait" }), KEEP_ALIVE_MS);
      void work(line).then(result => {
        clearInterval(beat);
        line({ type: "done", result });
        if (open) { open = false; controller.close(); }
      });
    },
    // The page went away. The answer is still finished and recorded as usual; nothing more is sent.
    cancel() { open = false; },
  });
  return new Response(stream, { headers: { "content-type": `${ASK_PROGRESS_TYPE}; charset=utf-8`, "cache-control": "no-store, no-transform", "x-accel-buffering": "no" } });
}

/** Owner-authorized clone pilot; the other deployments remain browse-only. */
export async function POST(request: NextRequest) {
  if (!cloneAgentsEnabled()) return staffWriteClosedResponse();
  if (!isSameOriginMutation(request)) return json({ error: "Please use Ask from its page on this site." }, 403);
  if (await paused()) return json({ error: "Ask is paused for now. You can still browse resources." }, 503);
  const body = await readBoundedJson(request, 128_000);
  if (!body.ok) return json({ error: body.message }, body.status);
  const input = Input.safeParse(body.value);
  if (!input.success) return json({ error: "Please shorten your question or start a new conversation." }, 400);
  const limit = await consumeRequestLimit(request, { scope: "staff-ask", limit: 120, windowSeconds: 600 });
  if (!limit.allowed) return NextResponse.json({ error: "Please wait a moment before asking another question." }, { status: 429, headers: rateLimitHeaders(limit) });
  const db = openLedger();
  let id: string | null;
  try {
    id = await admitRun(db);
  } catch (error) {
    db.close();
    console.error("ask_route_failed", error instanceof Error ? `${error.name}: ${error.message}` : "unknown");
    return json({ error: "Ask could not finish this answer. Please try again later, or browse the Library." }, 503);
  }
  if (!id) {
    db.close();
    return json({ error: "Ask has reached its limit for now. You can browse resources, or try again a little later." }, 429);
  }
  const runId = id;
  const answer = async (onProgress?: AskProgressSink) => {
    try {
      const result = await ask({ ...input.data, contextPreference: DEFAULT_PRODUCT_CONTEXT, researchMode: input.data.researchMode ?? "auto", cloneRunId: runId, onProgress }, "staff", runId);
      if (await paused()) { await finishRun(db, runId, "failed"); return { error: "Ask was paused, so no answer was shared." }; }
      if (result.kind === "refusal") { await finishRun(db, runId, "refused"); return toStaffAskResult(result); }
      const answer = result.answer;
      if (answer.failureCode) {
        await finishRun(db, runId, "failed");
        onProgress?.({ type: "reset" });
        const evidenceFailure = /evidence|review|source_link/.test(answer.failureCode);
        return {
          error: evidenceFailure
            ? "I couldn’t verify this answer against its sources. Please try again or open the original reading."
            : "Ask couldn’t finish this answer right now. Your question is still here; please try again shortly.",
          code: evidenceFailure ? "answer_not_verified" : "answer_unavailable",
          retryable: true,
        };
      }
      await finishRun(db, runId, answer.degraded ? "needs_review" : "completed");
      return toStaffAskResult(result);
    } catch (error) {
      console.error("ask_route_failed", error instanceof Error ? `${error.name}: ${error.message}` : "unknown");
      await finishRun(db, runId, "failed");
      return { error: "Ask could not finish this answer. Please try again later, or browse the Library." };
    } finally { db.close(); }
  };
  // A page that asks for progress gets it line by line; anything else gets the single finished answer as before.
  return request.headers.get("accept")?.includes(ASK_PROGRESS_TYPE) ? progressLines(answer) : patientJson(() => answer());
}
