import type { NextRequest } from "next/server";
import { z } from "zod";
import { policyAccess, policyBody, policyFailure, policyJson } from "@/lib/policy-analysis/http";
import { sendPolicyCaseForDecisions } from "@/lib/policy-analysis/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z.object({ caseId: z.string().uuid(), expectedVersion: z.number().int().positive() }).strict();

/**
 * Move a draft with at least one recommended change to review, without drafting. A case
 * with no analysis gets a minimal hand-written record (every question marked "Not yet answered.").
 */
export async function POST(request: NextRequest) {
  const access = await policyAccess(request, true); if ("response" in access) return access.response;
  const body = await policyBody(request, 1_000, schema, "Choose a saved case and its version.");
  if ("response" in body) return body.response;
  try { return policyJson({ case: await sendPolicyCaseForDecisions(body.value.caseId, body.value.expectedVersion) }); } catch (error) { return policyFailure(error); }
}
