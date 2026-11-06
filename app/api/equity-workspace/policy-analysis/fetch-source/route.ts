import type { NextRequest } from "next/server";
import { z } from "zod";
import { fetchCatalogSource } from "@/lib/policy-analysis/fetch-source";
import { busyResponse, policyAccess, policyBody, policyCapacity, policyFailure, policyJson } from "@/lib/policy-analysis/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const schema = z.object({ catalogId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,119}$/) }).strict();

/** Read the official source text of a catalog policy. Only the catalog's own address is fetched. */
export async function POST(request: NextRequest) {
  const access = await policyAccess(request, true); if ("response" in access) return access.response;
  const body = await policyBody(request, 1_000, schema, "Choose a policy from the catalog.");
  if ("response" in body) return body.response;
  const release = policyCapacity("fetch");
  if (!release) return busyResponse();
  try { return policyJson({ source: await fetchCatalogSource(body.value.catalogId) }); } catch (error) { return policyFailure(error); } finally { release(); }
}
