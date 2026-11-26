import { NextResponse, type NextRequest } from "next/server";
import { applyRequestedView } from "@/lib/product/view-proxy";
import { retiredFeatureDestination } from "@/lib/program/retired-features";
import { upgradedImagePath } from "@/lib/content/image-4k";
import { offloadedPublicFile } from "@/lib/storage/public-offload-manifest";

/** A public file the Docker build moved to the media bucket is answered by /api/public-offload. */
function offloadRewrite(request: NextRequest, pathname: string) {
  let decoded: string;
  try { decoded = decodeURIComponent(pathname); } catch { return undefined; }
  if (!offloadedPublicFile(decoded)) return undefined;
  const target = request.nextUrl.clone();
  target.pathname = "/api/public-offload" + decoded.split("/").map(encodeURIComponent).join("/");
  target.search = "";
  return NextResponse.rewrite(target);
}

/** Retires excluded staff features and applies an explicitly requested program view. */
export function proxy(request: NextRequest) {
  // 4K image upgrade: a listed image is answered with its "<name>.4k.webp" sibling; the original stays for old links.
  const upgraded = upgradedImagePath(request.nextUrl.pathname);
  const offloaded = offloadRewrite(request, upgraded ?? request.nextUrl.pathname);
  if (offloaded) return offloaded;
  if (upgraded) {
    const target = request.nextUrl.clone();
    target.pathname = upgraded;
    return NextResponse.rewrite(target);
  }
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
    // Public images that may have a 4K sibling (see lib/content/image-4k.ts).
    "/learning/self-directed/covers/index.json",
    "/((?:images|learning|library|documents|videos|toolkit-work)/.+\\.(?:png|jpe?g|webp))",
    // Large public files the Docker build may have moved to the media bucket (scripts/public-offload.mjs).
    "/((?!api/|_next/).+\\.(?:png|jpe?g|webp|gif|avif|mp4|webm|mp3|wav|ogg|m4a|pdf|zip|pptx|docx|xlsx))",
    {
      // Pages only: never API routes, Next.js assets, or public files such as images and audio.
      // Only real file extensions are excluded, so a page id that contains a dot still matches.
      source: "/((?!api/|_next/|.*\\.(?:ico|png|jpe?g|webp|avif|gif|svg|mp3|m4a|wav|mp4|webm|vtt|pdf|txt|xml|json|js|css|map|woff2?|ttf)$).*)",
      // Only requests that carry a view choice reach the proxy at all.
      has: [{ type: "query", key: "view" }],
    },
  ],
};
