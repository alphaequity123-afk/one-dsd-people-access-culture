import type { NextRequest } from "next/server";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { readBoundedJson } from "@/lib/http/request";
import { paused } from "@/lib/intelligence/orchestrator";
import { externalResearchGate, profilingRefuse } from "@/lib/intelligence/safety";
import { GeminiLearningError } from "@/lib/intelligence/learning/gemini-learning";
import { reserveLearningAvailability, reserveLearningQuestion } from "@/lib/intelligence/learning/gemini-learning-limit";
import {
  learningResourcePath, resourceLearningAnswer, resourceLearningModes,
  ResourcePublicationChanged, resourceStudyAvailability, type ResourceLearningMode,
} from "@/lib/intelligence/learning/resource-learning-assistant";

export const runtime = "nodejs";
export const maxDuration = 45;

function reply(body: unknown, status = 200, retryAfter?: number) {
  const headers = new Headers({ "cache-control": "no-store", "x-content-type-options": "nosniff" });
  if (retryAfter) headers.set("retry-after", String(retryAfter));
  return Response.json(body, { status, headers });
}

const unavailable = "The learning assistant is temporarily unavailable. You can still open the resources.";

export async function GET(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("resourcePath");
  if (!value || !learningResourcePath(value)) return reply({ available: false });
  try {
    const retryAfter = reserveLearningAvailability(request);
    if (retryAfter) return reply({ available: false }, 429, retryAfter);
    return reply(await resourceStudyAvailability(value));
  } catch {
    return reply({ available: false }, 503);
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request)) return reply({ error: "Open the learning assistant from this site's resource library." }, 403);
  const body = await readBoundedJson(request, 4096);
  if (!body.ok) return reply({ error: body.message }, body.status);
  const { question, resourcePath: rawPath, mode = "explain" } = (body.value ?? {}) as {
    question?: unknown;
    resourcePath?: unknown;
    mode?: unknown;
  };
  if (typeof question !== "string" || !question.trim() || question.length > 600) {
    return reply({ error: "Enter a question of up to 600 characters." }, 400);
  }
  const resourcePath = typeof rawPath === "string" ? learningResourcePath(rawPath) : undefined;
  if (rawPath !== undefined && !resourcePath) return reply({ error: "Choose a published resource on this site." }, 400);
  if (typeof mode !== "string" || !Object.hasOwn(resourceLearningModes, mode)) {
    return reply({ error: "Choose a learning activity on this page." }, 400);
  }
  if (/\b(?:my name is|you can reach me|my home address is)\b/i.test(question) || !externalResearchGate(question).ok) {
    return reply({ error: "Remove names, identifying details, or confidential material. Ask about a general or fictional situation." }, 400);
  }
  const profiling = profilingRefuse(question);
  if (!profiling.ok) return reply({ error: profiling.message }, 400);

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return reply({ error: unavailable }, 503);
  const started = performance.now();
  try {
    if (await paused()) return reply({ error: unavailable }, 503);
    const retryAfter = reserveLearningQuestion(request);
    if (retryAfter) return reply({ error: "The learning assistant has reached its request limit. Please try again later." }, 429, retryAfter);
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(38_000)]);
    const result = await resourceLearningAnswer({ question: question.trim(), resourcePath, mode: mode as ResourceLearningMode }, apiKey, signal);
    console.info("resource_learning_result", {
      mode, scoped: Boolean(resourcePath), grounded: result.grounded,
      citations: result.sources.length, elapsedMs: Math.round(performance.now() - started),
    });
    return reply(result);
  } catch (error) {
    if (error instanceof ResourcePublicationChanged) {
      console.warn("resource_learning_publication_changed");
      return reply({ error: "A source changed while the assistant was answering. Please ask again to use the current version." }, 409);
    }
    if (error instanceof GeminiLearningError) {
      console.warn("resource_learning_provider", error.code, error.providerStatus ?? "");
      if (error.code === "busy") return reply({ error: "The learning assistant is busy. Please try again in a minute." }, 429, 60);
      if (error.code === "invalid") return reply({ error: "The assistant couldn't verify citations for that answer. Please try rephrasing your question." }, 502);
    } else {
      console.warn("resource_learning_request_failed");
    }
    return reply({ error: unavailable }, 503);
  }
}
