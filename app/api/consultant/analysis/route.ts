import { NextResponse, type NextRequest } from "next/server";
import { ownerFromRequest } from "@/lib/auth/request";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { readBoundedJson } from "@/lib/http/request";
import { analysisRequestSchema } from "@/lib/consultant-analysis";
import { analysisAvailability, AnalysisUnavailable, prepareAnalysis } from "@/lib/consultant-analysis/service";
import { ToolDenied } from "@/lib/intelligence/tools/runtime";
import { OpenAIRequestError } from "@/lib/intelligence/providers/openai";
import { AnalysisValidationError } from "@/lib/consultant-analysis/schema";

export const maxDuration = 180;
const headers = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
let inFlight = 0;
let attempts: number[] = [];
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });

export async function GET(request: NextRequest) {
  if (!(await ownerFromRequest(request))) return json({ error: "Sign in to the Consultant Workspace to continue." }, 401);
  try { return json(await analysisAvailability()); }
  catch { return json({ error: "Analysis connections could not be checked. Your saved draft is unchanged." }, 503); }
}

export async function POST(request: NextRequest) {
  if (!(await ownerFromRequest(request))) return json({ error: "Sign in to the Consultant Workspace to continue." }, 401);
  if (!isSameOriginMutation(request)) return json({ error: "Open this workspace from the program before preparing an analysis." }, 403);
  const body = await readBoundedJson(request, 900000);
  if (!body.ok) return json({ error: body.message }, body.status);
  const parsed = analysisRequestSchema.safeParse(body.value);
  if (!parsed.success) return json({ error: "Check the question, sources, selected goals and public-material confirmation." }, 400);
  const now = Date.now();
  attempts = attempts.filter(at => now - at < 600000);
  if (inFlight >= 2 || attempts.length >= 10) return json({ error: "Finish the current analysis or try again in a few minutes. Your draft is unchanged." }, 429);
  attempts.push(now);
  inFlight += 1;
  try { return json(await prepareAnalysis(parsed.data)); }
  catch (error) {
    if (error instanceof AnalysisUnavailable) return json({ error: error.message }, 503);
    if (error instanceof ToolDenied) return json({ error: "Analysis is paused or unavailable under the current workspace settings. Your draft is unchanged." }, 503);
    console.error("consultant_analysis_failed", { category: error instanceof Error ? error.name : "unknown", ...(error instanceof AnalysisValidationError ? { reason: error.code } : {}) });
    if (error instanceof OpenAIRequestError && error.message === "openai_timeout") return json({ error: "The analysis service took longer than the time allowed. Your draft is unchanged. You can try again; no automatic retry was made." }, 504);
    return json({ error: "The analysis could not be completed or its references could not be verified. No unverified result replaced your draft." }, 502);
  } finally { inFlight -= 1; }
}
