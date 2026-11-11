import { NextResponse, type NextRequest } from "next/server";
import { agenciesForAreas, facetsForHref } from "@/lib/graph/facets";
import { pageArea, type PageArea } from "@/lib/program/page-purpose";

export const runtime = "nodejs";

/** The work areas each section of the site mostly concerns; used for section pages that are not single items. */
const SECTION_AREAS: Record<PageArea | "communities", string[]> = {
  start: ["policy-program-service", "leadership-systems"],
  learn: ["culture-trust", "access-language"],
  tools: ["policy-program-service", "measurement"],
  support: ["access-language", "community-engagement"],
  programs: ["policy-program-service", "leadership-systems"],
  leading: ["leadership-systems", "workforce"],
  about: ["leadership-systems", "policy-program-service"],
  consultant: ["leadership-systems", "measurement"],
  communities: ["community-engagement", "culture-trust"],
};

/** The public agencies and partners connected to a page through the knowledge graph. Every page gets an answer. */
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
  // Section pages and pages that are not single items: the agencies whose reviewed work areas match the section.
  if (agencies.length < 3) {
    const section = /^\/(minnesota-communities|employee-resource-groups|community-outreach)(?:\/|$)/.test(path) ? "communities" : pageArea(path);
    for (const item of agenciesForAreas(SECTION_AREAS[section], 8)) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      agencies.push({ title: item.title, href: item.href });
    }
  }
  return NextResponse.json({ agencies: agencies.slice(0, 8) }, { headers: { "Cache-Control": "public, max-age=300" } });
}
