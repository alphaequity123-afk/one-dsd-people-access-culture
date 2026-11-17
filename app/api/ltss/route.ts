import { NextResponse } from "next/server";
import { monthlyLtssData } from "@/lib/ltss/monthly-data";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;
export async function GET() {
  try { return NextResponse.json(await monthlyLtssData(), { headers: { "cache-control": "no-store" } }); }
  catch { return NextResponse.json({ error: "The latest LTSS data could not be checked. The last published copy remains available." }, { status: 503, headers: { "cache-control": "no-store" } }); }
}
