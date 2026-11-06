import type { NextRequest } from "next/server";
import { createCaseRequestSchema } from "@/lib/policy-analysis/contract";
import { policyAccess, policyBody, policyError, policyFailure, policyJson } from "@/lib/policy-analysis/http";
import { createPolicyCase, listPolicyCases } from "@/lib/policy-analysis/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await policyAccess(request); if ("response" in access) return access.response;
  const value = request.nextUrl.searchParams.get("offset") ?? "0";
  if (!/^\d{1,6}$/.test(value)) return policyError("Choose a valid case-list page.", 400, "invalid");
  try { return policyJson(await listPolicyCases(Number(value))); } catch (error) { return policyFailure(error); }
}

export async function POST(request: NextRequest) {
  const access = await policyAccess(request, true); if ("response" in access) return access.response;
  const body = await policyBody(request, 2_000_000, createCaseRequestSchema, "This case could not be started. Check the title, the policy and the sources.");
  if ("response" in body) return body.response;
  try { return policyJson({ case: await createPolicyCase(body.value) }, 201); } catch (error) { return policyFailure(error); }
}
