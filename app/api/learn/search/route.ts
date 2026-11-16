import { NextResponse, type NextRequest } from "next/server";
import { learnHubSearch } from "@/lib/learning/hub-search";
import { editingModeFromCookies } from "@/lib/auth/request";
import { requestedContentScope } from "@/lib/product/request-context";
import { readBoundedJson } from "@/lib/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

/** The Learn catalog search. The words arrive in the request body, never in the address; nothing is stored or logged. */
export async function POST(request: NextRequest) {
  const body = await readBoundedJson(request, 4_096);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status, headers: NO_STORE });
  const value = body.value && typeof body.value === "object" ? body.value as Record<string, unknown> : {};
  const [result, owner] = await Promise.all([
    learnHubSearch({ q: text(value.q, 200), theme: text(value.theme, 80), type: text(value.type, 80), level: text(value.level, 20) }, await requestedContentScope()),
    editingModeFromCookies(),
  ]);
  return NextResponse.json({ ...result, owner }, { headers: NO_STORE });
}
