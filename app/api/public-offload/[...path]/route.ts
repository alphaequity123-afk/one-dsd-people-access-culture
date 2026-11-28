import type { NextRequest } from "next/server";
import { servePublicOffload } from "@/lib/storage/public-offload-serve";

// proxy.ts rewrites a public address here (/api/public-offload/<same path>) only when the build
// moved that file to the media bucket. The path travels in the route parameters, which survive a
// proxy rewrite; Next decodes each segment.
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ path: string[] }> };

async function publicPath(context: Context) {
  const { path } = await context.params;
  return Array.isArray(path) && path.length ? "/" + path.join("/") : null;
}

export async function GET(request: NextRequest, context: Context) {
  return servePublicOffload(request, await publicPath(context));
}

export async function HEAD(request: NextRequest, context: Context) {
  return servePublicOffload(request, await publicPath(context));
}
