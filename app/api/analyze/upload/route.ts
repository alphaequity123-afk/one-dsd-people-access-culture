import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { acceptsDocumentUpload, extractDocumentUpload, MAX_UPLOAD_BYTES, MAX_UPLOAD_REQUEST_BYTES, UploadError } from "@/lib/consultant-analysis/uploads";
import { isTabularUpload, extractTabularUpload } from "@/lib/consultant-toolkit/tabular-upload";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { consumeRequestLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { ANALYSIS_LIMITS, type UploadResponse } from "@/lib/analysis/contract";

// Staff "Analyze a document" upload. No sign-in. The file is read into text in
// memory and returned to the browser. Nothing is written to a database, a file
// or a log; logs carry only a trace id and the outcome.
export const runtime = "nodejs";
export const maxDuration = 90;

const READ_TIMEOUT_MS = 30000;
// Shares the registered equity-register request limit; the live database accepts only registered scopes.
const RATE_LIMIT = { scope: "staff-equity-register", limit: 60, windowSeconds: 600 } as const;
const headers = { "cache-control": "private, no-store, max-age=0", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) => NextResponse.json(body, { status, headers: { ...headers, ...extra } });

// A small in-process guard so concurrent uploads cannot hold every worker. This is a
// concurrency cap only: the per-person allowance is the rate limit above, so one
// person's uploads never use up a process-wide count that locks everyone else out.
const MAX_ACTIVE_UPLOADS = 2;
const capacity = { active: 0 };
function reserveCapacity(): (() => void) | null {
  if (capacity.active >= MAX_ACTIVE_UPLOADS) return null;
  capacity.active++;
  return () => { capacity.active = Math.max(0, capacity.active - 1); };
}

async function boundedForm(request: NextRequest) {
  const type = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data\s*;/i.test(type) || !/boundary=/i.test(type)) throw new UploadError("Choose a document using the attachment button.", 415);
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_UPLOAD_REQUEST_BYTES)) throw new UploadError("Choose a document no larger than 20 MB.", 413);
  const reader = request.body?.getReader(); if (!reader) throw new UploadError("Choose a document.", 400);
  const chunks: Uint8Array[] = []; let length = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new UploadError("The upload took too long. Try a smaller document.", 408)), READ_TIMEOUT_MS); });
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
  const traceId = randomUUID();
  if (!isSameOriginMutation(request)) return json({ error: "Open Analyze a document from the program before attaching a file." }, 403);
  let limit;
  try { limit = await consumeRequestLimit(request, RATE_LIMIT); }
  catch { console.error(`analyze-upload ${traceId} rate-limit-unavailable`); return json({ error: "Documents cannot be read right now. Try again in a few minutes." }, 503); }
  if (!limit.allowed) return json({ error: "Too many documents were attached in a short time. Try again in a few minutes." }, 429, rateLimitHeaders(limit));
  const release = reserveCapacity();
  if (!release) return json({ error: "Other documents are being read right now. Wait a moment and attach the file again." }, 429);
  try {
    const form = await boundedForm(request);
    if ([...form.keys()].some(key => key !== "file") || form.getAll("file").length !== 1 || !(form.get("file") instanceof File)) throw new UploadError("Choose one document to attach.", 400);
    const file = form.get("file") as File;
    if (!file.size || file.size > MAX_UPLOAD_BYTES) throw new UploadError("Choose a nonempty document no larger than 20 MB.", 413);
    const name = file.name.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f]/g, "").trim() ?? "";
    const tabular = isTabularUpload(name);
    if (!name || (!tabular && !acceptsDocumentUpload(name))) throw new UploadError("Choose a PDF, Word, PowerPoint, Excel, comma-separated, tab-separated or plain text file.", 415);
    const bytes = new Uint8Array(await file.arrayBuffer());
    // All extraction is server-local. There is no provider or web call.
    const result = tabular ? await extractTabularUpload(name, bytes) : await extractDocumentUpload(bytes, name);
    const body: UploadResponse = {
      source: { id: `upload-${randomUUID()}`, title: name.slice(0, ANALYSIS_LIMITS.titleCharacters), text: result.text },
      ...(result.note ? { note: result.note } : {}),
    };
    return json(body);
  } catch (error) {
    if (error instanceof UploadError) { return json({ error: error.message }, error.status); }
    // Parser errors can carry file contents. Never serialize or log them.
    console.error(`analyze-upload ${traceId} failed`);
    return json({ error: "This document could not be read. Try again, or paste its text instead." }, 500);
  } finally { release(); }
}
