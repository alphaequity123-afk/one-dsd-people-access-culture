import { REFERRAL_ONLY_COURSE_IDS, RETIRED_RESOURCE_IDS } from "@/lib/program/retired-features";
import type { NextRequest } from "next/server";
import { isDownloadKind } from "@/lib/downloads/catalog";
import {
  downloadFileName,
  isAnyDownloadFormat,
  isDownloadFormat,
  type AnyDownloadFormat,
  type DownloadFormat,
  type ResourceDocument,
} from "@/lib/downloads/model";
import { downloadFormatDetails } from "@/lib/downloads/model";
import { requestedContentScope } from "@/lib/product/request-context";

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

function renderErrorDetail(error: unknown): { name: string; message: string } {
  if (error instanceof Error) {
    return { name: error.name.slice(0, 80), message: error.message.slice(0, 400) };
  }
  return { name: "UnknownError", message: String(error).slice(0, 400) };
}

/** One exporter per request so a missing office/pdfkit file cannot take down the other formats. */
const BINARY_EXPORTERS: Record<DownloadFormat, () => Promise<(document: ResourceDocument) => Promise<Buffer>>> = {
  docx: () => import("@/lib/downloads/exporters/docx").then((mod) => mod.renderDocx),
  xlsx: () => import("@/lib/downloads/exporters/xlsx").then((mod) => mod.renderXlsx),
  pptx: () => import("@/lib/downloads/exporters/pptx").then((mod) => mod.renderPptx),
  pdf: () => import("@/lib/downloads/exporters/pdf").then((mod) => mod.renderPdf),
};

async function fallbackFile(document: ResourceDocument, prefer: "html" | "txt" = "html"): Promise<{ file: Buffer; format: "html" | "txt" }> {
  const { renderHtml, renderText } = await import("@/lib/downloads/exporters/text");
  try {
    return { file: prefer === "txt" ? renderText(document) : renderHtml(document), format: prefer };
  } catch {
    return { file: renderText(document), format: "txt" };
  }
}

type DownloadContext = { params: Promise<{ kind: string; id: string }> };

/** HEAD and GET resolve exactly the same public, published document. */
async function downloadRequest(request: NextRequest, { params }: DownloadContext): Promise<Response | { document: ResourceDocument; kind: string; format: AnyDownloadFormat }> {
  const { kind, id } = await params;
  if (REFERRAL_ONLY_COURSE_IDS.has(id) || RETIRED_RESOURCE_IDS.has(id)) return problem(410, "This material is no longer offered here. Use the staff support directory for referral guidance.");
  const format = request.nextUrl.searchParams.get("format") ?? "";
  if (!isAnyDownloadFormat(format)) return problem(400, "Choose Word, Excel, PowerPoint, PDF, a web page, or plain text.");
  if (!isDownloadKind(kind)) return problem(404, "This resource is not available to download.");

  let document;
  try {
    const { resolveDownloadDocument } = await import("@/lib/downloads/resolve");
    document = await resolveDownloadDocument(kind, id, await requestedContentScope());
  } catch (error) {
    console.error("download_resolve_failed", { kind, format, ...renderErrorDetail(error) });
    return problem(503, "This resource could not be prepared for download.");
  }
  if (!document) return problem(404, "This resource is not available to download.");

  return { document, kind, format };
}

/** Check the destination without producing a large Office/PDF file. */
export async function HEAD(request: NextRequest, context: DownloadContext) {
  const ready = await downloadRequest(request, context);
  if (ready instanceof Response) return new Response(null, { status: ready.status, headers: ready.headers });
  const fileName = downloadFileName(ready.document.title, ready.format);
  return new Response(null, { status: 200, headers: {
    "content-type": downloadFormatDetails(ready.format).contentType,
    "content-disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
    "x-download-readiness": "available",
  } });
}

export async function GET(request: NextRequest, context: DownloadContext) {
  const ready = await downloadRequest(request, context);
  if (ready instanceof Response) return ready;
  const { document, kind, format } = ready;

  if (format === "html" || format === "txt") {
    try {
      const { renderHtml, renderText } = await import("@/lib/downloads/exporters/text");
      return attachment(format === "txt" ? renderText(document) : renderHtml(document), format, document.title);
    } catch (error) {
      console.error("download_fallback_failed", { kind, format, ...renderErrorDetail(error) });
      return problem(503, "This resource could not be prepared for download.");
    }
  }

  try {
    const render = await BINARY_EXPORTERS[format]();
    const file = await render(document);
    return attachment(file, format, document.title);
  } catch (error) {
    console.error("download_render_failed", { kind, format, ...renderErrorDetail(error) });
    if (!isDownloadFormat(format)) return problem(503, "This resource could not be prepared for download.");
    try {
      const fallback = await fallbackFile(document, "html");
      return attachment(fallback.file, fallback.format, document.title, true);
    } catch (fallbackError) {
      console.error("download_fallback_failed", { kind, format, ...renderErrorDetail(fallbackError) });
      return problem(503, "This resource could not be prepared for download. Please try again later.");
    }
  }
}
