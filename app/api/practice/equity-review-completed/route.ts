import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { readBoundedJson } from "@/lib/http/request";
import { consumeRequestLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { EquityReviewCompletionSchema, recordEquityReviewCompletion } from "@/lib/practice/equity-review-count-store";
import { PRACTICE_COUNTERS_ENABLED } from "@/lib/practice/equity-review-count";

/**
 * Anonymous count of completed equity reviews. The body holds only a tool,
 * optional goal numbers and an optional decision type. No identity, cookie,
 * network address or free text is read into storage; the request limit keeps
 * only an opaque hash, as every other limited route does. While One DSD's
 * database cannot hold these totals, a valid request is accepted and nothing is kept.
 */
const headers = { "cache-control": "no-store" };

export async function GET() {
  return NextResponse.json({ error: "Use the review tools to add to this count." }, { status: 405, headers: { ...headers, allow: "POST" } });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Open the review from this program." }, { status: 403, headers });
  const body = await readBoundedJson(request, 1024);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status, headers });
  const parsed = EquityReviewCompletionSchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ error: "This count could not be added." }, { status: 400, headers });
  if (!PRACTICE_COUNTERS_ENABLED) return new NextResponse(null, { status: 204, headers });
  try {
    // "staff-ask" is already registered in the production database; a new scope would be refused there.
    const limit = await consumeRequestLimit(request, { scope: "staff-ask", limit: 120, windowSeconds: 600 });
    if (!limit.allowed) return NextResponse.json({ error: "Please wait before trying again." }, { status: 429, headers: { ...headers, ...rateLimitHeaders(limit) } });
    await recordEquityReviewCompletion(parsed.data);
    return new NextResponse(null, { status: 204, headers });
  } catch {
    return NextResponse.json({ error: "The count is unavailable right now." }, { status: 503, headers });
  }
}
