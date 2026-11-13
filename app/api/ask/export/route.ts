import type { NextRequest } from "next/server";
import { AskWorkProductSchema, usableWorkDraft, workProductDocument } from "@/lib/ask/work-product";
import { cloneAgentsEnabled } from "@/lib/intelligence/clone/config";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { readBoundedJson } from "@/lib/http/request";
import { consumeRequestLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { renderResourceDocument, downloadContentType, downloadFileName } from "@/lib/downloads/render";

export const runtime = "nodejs";
export const maxDuration = 60;
const json = (error: string, status: number) => Response.json({ error }, { status, headers: { "cache-control": "no-store" } });

/** Stateless export of the reader's working copy. Does not publish or save it. */
export async function POST(request: NextRequest) {
  if (!cloneAgentsEnabled()) return json("Ask downloads are not available here.", 403);
  if (!isSameOriginMutation(request)) return json("Please download from Ask on this site.", 403);
  const limit = await consumeRequestLimit(request, { scope: "staff-ask-export", limit: 20, windowSeconds: 600 });
  if (!limit.allowed) return Response.json({ error: "Please wait a moment before downloading again." }, { status: 429, headers: rateLimitHeaders(limit) });
  const body = await readBoundedJson(request, 128_000);
  if (!body.ok) return json(body.message, body.status);
  const parsed = AskWorkProductSchema.safeParse(body.value);
  if (!parsed.success) return json("This draft could not be downloaded. Ask for a revised copy.", 400);
  const { sources, ...draft } = parsed.data;
  if (!usableWorkDraft(draft)) return json("This draft needs a complete document or table before downloading.", 400);
  try {
    const document = workProductDocument({ ...draft, sources }, process.env.PAC_PUBLIC_ORIGIN ?? request.nextUrl.origin);
    const data = await renderResourceDocument(document, draft.format);
    return new Response(new Uint8Array(data), { headers: {
      "content-type": downloadContentType(draft.format),
      "content-disposition": `attachment; filename="${downloadFileName(draft.title, draft.format)}"`,
      "cache-control": "no-store", "x-content-type-options": "nosniff", "content-security-policy": "sandbox",
    } });
  } catch {
    return json("The download could not finish. Your draft is still here; please try again.", 503);
  }
}
