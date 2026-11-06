import type { NextRequest } from "next/server";
import { ROLE_LABELS } from "@/lib/auth/consultant-or-team";
import { policyAccess, policyJson } from "@/lib/policy-analysis/http";
import { policyDraftingAvailability } from "@/lib/policy-analysis/provider";
import { policyCaseSavingAvailability } from "@/lib/policy-analysis/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Who is signed in and what is available. 401 when neither sign-in is present. */
export async function GET(request: NextRequest) {
  const access = await policyAccess(request); if ("response" in access) return access.response;
  const [drafting, saving] = await Promise.all([policyDraftingAvailability(), policyCaseSavingAvailability()]);
  return policyJson({ role: access.role, roleLabel: ROLE_LABELS[access.role], ...drafting, ...saving });
}
