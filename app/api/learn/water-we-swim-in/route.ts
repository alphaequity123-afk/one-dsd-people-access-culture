import type { NextRequest } from "next/server";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { readBoundedJson } from "@/lib/http/request";
import { paused } from "@/lib/intelligence/orchestrator";
import { externalResearchGate, profilingRefuse } from "@/lib/intelligence/safety";
import { reserveLearningQuestion } from "@/lib/intelligence/learning/gemini-learning-limit";
import { learningModes, waterLearningAnswer, WaterLearningError, type WaterLearningMode } from "@/lib/intelligence/learning/water-learning-assistant";
import { waterUnitScope } from "@/lib/intelligence/learning/water-reading-sources";

export const runtime = "nodejs";
export const maxDuration = 40;

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
    const retryAfter = reserveLearningQuestion(request);
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
