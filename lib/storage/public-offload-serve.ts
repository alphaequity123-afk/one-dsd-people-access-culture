import "server-only";
import { getMediaObject, mediaBucketConfiguration, MediaBucketError, type MediaBucketConfiguration } from "./media-bucket";
import { offloadedPublicFile, PUBLIC_OFFLOAD_PREFIX, type OffloadedPublicFile } from "./public-offload-manifest";

/** One "bytes=a-b", "bytes=a-" or "bytes=-n" range, clamped to the file; null for none, "invalid" when it cannot be met. */
export function parseRange(header: string | null, size: number): [number, number] | null | "invalid" {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return null; // Multiple or unknown ranges: answer with the whole file.
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (suffix <= 0) return "invalid";
    return [Math.max(0, size - suffix), size - 1];
  }
  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (start >= size || end < start) return "invalid";
  return [start, end];
}

function cacheControl(publicPath: string) {
  // Same rule as next.config.ts headers(): hashed video and course data addresses never change.
  if (publicPath.startsWith("/videos/") || publicPath.startsWith("/learning/self-directed/data/")) return "public, max-age=31536000, immutable";
  return "public, max-age=3600";
}

function notFound() {
  return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}

/** Answers a public address whose file the build moved to the media bucket, as the static file server did. */
export async function servePublicOffload(request: Request, publicPath: string | null, options: {
  config?: MediaBucketConfiguration; lookup?: (publicPath: string) => OffloadedPublicFile | undefined;
  get?: typeof getMediaObject;
} = {}): Promise<Response> {
  const entry = publicPath ? (options.lookup ?? offloadedPublicFile)(publicPath) : undefined;
  if (!publicPath || !entry) return notFound();
  const config = options.config ?? mediaBucketConfiguration();
  if (!config) {
    console.error("public_offload_unavailable: the media bucket settings are missing.");
    return new Response("Temporarily unavailable", { status: 503, headers: { "cache-control": "no-store", "retry-after": "30" } });
  }
  const etag = `"${entry.sha256}"`;
  const base: Record<string, string> = {
    "content-type": entry.type, "accept-ranges": "bytes", etag,
    "cache-control": cacheControl(publicPath), "x-content-type-options": "nosniff",
  };
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch.split(",").map(value => value.trim().replace(/^W\//, "")).includes(etag)) {
    return new Response(null, { status: 304, headers: { etag, "cache-control": base["cache-control"] } });
  }
  // A Range that no longer matches the validator gets the whole file, as RFC 9110 If-Range asks.
  const ifRange = request.headers.get("if-range");
  const range = ifRange && ifRange !== etag ? null : parseRange(request.headers.get("range"), entry.bytes);
  if (range === "invalid") {
    return new Response(null, { status: 416, headers: { ...base, "content-range": `bytes */${entry.bytes}` } });
  }
  const length = range ? range[1] - range[0] + 1 : entry.bytes;
  const headers = { ...base, "content-length": String(length), ...(range ? { "content-range": `bytes ${range[0]}-${range[1]}/${entry.bytes}` } : {}) };
  if (request.method === "HEAD") return new Response(null, { status: range ? 206 : 200, headers });
  try {
    const object = await (options.get ?? getMediaObject)(config, PUBLIC_OFFLOAD_PREFIX + entry.sha256, range ?? undefined);
    if (!object?.body) {
      console.error(`public_offload_missing ${entry.sha256} ${publicPath}`);
      return notFound();
    }
    return new Response(object.body, { status: range ? 206 : 200, headers });
  } catch (error) {
    console.error("public_offload_read_failed", error instanceof MediaBucketError ? error.status : error instanceof Error ? error.message : error);
    return new Response("Temporarily unavailable", { status: 503, headers: { "cache-control": "no-store", "retry-after": "10" } });
  }
}
