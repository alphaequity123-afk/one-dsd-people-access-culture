import type { NextRequest } from "next/server";
import { ownerFromRequest } from "@/lib/auth/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "private, no-store, max-age=0", "x-content-type-options": "nosniff" };

/**
 * Answers 200 only for a live consultant (owner) session, so a page can show a consultant-only
 * control after the server has checked the sign-in. Everyone else gets an empty 204: no detail,
 * no sign-in prompt, and nothing is recorded either way.
 */
export async function GET(request: NextRequest) {
  if (!(await ownerFromRequest(request))) return new Response(null, { status: 204, headers: HEADERS });
  return Response.json({ consultant: true }, { status: 200, headers: HEADERS });
}
