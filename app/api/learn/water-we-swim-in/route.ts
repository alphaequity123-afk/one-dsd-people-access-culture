import type { NextRequest } from "next/server";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { readBoundedJson } from "@/lib/http/request";
import { paused } from "@/lib/intelligence/orchestrator";
import { externalResearchGate, profilingRefuse } from "@/lib/intelligence/safety";
import { requestLimitSubjectHash } from "@/lib/security/rate-limit";
import { learningModes, waterLearningAnswer, WaterLearningError, type WaterLearningMode } from "@/lib/intelligence/learning/water-learning-assistant";
import { waterUnitScope } from "@/lib/intelligence/learning/water-reading-sources";

export const runtime = "nodejs";
export const maxDuration = 40;

type Bucket = { count: number; expires: number };
const clients = new Map<string, Bucket>();
let minute: Bucket | undefined;
let day: Bucket | undefined;

function currentBucket(bucket: Bucket | undefined, now: number, windowMs: number): Bucket {
  return bucket && now < bucket.expires ? bucket : { count: 0, expires: now + windowMs };
}

function reserveQuestion(subject: string): number {
  const now = Date.now();
  minute = currentBucket(minute, now, 60_000);
  day = currentBucket(day, now, 86_400_000);
  for (const [key, bucket] of clients) {
    if (bucket.expires <= now) clients.delete(key);
  }
  const client = currentBucket(clients.get(subject), now, 600_000);
  // Counters are local to the service process and contain only HMACs. Service
  // limits protect the upstream quota even when requests come from many IPs.
  const blockedUntil = Math.max(
    minute.count >= 8 ? minute.expires : 0,
    day.count >= 120 ? day.expires : 0,
    client.count >= 12 ? client.expires : 0,
  );
  if (blockedUntil > now) return Math.ceil((blockedUntil - now) / 1000);
  minute.count += 1;
  day.count += 1;
  client.count += 1;
  clients.set(subject, client);
  return 0;
}

function reply(body: unknown, status = 200, retryAfter?: number) {
  const headers = new Headers({ "cache-control": "no-store", "x-content-type-options": "nosniff" });
  if (retryAfter) headers.set("retry-after", String(retryAfter));
  return Response.json(body, { status, headers });
}

const unavailable = "The learning assistant is temporarily unavailable. You can still open the readings and activities.";

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request)) return reply({ error: "Open the learning assistant from The Water We Swim In on this site." }, 403);
  const body = await readBoundedJson(request, 4096);
  if (!body.ok) return reply({ error: body.message }, body.status);
  const { question, unit, mode = "explain" } = (body.value ?? {}) as { question?: unknown; unit?: unknown; mode?: unknown };
  if (typeof question !== "string" || !question.trim() || question.length > 600) {
    return reply({ error: "Enter a question of up to 600 characters." }, 400);
  }
  if (unit !== undefined && (typeof unit !== "string" || !waterUnitScope(unit))) {
    return reply({ error: "Choose a unit from The Water We Swim In." }, 400);
  }
  if (typeof mode !== "string" || !Object.hasOwn(learningModes, mode)) {
    return reply({ error: "Choose a learning activity on this page." }, 400);
  }
  const privacy = externalResearchGate(question);
  if (!privacy.ok) return reply({ error: "Remove any names, identifying details, or confidential material. Ask about a general or fictional situation." }, 400);
  const profiling = profilingRefuse(question);
  if (!profiling.ok) return reply({ error: profiling.message }, 400);

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return reply({ error: unavailable }, 503);
  try {
    if (await paused()) return reply({ error: unavailable }, 503);
    const retryAfter = reserveQuestion(requestLimitSubjectHash(request, "water-learning"));
    if (retryAfter) return reply({ error: "The learning assistant has reached its request limit. Please try again later." }, 429, retryAfter);
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(34_000)]);
    const result = await waterLearningAnswer({ question: question.trim(), unit, mode: mode as WaterLearningMode }, apiKey, signal);
    return reply(result);
  } catch (error) {
    if (error instanceof WaterLearningError) {
      console.warn("water_learning_provider", error.code, error.providerStatus ?? "");
      if (error.code === "busy") return reply({ error: "The learning assistant is busy. Please try again in a minute." }, 429, 60);
      if (error.code === "invalid") return reply({ error: "The assistant couldn't verify citations for that answer. Please try rephrasing your question." }, 502);
    } else {
      console.warn("water_learning_request_failed");
    }
    return reply({ error: unavailable }, 503);
  }
}
