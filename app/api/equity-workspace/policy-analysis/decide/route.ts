import type { NextRequest } from "next/server";
import { decideRequestSchema } from "@/lib/policy-analysis/contract";
import { policyAccess, policyBody, policyFailure, policyJson } from "@/lib/policy-analysis/http";
import { decidePolicyCase } from "@/lib/policy-analysis/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Record approve, reject or defer for one recommended change. The role comes from the session. */
export async function POST(request: NextRequest) {
  const access = await policyAccess(request, true); if ("response" in access) return access.response;
  const body = await policyBody(request, 12_000, decideRequestSchema, "Choose a recommended change, an outcome and a reason. A deferred change needs a date to come back to it.");
  if ("response" in body) return body.response;
  try { return policyJson({ case: await decidePolicyCase(body.value, access.role) }); } catch (error) { return policyFailure(error); }
}
