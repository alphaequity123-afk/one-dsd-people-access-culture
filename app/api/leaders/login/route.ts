import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { issueLeadersCookieValue, LEADERS_COOKIE, LEADERS_SESSION_SECONDS, verifyLeadersKey } from "@/lib/auth/leaders";
import { consumeRequestLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { readBoundedFormUrlEncoded } from "@/lib/http/request";

const NO_STORE = { "cache-control": "no-store" };
const HOME = "/data/equity-baseline";
const safeReturn = (value: string) => /^\/data\/equity-baseline(?:\/[A-Za-z0-9/_-]*)?$/.test(value) ? value : HOME;

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Open the equity baseline before signing in." }, { status: 403, headers: NO_STORE });
  let limit;
  try { limit = await consumeRequestLimit(request, { scope: "owner-login", limit: 10, windowSeconds: 15 * 60 }); }
  catch { return NextResponse.json({ error: "Sign-in is not available just now." }, { status: 503, headers: NO_STORE }); }
  if (!limit.allowed) return NextResponse.json({ error: "Please wait before trying to sign in again." }, { status: 429, headers: rateLimitHeaders(limit) });
  const form = await readBoundedFormUrlEncoded(request, 4_096);
  if (!form.ok) return NextResponse.json({ error: "Open the equity baseline before signing in." }, { status: form.status, headers: NO_STORE });
  if (form.value.getAll("key").length !== 1 || form.value.getAll("returnTo").length > 1) return NextResponse.json({ error: "Open the equity baseline before signing in." }, { status: 400, headers: NO_STORE });
  const url = new URL(safeReturn(form.value.get("returnTo") ?? HOME), request.headers.get("origin")!);
  if (!verifyLeadersKey(form.value.get("key") ?? "")) { url.searchParams.set("denied", "1"); return NextResponse.redirect(url, { status: 303, headers: NO_STORE }); }
  const value = issueLeadersCookieValue();
  const res = NextResponse.redirect(url, { status: 303, headers: NO_STORE });
  if (value) res.cookies.set(LEADERS_COOKIE, value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: LEADERS_SESSION_SECONDS });
  return res;
}
