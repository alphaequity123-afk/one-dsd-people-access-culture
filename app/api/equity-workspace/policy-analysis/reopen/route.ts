import type { NextRequest } from "next/server";
import { z } from "zod";
import { policyAccess, policyBody, policyFailure, policyJson } from "@/lib/policy-analysis/http";
import { reopenPolicyCase } from "@/lib/policy-analysis/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z.object({ caseId: z.string().uuid(), expectedVersion: z.number().int().positive() }).strict();

/** Move a formalized case back to review. The formalization is cleared; the decision history is kept. */
export async function POST(request: NextRequest) {
  const access = await policyAccess(request, true); if ("response" in access) return access.response;
  const body = await policyBody(request, 1_000, schema, "Choose a saved case and its version.");
  if ("response" in body) return body.response;
  try { return policyJson({ case: await reopenPolicyCase(body.value.caseId, body.value.expectedVersion) }); } catch (error) { return policyFailure(error); }
}
