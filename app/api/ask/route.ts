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
import { libraryAskResult, toStaffAskResult } from "@/lib/intelligence/agents/ask";
import { randomUUID } from "node:crypto";
import { PracticeArtifactSchema } from "@/lib/content/practice-artifact";
import { AskWorkProductSchema } from "@/lib/ask/work-product";
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
    // The page went away. The answer is still finished; nothing more is sent, and nothing is kept.
    cancel() { open = false; },
  });
  return new Response(stream, { headers: { "content-type": `${ASK_PROGRESS_TYPE}; charset=utf-8`, "cache-control": "no-store, no-transform", "x-accel-buffering": "no" } });
}

/**
 * Owner-authorized clone pilot; the other deployments remain browse-only.
 * Ask keeps no record of runs: no ledger, no counts, nothing about the question. When any step fails,
 * is paused or is limited, the person still gets an answer in words, composed from the library's own text.
 */
export async function POST(request: NextRequest) {
  if (!cloneAgentsEnabled()) return staffWriteClosedResponse();
  if (!isSameOriginMutation(request)) return json({ error: "Please use Ask from its page on this site." }, 403);
  const body = await readBoundedJson(request, 128_000);
  if (!body.ok) return json({ error: body.message }, body.status);
  const input = Input.safeParse(body.value);
  if (!input.success) return json({ error: "Please shorten your question or start a new conversation." }, 400);
  const library = () => toStaffAskResult(libraryAskResult(input.data.question, DEFAULT_PRODUCT_CONTEXT));
  if (await paused()) return json(library());
  const limit = await consumeRequestLimit(request, { scope: "staff-ask", limit: 120, windowSeconds: 600 });
  // Past the limit, the answer comes from the library alone: no model call, no cost, still an answer.
  if (!limit.allowed) return NextResponse.json(library(), { headers: { ...rateLimitHeaders(limit), "cache-control": "no-store" } });
  // A random id ties the steps of this one answer together in the operational log; it is never stored.
  const runId = randomUUID();
  const answer = async (onProgress?: AskProgressSink) => {
    try {
      const result = await ask({ ...input.data, contextPreference: DEFAULT_PRODUCT_CONTEXT, researchMode: input.data.researchMode ?? "auto", cloneRunId: runId, onProgress }, "staff", runId);
      if (await paused()) { onProgress?.({ type: "reset" }); return library(); }
      if (result.kind === "answer" && result.answer.failureCode) { onProgress?.({ type: "reset" }); return library(); }
      return toStaffAskResult(result);
    } catch (error) {
      console.error("ask_route_failed", error instanceof Error ? error.name : "unknown");
      onProgress?.({ type: "reset" });
      return library();
    }
  };
  // A page that asks for progress gets it line by line; anything else gets the single finished answer as before.
  return request.headers.get("accept")?.includes(ASK_PROGRESS_TYPE) ? progressLines(answer) : patientJson(() => answer());
}
