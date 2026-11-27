import { NextResponse, type NextRequest } from "next/server";
import { siteSearch } from "@/lib/search/site-search";
import { requestedContentScope } from "@/lib/product/request-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Suggestions for the search box at the top of every page. Nothing about the search is stored. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit")) || 8, 1), 20);
  const timings: string[] = [];
  const results = await siteSearch(q, await requestedContentScope(), limit, (stage, ms) => {
    timings.push(`${stage};dur=${ms.toFixed(1)}`);
  });
  // Durations only: no query text, source content or user information is logged.
  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store", "Server-Timing": timings.join(", ") } });
}
