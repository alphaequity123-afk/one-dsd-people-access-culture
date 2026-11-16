import { NextResponse, type NextRequest } from "next/server";
import { clasCollection, clasMatches } from "@/lib/content/clas-collection";
import { requestedContentScope } from "@/lib/product/request-context";
import { readBoundedJson } from "@/lib/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/** Which items in the CLAS collection contain the words. The words arrive in the body; nothing is stored or logged. */
export async function POST(request: NextRequest) {
  const body = await readBoundedJson(request, 4_096);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status, headers: NO_STORE });
  const value = body.value && typeof body.value === "object" ? body.value as { q?: unknown } : {};
  const q = typeof value.q === "string" ? value.q.trim().slice(0, 200) : "";
  const matches = clasMatches(await clasCollection(await requestedContentScope()), q);
  return NextResponse.json({ matches }, { headers: NO_STORE });
}
