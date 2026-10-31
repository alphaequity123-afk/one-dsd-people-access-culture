import { NextResponse, type NextRequest } from "next/server";
import { applyRequestedView } from "@/lib/product/view-proxy";
import { retiredFeatureDestination } from "@/lib/program/retired-features";

/** Retires excluded staff features and applies an explicitly requested program view. */
export function proxy(request: NextRequest) {
  const retired = retiredFeatureDestination(request.nextUrl.pathname);
  if (retired) return NextResponse.redirect(new URL(retired, request.url), 307);
  // The review page validates its tool and uses the shared application not-found
  // screen. Do not bypass program navigation with a separately branded HTML page.
  return applyRequestedView(request);
}

export const config = {
  matcher: [
    "/courses/drive-cultural-intelligence-workshop/:path*",
    "/courses/cultural-intelligence-workshop/:path*",
    "/courses/cultural-intelligence-workshop-cohort-1/:path*",
    "/courses/verona-mitchell-training/:path*",
    "/resources/drive-cultural-intelligence-workshop/:path*",
    "/resources/cultural-intelligence-workshop/:path*",
    "/resources/cultural-intelligence-workshop-cohort-1/:path*",
    "/resources/verona-mitchell-training/:path*",
    "/library/drive-cultural-intelligence-workshop/:path*",
    "/library/cultural-intelligence-workshop/:path*",
    "/library/cultural-intelligence-workshop-cohort-1/:path*",
    "/library/verona-mitchell-training/:path*",
    "/share/courses/drive-cultural-intelligence-workshop/:path*",
    "/share/courses/cultural-intelligence-workshop/:path*",
    "/share/courses/cultural-intelligence-workshop-cohort-1/:path*",
    "/share/courses/verona-mitchell-training/:path*",
    "/share/library/drive-cultural-intelligence-workshop/:path*",
    "/share/library/cultural-intelligence-workshop/:path*",
    "/share/library/cultural-intelligence-workshop-cohort-1/:path*",
    "/share/library/verona-mitchell-training/:path*",
    "/support/request", "/support/track", "/one-dsd/plan",
    "/one-dsd/evidence/:path*",
    "/documents/program-evidence/:path*",
    "/library/ref-dhs-equity-landscape", "/resources/ref-dhs-equity-landscape", "/share/library/ref-dhs-equity-landscape",
    "/library/ref-minnesota-equity-research", "/resources/ref-minnesota-equity-research", "/share/library/ref-minnesota-equity-research",
    "/documents/program-evidence/one-dsd-three-year-plan.txt",
    "/library/one-dsd-planning/:path*",
    "/library/ref-one-dsd-three-year-plan", "/resources/ref-one-dsd-three-year-plan",
    "/share/library/ref-one-dsd-three-year-plan",
    "/library/guide-one-dsd-implementation-plan", "/share/library/guide-one-dsd-implementation-plan",
    "/courses/:path*",
    "/courses/cultural-intelligence-tribal/:path*", "/courses/cultural-intelligence-native-american/:path*", "/courses/ipe-20-tribal-sovereignty/:path*",
    "/share/courses/cultural-intelligence-tribal/:path*", "/share/courses/cultural-intelligence-native-american/:path*", "/share/courses/ipe-20-tribal-sovereignty/:path*",
    "/equity-review/:path*",
    {
      // Pages only: never API routes, Next.js assets, or public files such as images and audio.
      // Only real file extensions are excluded, so a page id that contains a dot still matches.
      source: "/((?!api/|_next/|.*\\.(?:ico|png|jpe?g|webp|avif|gif|svg|mp3|m4a|wav|mp4|webm|vtt|pdf|txt|xml|json|js|css|map|woff2?|ttf)$).*)",
      // Only requests that carry a view choice reach the proxy at all.
      has: [{ type: "query", key: "view" }],
    },
  ],
};
