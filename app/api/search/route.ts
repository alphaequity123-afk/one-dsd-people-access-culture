import { NextResponse, type NextRequest } from "next/server";
import { siteSearch } from "@/lib/search/site-search";
import { requestedContentScope } from "@/lib/product/request-context";
import { readBoundedJson } from "@/lib/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Results for the search box at the top of every page and for the full search page. The words arrive in the
 * request body, never in the address, and nothing about the search is stored or logged.
 */
export async function POST(request: NextRequest) {
  const body = await readBoundedJson(request, 4_096);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status, headers: NO_STORE });
  const value = body.value && typeof body.value === "object" ? body.value as { q?: unknown; limit?: unknown } : {};
  const q = typeof value.q === "string" ? value.q.trim().slice(0, 200) : "";
  const limit = Math.min(Math.max(Number(value.limit) || 8, 1), 40);
  const results = q ? await siteSearch(q, await requestedContentScope(), limit) : [];
  return NextResponse.json({ results }, { headers: NO_STORE });
}
