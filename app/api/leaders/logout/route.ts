import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { LEADERS_COOKIE } from "@/lib/auth/leaders";

const NO_STORE = { "cache-control": "no-store" };

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Open the equity baseline before signing out." }, { status: 403, headers: NO_STORE });
  const res = NextResponse.redirect(new URL("/leading", request.headers.get("origin")!), { status: 303, headers: NO_STORE });
  res.cookies.set(LEADERS_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return res;
}
