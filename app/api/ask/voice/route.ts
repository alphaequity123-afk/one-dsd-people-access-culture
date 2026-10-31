import type { NextRequest } from "next/server";
import { cloneAgentsEnabled } from "@/lib/intelligence/clone/config";
import { paused } from "@/lib/intelligence/orchestrator";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { consumeRequestLimit } from "@/lib/security/rate-limit";
import { readBoundedJson } from "@/lib/http/request";
import { reserveVoice, voiceStatus } from "@/lib/intelligence/clone/voice";
import { queueVoice, voiceWorkerReady } from "@/lib/intelligence/clone/voice-queue";

export const runtime = "nodejs";
export const maxDuration = 600;
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
export async function GET() {
  if (!cloneAgentsEnabled()) return reply({ error: "Unavailable" }, 404);
  return reply({ ...voiceStatus(), paused: await paused() });
}
export async function POST(request: NextRequest) {
  if (!cloneAgentsEnabled()) return reply({ error: "Unavailable" }, 404);
  if (!isSameOriginMutation(request)) return reply({ error: "Please use Ask from its page on this site." }, 403);
  if (await paused()) return reply({ error: "Ask is paused for now." }, 503);
  if (!(await consumeRequestLimit(request, { scope: "ask-voice", limit: 30, windowSeconds: 600 })).allowed) return reply({ error: "Please wait a moment before listening again." }, 429);
  const body = await readBoundedJson(request, 16_000);
  if (!body.ok) return reply({ error: body.message }, body.status);
  const input = body.value as { text?: unknown };
  if (typeof input?.text !== "string" || !input.text.trim() || input.text.length > 10000) return reply({ error: "Only answers of up to 10,000 characters can be read aloud." }, 400);
  if (!voiceWorkerReady()) return reply({ error: "Listening is not available yet. The written answer is still here." }, 503);
  if (!reserveVoice("speech", input.text.length)) return reply({ error: "Listening has reached its limit for now. You can keep reading the written answers." }, 429);
  try {
    const audio = queueVoice(input.text, request.signal);
    if (!audio) return reply({ error: "This answer could not be played, but the written answer is still here." }, 503);
    if (await paused()) { await audio.cancel(); return reply({ error: "Ask was paused." }, 503); }
    return new Response(audio, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
  } catch { return reply({ error: "Listening is not available right now, but the written answer is still here." }, 503); }
}
