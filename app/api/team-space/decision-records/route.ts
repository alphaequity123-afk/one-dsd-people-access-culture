import type { NextRequest } from "next/server";
import { policyAccess, policyBody, policyError, policyJson } from "@/lib/policy-analysis/http";
import { DecisionRecordError, listTeamRecords, saveRecordSchema, saveTeamRecord, updateRecordSchema, updateTeamRecord } from "@/lib/decision-records/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVALID = "This decision record could not be saved. Check the title and the length of each part.";

function failure(error: unknown) {
  if (error instanceof DecisionRecordError) {
    const message = error.code === "unavailable" ? "The team space is not available right now. Your record is still on your computer."
      : error.code === "conflict" ? "Someone saved a newer version of this record. Reload the team space to see it."
      : error.code === "not_found" ? "That record is no longer in the team space." : INVALID;
    return policyError(message, error.status, error.code);
  }
  return policyError("The team space could not save this record. Your record is still on your computer.", 503, "failed");
}

export async function GET(request: NextRequest) {
  const access = await policyAccess(request); if ("response" in access) return access.response;
  try { return policyJson({ records: await listTeamRecords() }); } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  const access = await policyAccess(request, true); if ("response" in access) return access.response;
  const body = await policyBody(request, 120_000, saveRecordSchema, INVALID); if ("response" in body) return body.response;
  try { return policyJson({ record: await saveTeamRecord(body.value) }, 201); } catch (error) { return failure(error); }
}

export async function PUT(request: NextRequest) {
  const access = await policyAccess(request, true); if ("response" in access) return access.response;
  const body = await policyBody(request, 120_000, updateRecordSchema, INVALID); if ("response" in body) return body.response;
  try { return policyJson({ record: await updateTeamRecord(body.value) }); } catch (error) { return failure(error); }
}
