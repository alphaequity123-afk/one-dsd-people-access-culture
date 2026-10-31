import { NextResponse, type NextRequest } from "next/server";
import { parseProductContextView, PRODUCT_CONTEXT_COOKIE, PRODUCT_CONTEXT_QUERY, resolveProductContext, type ProductContextId } from "./federation";

/** Keep legacy resource-context links within the standalone One DSD program. */
const PREFERENCE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Replace (or add) the view preference in a raw Cookie request header, keeping every other cookie. */
export function withViewCookie(cookieHeader: string | null, context: ProductContextId): string {
  const others = (cookieHeader ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith(`${PRODUCT_CONTEXT_COOKIE}=`));
  return [...others, `${PRODUCT_CONTEXT_COOKIE}=${resolveProductContext(context)}`].join("; ");
}

/**
 * A person opening a page: a top-level navigation that is not a speculative
 * prefetch or prerender. Background fetches never change a saved preference.
 */
function isPageVisit(request: NextRequest): boolean {
  return request.headers.get("sec-fetch-dest") === "document"
    && request.headers.get("sec-fetch-mode") === "navigate"
    && !request.headers.has("sec-purpose")
    && request.headers.get("purpose") !== "prefetch";
}

/**
 * Accept legacy shared links while preserving the standalone One DSD identity and inherited One DHS resources.
 *
 * - A page visit stores the requested context and removes the old view parameter.
 * - Other requests receive the requested context without changing browser storage.
 * - An unknown value changes nothing. The view is a content preference, never an
 *   authorization decision (see lib/product/federation.ts).
 */
export function applyRequestedView(request: NextRequest): NextResponse {
  const legacyContext = parseProductContextView(request.nextUrl.searchParams.get(PRODUCT_CONTEXT_QUERY));
  if (!legacyContext) return NextResponse.next();
  const context = resolveProductContext(legacyContext);

  if (isPageVisit(request)) {
    const cleanUrl = new URL(request.url);
    cleanUrl.searchParams.delete(PRODUCT_CONTEXT_QUERY);
    const response = NextResponse.redirect(cleanUrl, 307);
    response.headers.set("cache-control", "no-store");
    response.cookies.set({
      name: PRODUCT_CONTEXT_COOKIE,
      value: context,
      path: "/",
      maxAge: PREFERENCE_MAX_AGE_SECONDS,
      sameSite: "lax",
      // The Share button reads this context, so it stays script-readable.
      httpOnly: false,
    });
    return response;
  }

  const headers = new Headers(request.headers);
  headers.set("cookie", withViewCookie(request.headers.get("cookie"), context));
  return NextResponse.next({ request: { headers } });
}

