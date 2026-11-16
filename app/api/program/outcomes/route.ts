import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { OutcomeSharingRefused, saveProgramOutcome } from "@/lib/program/outcomes";
import { ProgramOutcomeInputSchema } from "@/lib/program/outcome-schema";

/**
 * Voluntary outcome records (reopened by the owner, 2026-11-16; an exception to the staff write lock).
 *
 * Keeps only what the form sends. The Origin header is compared to refuse other sites and is never kept; the route
 * never reads or keeps a network address, browser details, cookies or the page the person
 * came from, and writes nothing to logs. The record keeps the month only. One throttle for the whole route, held in
 * memory and tied to no one, limits floods without identifying anyone.
 */
export const dynamic = "force-dynamic";

const MAX_BODY_CHARACTERS = 16_000;
const WINDOW_MS = 10 * 60_000;
const WINDOW_LIMIT = 60;
const throttle = { windowStart: 0, used: 0 };

function admit(now: number): boolean {
  if (now - throttle.windowStart >= WINDOW_MS) { throttle.windowStart = now; throttle.used = 0; }
  if (throttle.used >= WINDOW_LIMIT) return false;
  throttle.used += 1;
  return true;
}

const reply = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
const UNAVAILABLE = "This account could not be shared right now. Your writing is still here; try again later.";

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request)) return reply(403, { error: "Share this account from the program's own page." });
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return reply(415, { error: "Send the form as JSON." });
  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARACTERS) return reply(413, { error: "This account is too long. Shorten it and try again." });
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return reply(400, { error: "The form could not be read. Try again." }); }
  const parsed = ProgramOutcomeInputSchema.safeParse(body);
  if (!parsed.success) {
    const consent = parsed.error.issues.some(issue => issue.path[0] === "consent");
    return reply(400, { error: consent ? "Check the box to share this account." : "Fill in each part of the form, then try again." });
  }
  if (!admit(Date.now())) return reply(429, { error: "Many accounts are arriving at once. Try again in a few minutes." });
  try {
    await saveProgramOutcome(parsed.data);
    return reply(200, { shared: true });
  } catch (error) {
    if (error instanceof OutcomeSharingRefused) return reply(422, { error: error.message });
    return reply(503, { error: UNAVAILABLE });
  }
}
