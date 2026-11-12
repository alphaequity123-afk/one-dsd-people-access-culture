import type { NextRequest } from "next/server";
import { createReadStream } from "node:fs";
import { lstat, realpath } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { ownerFromRequest } from "@/lib/auth/request";
import type { ResourceArtifact } from "@/lib/learning/resource-artifact-types";
import {
  creationFileNames, creationJobId, creationOutputDirectory, findCreationJob, type CreationFileKind,
} from "@/lib/learning/resource-creation-store";
import { requestedContentScope } from "@/lib/product/request-context";

export const runtime = "nodejs";
const noStore = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
const empty = (status: number) => new Response(null, { status, headers: noStore });

function citationOrigin(request: NextRequest): string | undefined {
  const configured = process.env.PAC_PUBLIC_ORIGIN?.trim();
  if (!configured && process.env.RAILWAY_DEPLOYMENT_ID) return undefined;
  const url = new URL(configured || request.nextUrl.origin);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return undefined;
  if (url.protocol !== "https:" && (url.protocol !== "http:" || process.env.RAILWAY_DEPLOYMENT_ID)) return undefined;
  return url.origin;
}

function byteBounds(range: string, size: number): [number, number] | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  return Number.isSafeInteger(start) && Number.isSafeInteger(end) && start <= end && end < size
    ? [start, end] : null;
}

async function serve(request: NextRequest, context: { params: Promise<{ id: string }> }, head: boolean) {
  if (!(await ownerFromRequest(request))) return empty(401);
  const { id } = await context.params;
  const key = request.nextUrl.searchParams.get("kind");
  if (!creationJobId.test(id) || !key || (key !== "pptx" && !Object.hasOwn(creationFileNames, key))) return empty(404);
  try {
    const job = findCreationJob(id, await requestedContentScope());
    if (job?.status !== "ready") return empty(404);
    if (key === "pptx") {
      if (job.kind !== "slides" || !job.artifact) return empty(404);
      const artifact = JSON.parse(job.artifact) as ResourceArtifact;
      if (artifact.version !== 1 || artifact.kind !== "slides" || artifact.sourceRevision !== job.revision
        || artifact.resourcePath !== job.resourcePath) return empty(404);
      const origin = citationOrigin(request);
      if (!origin) return empty(503);
      const headers = new Headers({
        ...noStore, "content-type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "content-disposition": 'attachment; filename="learning-slides-draft.pptx"',
      });
      if (head) return new Response(null, { headers });
      const { resourcePowerPoint } = await import("@/lib/learning/resource-powerpoint");
      const deck = await resourcePowerPoint(artifact, origin);
      headers.set("content-length", String(deck.byteLength));
      return new Response(deck, { headers });
    }
    const kind = key as CreationFileKind;
    const definition = creationFileNames[kind];
    if (!job.files || !(JSON.parse(job.files) as CreationFileKind[]).includes(kind)) return empty(404);
    const file = join(creationOutputDirectory(id), definition.name);
    const stat = await lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink() || await realpath(file) !== file || stat.size <= 0) return empty(404);
    const headers = new Headers({
      ...noStore, "content-type": definition.mime, "accept-ranges": "bytes",
      "content-disposition": `${request.nextUrl.searchParams.has("download") ? "attachment" : "inline"}; filename="${definition.name}"`,
    });
    const range = head ? null : request.headers.get("range");
    const bounds = range ? byteBounds(range, stat.size) : null;
    if (range && !bounds) {
      headers.set("content-range", `bytes */${stat.size}`);
      return new Response(null, { status: 416, headers });
    }
    const [start, end] = bounds ?? [0, stat.size - 1];
    headers.set("content-length", String(end - start + 1));
    if (bounds) headers.set("content-range", `bytes ${start}-${end}/${stat.size}`);
    const stream = head ? null : Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream<Uint8Array>;
    return new Response(stream, { status: bounds ? 206 : 200, headers });
  } catch {
    return empty(404);
  }
}

export function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return serve(request, context, false);
}

export function HEAD(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return serve(request, context, true);
}
