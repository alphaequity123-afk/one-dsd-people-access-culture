import { NextResponse, type NextRequest } from "next/server";
import { librarySearch } from "@/lib/content/library-search";
import { normalizeLibraryFilters } from "@/lib/content/work-index";
import { normalizeWorkOrigin } from "@/lib/product/work-origin";
import { requestedContentScope } from "@/lib/product/request-context";
import { editingModeFromCookies } from "@/lib/auth/request";
import { readBoundedJson } from "@/lib/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * The Library keyword search. The words arrive in the request body, never in the address; the fixed
 * choices (theme, level, type and the like) come along so the results match the page. Nothing is stored or logged.
 */
export async function POST(request: NextRequest) {
  const body = await readBoundedJson(request, 8_192);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status, headers: NO_STORE });
  const value = body.value && typeof body.value === "object" ? body.value as { q?: unknown; choices?: unknown } : {};
  const q = typeof value.q === "string" ? value.q.trim().slice(0, 200) : "";
  const raw = value.choices && typeof value.choices === "object" && !Array.isArray(value.choices) ? value.choices as Record<string, unknown> : {};
  const choices = Object.fromEntries(Object.entries(raw).filter(([key, entry]) => key !== "q" && typeof entry === "string" && entry.length <= 120)) as Record<string, string>;
  if (!q) return NextResponse.json({ hits: [], guides: [], destinations: [], owner: false }, { headers: NO_STORE });
  const [result, owner] = await Promise.all([
    librarySearch(q, normalizeLibraryFilters(choices), normalizeWorkOrigin(choices), await requestedContentScope()),
    editingModeFromCookies(),
  ]);
  return NextResponse.json({ ...result, owner }, { headers: NO_STORE });
}
