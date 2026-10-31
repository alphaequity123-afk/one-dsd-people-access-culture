import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { ownerFromRequest } from "@/lib/auth/request";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { acceptsDocumentUpload, extractDocumentUpload, MAX_UPLOAD_BYTES, MAX_UPLOAD_REQUEST_BYTES, MAX_UPLOAD_TEXT, UploadError } from "@/lib/consultant-analysis/uploads";
import { acceptsMediaUpload, extractMediaUpload, MediaUploadError } from "@/lib/consultant-analysis/media-upload";

export const runtime = "nodejs";
export const maxDuration = 300;
const headers = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
let inFlight = 0;
let attempts: number[] = [];

async function boundedForm(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data\s*;/i.test(contentType) || !/boundary=/i.test(contentType)) throw new UploadError("Choose a file using the upload button.", 415);
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)))) throw new UploadError("The file size could not be checked. Choose the file again.", 400);
  if (declared !== null && Number(declared) > MAX_UPLOAD_REQUEST_BYTES) throw new UploadError("Choose a file no larger than 20 MB.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new UploadError("Choose a file to upload.", 400);
  const chunks: Uint8Array[] = [];
  let received = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new UploadError("The upload took too long. Your working copy is unchanged; try a smaller file.", 408)), 30000);
  });
  try {
    while (true) {
      const item = await Promise.race([reader.read(), deadline]);
      if (item.done) break;
      received += item.value.byteLength;
      if (received > MAX_UPLOAD_REQUEST_BYTES) throw new UploadError("Choose a file no larger than 20 MB.", 413);
      chunks.push(item.value);
    }
    return await new Response(Buffer.concat(chunks), { headers: { "content-type": contentType } }).formData();
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    if (error instanceof UploadError) throw error;
    throw new UploadError("The file could not be received. Your working copy is unchanged; choose the file again.", 400);
  } finally { if (timer) clearTimeout(timer); reader.releaseLock(); }
}

export async function POST(request: NextRequest) {
  if (!(await ownerFromRequest(request))) return json({ error: "Sign in to the Consultant Workspace to add a file." }, 401);
  if (!isSameOriginMutation(request)) return json({ error: "Open the Consultant Workspace in the program before adding a file." }, 403);
  const now = Date.now();
  attempts = attempts.filter(at => now - at < 600000);
  if (inFlight >= 2 || attempts.length >= 10) return json({ error: "Finish the current upload or try again in a few minutes. Your working copy is unchanged." }, 429);
  inFlight += 1;
  attempts.push(now);
  try {
    const form = await boundedForm(request);
    if (form.getAll("publicMaterialConfirmed").length !== 1 || form.get("publicMaterialConfirmed") !== "true") {
      throw new UploadError("Confirm that this file is public or contains no private information before uploading it.", 400);
    }
    const files = form.getAll("file");
    if (files.length !== 1 || !(files[0] instanceof File)) throw new UploadError("Choose one file to add.", 400);
    for (const [key] of form) if (!["file", "publicMaterialConfirmed"].includes(key)) throw new UploadError("Choose the file again using this workspace.", 400);
    const file = files[0];
    if (!file.size) throw new UploadError("This file is empty. Choose a file with content.", 400);
    if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Choose a file no larger than 20 MB.", 413);
    const fileName = file.name.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f]/g, "").trim() ?? "";
    if (!fileName) throw new UploadError("This file has no readable name. Rename it and try again.", 400);
    const document = acceptsDocumentUpload(fileName);
    const media = !document && acceptsMediaUpload(fileName, file.type);
    if (!document && !media) throw new UploadError("Choose a PDF, Word document, PowerPoint, text file, or supported image, audio, or video file.", 415);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const extracted = document ? await extractDocumentUpload(bytes, fileName) : await extractMediaUpload(bytes, fileName, file.type);
    if (!extracted.text?.trim()) throw new UploadError("No readable material was found. Try a clearer file or add a transcript.");
    if (extracted.text.length > MAX_UPLOAD_TEXT) throw new UploadError("The file contains too much material for one source. Upload a shorter section.", 413);
    return json({ source: { id: `upload-${randomUUID()}`, title: fileName.slice(0, 300), text: extracted.text }, ...(extracted.note ? { note: extracted.note } : {}) });
  } catch (error) {
    if (error instanceof UploadError || error instanceof MediaUploadError) return json({ error: error.message }, error.status);
    return json({ error: "The file could not be read. Your working copy is unchanged. Try another copy or paste the relevant text." }, 422);
  } finally { inFlight -= 1; }
}
