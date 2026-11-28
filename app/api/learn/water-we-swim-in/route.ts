import { NextResponse } from "next/server";

/**
 * Owner decision 2026-11-22: The Water We Swim In is removed entirely, essay included, and its
 * pages redirect to Learn (next.config.ts). Its learning assistant went with it, so this address
 * no longer reaches the model provider.
 */
export async function POST() {
  return NextResponse.json(
    { error: "The Water We Swim In has been removed. Visit Learn for current courses and readings." },
    { status: 410, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } },
  );
}
