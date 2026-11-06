import type { NextRequest } from "next/server";
import { formalizeRequestSchema } from "@/lib/policy-analysis/contract";
import { policyAccess, policyBody, policyFailure, policyJson } from "@/lib/policy-analysis/http";
import { formalizePolicyCase } from "@/lib/policy-analysis/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Formalize the approved changes. Every change needs a decision and at least one must be approved. */
export async function POST(request: NextRequest) {
  const access = await policyAccess(request, true); if ("response" in access) return access.response;
  const body = await policyBody(request, 4_000, formalizeRequestSchema, "Choose a saved case, its version and a title for the formal document.");
  if ("response" in body) return body.response;
  try { return policyJson({ case: await formalizePolicyCase(body.value, access.role) }); } catch (error) { return policyFailure(error); }
}
