import type { NextRequest } from "next/server";
import { exportRequestSchema } from "@/lib/policy-analysis/contract";
import { busyResponse, policyAccess, policyBody, policyCapacity, policyFailure, policyHeaders } from "@/lib/policy-analysis/http";
import { exportPolicyCase } from "@/lib/policy-analysis/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Download the analysis, the recommended changes, the decision record, or (final cases only) the formal policy proposal. */
export async function POST(request: NextRequest) {
  const access = await policyAccess(request, true); if ("response" in access) return access.response;
  const body = await policyBody(request, 2_000, exportRequestSchema, "Choose a saved case, a document and a format.");
  if ("response" in body) return body.response;
  const release = policyCapacity("export");
  if (!release) return busyResponse();
  try {
    const file = await exportPolicyCase(body.value);
    return new Response(new Blob([new Uint8Array(file.data)], { type: file.contentType }), {
      headers: { ...policyHeaders, "content-type": file.contentType, "content-disposition": `attachment; filename="${file.fileName}"`, "content-security-policy": "sandbox" },
    });
  } catch (error) { return policyFailure(error); } finally { release(); }
}
