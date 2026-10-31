import type { NextRequest } from "next/server";
import { cloneAgentsEnabled } from "@/lib/intelligence/clone/config";
import { reserveVoice } from "@/lib/intelligence/clone/voice";
import { paused } from "@/lib/intelligence/orchestrator";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { consumeRequestLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 90;
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
const TYPES = new Set(["audio/webm", "audio/ogg", "audio/mp4", "audio/wav"]);
export async function POST(request: NextRequest) {
  if (!cloneAgentsEnabled()) return reply({ error: "Unavailable" }, 404);
  if (!isSameOriginMutation(request)) return reply({ error: "Please use Ask from its page on this site." }, 403);
  if (await paused()) return reply({ error: "Ask is paused for now." }, 503);
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return reply({ error: "Speaking your question is not available right now. You can type it instead." }, 503);
  if (!(await consumeRequestLimit(request, { scope: "ask-transcribe", limit: 20, windowSeconds: 600 })).allowed) return reply({ error: "Please wait a moment before recording again." }, 429);
  const type = request.headers.get("content-type")?.split(";")[0] ?? "";
  if (!TYPES.has(type)) return reply({ error: "This browser records in a format we cannot use. Please type your question instead." }, 415);
  const reader = request.body?.getReader();
  if (!reader) return reply({ error: "Please record your question first." }, 400);
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const item = await reader.read(); if (item.done) break; size += item.value.length;
      if (size > 2_000_000) { await reader.cancel(); return reply({ error: "Keep each recording under 30 seconds." }, 413); }
      chunks.push(item.value);
    }
    if (!size) return reply({ error: "The recording was empty. Please try again." }, 400);
    if (!reserveVoice("transcribe", 1)) return reply({ error: "Speaking questions has reached its limit for now. You can type your question." }, 429);
    const bytes = Buffer.concat(chunks);
    const data = new FormData();
    data.append("file", new Blob([bytes], { type }), `question.${type.split("/")[1]}`);
    data.append("model", "gpt-4o-mini-transcribe");
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { authorization: `Bearer ${key}` }, body: data,
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]), cache: "no-store" });
    if (!response.ok) return reply({ error: "We could not make out the recording. Please try again or type your question." }, 503);
    const result = await response.json();
    if (await paused()) return reply({ error: "Ask was paused." }, 503);
    if (typeof result.text !== "string" || result.text.length > 4000) return reply({ error: "Please ask a shorter question." }, 400);
    return reply({ text: result.text });
  } catch { return reply({ error: "We could not finish writing down your recording. Please try again or type your question." }, 503); }
}
