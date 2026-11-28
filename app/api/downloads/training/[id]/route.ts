import type { NextRequest } from "next/server";

import { trainingById, versionFor } from "@/lib/dsd-live/trainings/catalog";
import { JOB_FAMILIES } from "@/lib/dsd-live/workforce/matrix";

import { trainingDocument } from "@/lib/dsd-live/downloads/training";
import { downloadFileName, downloadFormatDetails, isAnyDownloadFormat, isDownloadFormat, type AnyDownloadFormat, type DownloadFormat, type ResourceDocument } from "@/lib/dsd-live/downloads/model";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function problem(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}

function attachment(file: Buffer, format: AnyDownloadFormat, title: string, fallback = false): Response {
  const fileName = downloadFileName(title, format);
  const body = new ArrayBuffer(file.byteLength);
  new Uint8Array(body).set(file);
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": downloadFormatDetails(format).contentType,
      "content-disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "content-length": String(file.byteLength),
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      ...(fallback ? { "x-download-fallback": format } : {}),
    },
  });
}

/** One exporter per request, so a problem in one format cannot take down the others. */
const BINARY_EXPORTERS: Record<DownloadFormat, () => Promise<(document: ResourceDocument) => Promise<Buffer>>> = {
  docx: () => import("@/lib/dsd-live/downloads/exporters/docx").then(mod => mod.renderDocx),
  xlsx: () => import("@/lib/dsd-live/downloads/exporters/xlsx").then(mod => mod.renderXlsx),
  pptx: () => import("@/lib/dsd-live/downloads/exporters/pptx").then(mod => mod.renderPptx),
  pdf: () => import("@/lib/dsd-live/downloads/exporters/pdf").then(mod => mod.renderPdf),
};

function detail(error: unknown) {
  return error instanceof Error ? { name: error.name.slice(0, 80), message: error.message.slice(0, 400) } : { name: "UnknownError", message: String(error).slice(0, 400) };
}

/** A Word, Excel, PowerPoint, PDF, web page or plain-text copy of one training version. Nothing is recorded about who downloads it. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format") ?? "";
  if (!isAnyDownloadFormat(format)) return problem(400, "Choose Word, Excel, PowerPoint, PDF, a web page, or plain text.");
  const t = trainingById(id);
  if (!t) return problem(404, "This training is not available to download.");
  const sim = versionFor(t, null, request.nextUrl.searchParams.get("version"));
  const versionTitle = sim.version === "all-staff" ? "All staff" : JOB_FAMILIES.find(f => f.id === sim.version)?.title ?? sim.version;
  // Behind the host's proxy the server sees its own internal address; the forwarded host is the one people use.
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim();
  const proto = (request.headers.get("x-forwarded-proto") ?? "https").split(",")[0].trim();
  const origin = /^[a-z0-9.-]+(:\d+)?$/i.test(host) && !host.startsWith("0.0.0.0") ? `${proto === "http" ? "http" : "https"}://${host}` : request.nextUrl.origin;
  const pageUrl = new URL(`/trainings/${t.id}?version=${sim.version}`, origin).toString();
  const document = trainingDocument(t, sim, versionTitle, pageUrl);

  const { renderHtml, renderText } = await import("@/lib/dsd-live/downloads/exporters/text");
  if (!isDownloadFormat(format)) return attachment(format === "txt" ? renderText(document) : renderHtml(document), format, document.title);
  try {
    const render = await BINARY_EXPORTERS[format]();
    return attachment(await render(document), format, document.title);
  } catch (error) {
    console.error("download_render_failed", { format, ...detail(error) });
    return attachment(renderHtml(document), "html", document.title, true);
  }
}
