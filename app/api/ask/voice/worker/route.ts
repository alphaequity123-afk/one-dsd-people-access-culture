import type { NextRequest } from "next/server";
import { cloneAgentsEnabled } from "@/lib/intelligence/clone/config";
import { paused } from "@/lib/intelligence/orchestrator";
import { workerAuthorized, takeVoiceJob, completeVoiceJob, voiceJobActive, waitForVoiceJob } from "@/lib/intelligence/clone/voice-queue";
export const runtime = "nodejs";
export const maxDuration = 30;
const reply = (value: unknown, status = 200) => Response.json(value, { status, headers: { "cache-control": "no-store" } });
export async function GET(request: NextRequest) {
  if (!cloneAgentsEnabled() || !workerAuthorized(request.headers.get("authorization"))) return reply({ error: "Unauthorized" }, 401);
  if (await paused()) return reply({ paused: true });
  const active = request.nextUrl.searchParams.get("active");
  if (active) return reply({ active: voiceJobActive(active) });
  const wait = Number(request.nextUrl.searchParams.get("wait") ?? "0");
  if (!Number.isSafeInteger(wait) || wait < 0) return reply({ error: "Invalid wait duration" }, 400);
  if (wait > 0) {
    await waitForVoiceJob(request.signal, Math.min(wait, 20_000));
    if (request.signal.aborted) return reply({ job: null });
    if (await paused()) return reply({ paused: true });
  }
  if (request.signal.aborted) return reply({ job: null });
  return reply({ job: takeVoiceJob() });
}
export async function POST(request: NextRequest) {
  if (!cloneAgentsEnabled() || !workerAuthorized(request.headers.get("authorization"))) return reply({ error: "Unauthorized" }, 401);
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!/^[a-f0-9-]{36}$/.test(id)) return reply({ error: "Invalid job" }, 400);
  const sequence = Number(request.headers.get("x-voice-sequence") ?? "0");
  if (!Number.isSafeInteger(sequence) || sequence < 0 || sequence > 1000) return reply({ error: "Invalid sequence" }, 400);
  if (request.headers.get("x-voice-done") === "1") return reply({ accepted: completeVoiceJob(id, new Uint8Array(), sequence, true) });
  if (request.headers.get("x-voice-failed") === "1") return reply({ accepted: completeVoiceJob(id, null, sequence) });
  const reader = request.body?.getReader(); if (!reader) return reply({ error: "Audio required" }, 400);
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length;
    if (size > 8_000_000) { await reader.cancel(); completeVoiceJob(id, null, sequence); return reply({ error: "Audio too large" }, 413); }
    chunks.push(part.value);
  }
  const audio = Buffer.concat(chunks);
  if (audio.toString("ascii", 0, 4) !== "RIFF" || audio.toString("ascii", 8, 12) !== "WAVE") { completeVoiceJob(id, null, sequence); return reply({ error: "WAV required" }, 400); }
  if (await paused()) { completeVoiceJob(id, null, sequence); return reply({ error: "Paused" }, 503); }
  return reply({ accepted: completeVoiceJob(id, audio, sequence, false) });
}
