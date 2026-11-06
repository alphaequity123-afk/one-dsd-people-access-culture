import type { NextRequest } from "next/server";
import { z } from "zod";
import { updateCaseRequestSchema } from "@/lib/policy-analysis/contract";
import { policyAccess, policyBody, policyError, policyFailure, policyJson } from "@/lib/policy-analysis/http";
import { updatePolicyCase } from "@/lib/policy-analysis/operations";
import { deletePolicyCase, getPolicyCase } from "@/lib/policy-analysis/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
const removeSchema = z.object({ expectedVersion: z.number().int().positive() }).strict();

export async function GET(request: NextRequest, context: Context) {
  const access = await policyAccess(request); if ("response" in access) return access.response;
  try {
    const value = await getPolicyCase((await context.params).id);
    return value ? policyJson({ case: value }) : policyError("This case was not found.", 404, "not_found");
  } catch (error) { return policyFailure(error); }
}

export async function PUT(request: NextRequest, context: Context) {
  const access = await policyAccess(request, true); if ("response" in access) return access.response;
  const body = await policyBody(request, 2_000_000, updateCaseRequestSchema, "Check the case version and the fields you changed.");
  if ("response" in body) return body.response;
  try { return policyJson({ case: await updatePolicyCase((await context.params).id, body.value) }); } catch (error) { return policyFailure(error); }
}

export async function DELETE(request: NextRequest, context: Context) {
  const access = await policyAccess(request, true); if ("response" in access) return access.response;
  const body = await policyBody(request, 1_000, removeSchema, "Reopen the case before removing it.");
  if ("response" in body) return body.response;
  try { await deletePolicyCase((await context.params).id, body.value.expectedVersion); return policyJson({ ok: true }); } catch (error) { return policyFailure(error); }
}
