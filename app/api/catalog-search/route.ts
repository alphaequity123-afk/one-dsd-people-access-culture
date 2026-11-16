import { NextResponse, type NextRequest } from "next/server";
import { catalogSearch, isCatalogSearchName } from "@/lib/content/catalog-search";
import { readBoundedJson } from "@/lib/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Word search for the policy catalog and the reading collection. The words arrive in the request body, never in
 * the address; the reply is the ids of the matching entries. Nothing is stored or logged.
 */
export async function POST(request: NextRequest) {
  const body = await readBoundedJson(request, 4_096);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status, headers: NO_STORE });
  const value = body.value && typeof body.value === "object" && !Array.isArray(body.value) ? body.value as Record<string, unknown> : {};
  if (!isCatalogSearchName(value.catalog)) return NextResponse.json({ error: "Choose a catalog to search." }, { status: 400, headers: NO_STORE });
  const q = typeof value.q === "string" ? value.q : "";
  return NextResponse.json({ ids: catalogSearch(value.catalog, q) }, { headers: NO_STORE });
}
