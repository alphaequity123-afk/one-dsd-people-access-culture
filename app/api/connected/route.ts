import { NextResponse, type NextRequest } from "next/server";
import { facetsForHref } from "@/lib/graph/facets";

export const runtime = "nodejs";

/** The State of Minnesota agencies connected to a page through the knowledge graph. */
export async function GET(request: NextRequest) {
  const path = (request.nextUrl.searchParams.get("path") ?? "").slice(0, 300);
  if (!path.startsWith("/")) return NextResponse.json({ agencies: [] });
  const seen = new Set<string>();
  const agencies: { title: string; href: string }[] = [];
  // An agency whose own page lists this page holds the work directly; it comes first.
  const values = facetsForHref(path, 30).filter(value => value.id !== "state-agencies")
    .sort((a, b) => Number(b.id.startsWith("agency-")) - Number(a.id.startsWith("agency-")));
  for (const value of values) {
    for (const item of value.items) {
      if (item.kind !== "agency" || seen.has(item.id)) continue;
      seen.add(item.id);
      agencies.push({ title: item.title, href: item.href });
    }
  }
  return NextResponse.json({ agencies: agencies.slice(0, 8) }, { headers: { "Cache-Control": "public, max-age=300" } });
}
