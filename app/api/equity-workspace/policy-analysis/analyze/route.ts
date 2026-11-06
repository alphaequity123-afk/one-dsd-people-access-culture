import type { NextRequest } from "next/server";
import { analyzeCaseRequestSchema } from "@/lib/policy-analysis/contract";
import { busyResponse, policyAccess, policyBody, policyCapacity, policyFailure, policyJson } from "@/lib/policy-analysis/http";
import { analyzePolicyCase } from "@/lib/policy-analysis/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Run the analysis pass, the recommendations pass, or both. 503 code "unavailable" when drafting is not configured. */
export async function POST(request: NextRequest) {
  const access = await policyAccess(request, true); if ("response" in access) return access.response;
  const body = await policyBody(request, 2_000, analyzeCaseRequestSchema, "Choose a saved case, its version and the step to run.");
  if ("response" in body) return body.response;
  const release = policyCapacity("analysis");
  if (!release) return busyResponse();
  try { return policyJson({ case: await analyzePolicyCase(body.value) }); } catch (error) { return policyFailure(error); } finally { release(); }
}
