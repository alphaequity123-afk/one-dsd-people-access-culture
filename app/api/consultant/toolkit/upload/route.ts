import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { acceptsDocumentUpload, extractDocumentUpload, MAX_UPLOAD_BYTES, MAX_UPLOAD_REQUEST_BYTES, UploadError } from "@/lib/consultant-analysis/uploads";
import { isTabularUpload, extractTabularUpload } from "@/lib/consultant-toolkit/tabular-upload";
import { toolkitAccess, toolkitCapacity, toolkitFailure, toolkitJson } from "@/lib/consultant-toolkit/http";

export const runtime = "nodejs";
export const maxDuration = 90;
async function boundedForm(request: NextRequest) {
  const type = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data\s*;/i.test(type) || !/boundary=/i.test(type)) throw new UploadError("Choose a document using the attachment button.", 415);
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_UPLOAD_REQUEST_BYTES)) throw new UploadError("Choose a document no larger than 20 MB.", 413);
  const reader = request.body?.getReader(); if (!reader) throw new UploadError("Choose a document.", 400);
  const chunks: Uint8Array[] = []; let length = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new UploadError("The upload took too long. Try a smaller document.", 408)), 30000); });
  try {
    while (true) {
      const part = await Promise.race([reader.read(), timeout]); if (part.done) break;
      length += part.value.byteLength; if (length > MAX_UPLOAD_REQUEST_BYTES) throw new UploadError("Choose a document no larger than 20 MB.", 413);
      chunks.push(part.value);
    }
    return await new Response(Buffer.concat(chunks), { headers: { "content-type": type } }).formData();
  } catch (error) { await reader.cancel().catch(() => undefined); throw error; }
  finally { if (timer) clearTimeout(timer); reader.releaseLock(); }
}

export async function POST(request: NextRequest) {
  const denied = await toolkitAccess(request, true); if (denied) return denied;
  const release = toolkitCapacity("upload");
  if (!release) return toolkitJson({ error: "Finish the current upload or try again in a few minutes." }, 429);
  try {
    const form = await boundedForm(request);
    if ([...form.keys()].some(key => key !== "file") || form.getAll("file").length !== 1 || !(form.get("file") instanceof File)) throw new UploadError("Choose one document to attach.", 400);
    const file = form.get("file") as File;
    if (!file.size || file.size > MAX_UPLOAD_BYTES) throw new UploadError("Choose a nonempty document no larger than 20 MB.", 413);
    const name = file.name.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f]/g, "").trim() ?? "";
    const tabular = isTabularUpload(name);
    if (!name || (!tabular && !acceptsDocumentUpload(name))) throw new UploadError("Choose PDF, Word (.docx), PowerPoint (.pptx), text, CSV, TSV, or Excel (.xlsx).", 415);
    const bytes = new Uint8Array(await file.arrayBuffer());
    // All extraction here is server-local. There is no provider, web-search or publication call.
    const result = tabular ? await extractTabularUpload(name, bytes) : await extractDocumentUpload(bytes, name);
    return toolkitJson({ source: { id: `upload-${randomUUID()}`, title: name.slice(0, 300), text: result.text }, ...(result.note ? { note: result.note } : {}) });
  } catch (error) {
    if (error instanceof UploadError) return toolkitJson({ error: error.message }, error.status);
    return toolkitFailure(error);
  } finally { release(); }
}
