import "server-only";
import { extname } from "node:path";
import { SaxesParser } from "saxes";
import { fromBuffer, type Entry, type ZipFile } from "yauzl";
import { AsyncLocalStorage } from "node:async_hooks";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_UPLOAD_REQUEST_BYTES = 21 * 1024 * 1024;
export const MAX_UPLOAD_TEXT = 50000;
const MAX_EXPANDED_BYTES = 40 * 1024 * 1024;
const MAX_XML_BYTES = 8 * 1024 * 1024;
const MAX_PARTS = 3000;
const MAX_PAGES = 100;

/**
 * Reading limits for one upload. The consultant tools keep the small defaults their own request limits expect.
 * Ask reads whole documents: its model takes about a million tokens, so a long report or handbook fits.
 */
type ReadingLimits = { text: number; xmlBytes: number; pages: number };
const DEFAULT_LIMITS: ReadingLimits = { text: MAX_UPLOAD_TEXT, xmlBytes: MAX_XML_BYTES, pages: MAX_PAGES };
export const ASK_UPLOAD_TEXT = 1_200_000;
export const ASK_READING_LIMITS: ReadingLimits = { text: ASK_UPLOAD_TEXT, xmlBytes: 36 * 1024 * 1024, pages: 1000 };
const readingLimits = new AsyncLocalStorage<ReadingLimits>();
const limits = () => readingLimits.getStore() ?? DEFAULT_LIMITS;
/** Runs one extraction with the given limits (for example ASK_READING_LIMITS). */
export function withReadingLimits<T>(value: ReadingLimits, run: () => Promise<T>): Promise<T> { return readingLimits.run(value, run); }

export class UploadError extends Error {
  constructor(message: string, public status = 422) { super(message); this.name = "UploadError"; }
}
export type ExtractedUpload = { text: string; note?: string };

function finish(text: string, note?: string, retainReadingLimits = false): ExtractedUpload {
  const cleaned = text.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim();
  if (!cleaned) throw new UploadError("No readable text was found. If this is a scanned document, use a copy with selectable text or add a transcript.");
  const sourceText = retainReadingLimits && note ? `Reading limits\n${note}\n\nExtracted text\n${cleaned}` : cleaned;
  if (sourceText.length > limits().text) throw new UploadError("This document contains too much text for one source. Upload a shorter section or paste selected excerpts.", 413);
  return { text: sourceText, ...(note ? { note } : {}) };
}

function decode(bytes: Uint8Array) {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { throw new UploadError("This file could not be read as text. Save it as UTF-8 text or upload a supported document."); }
}

function xmlText(xml: string) {
  const parser = new SaxesParser({ xmlns: false });
  const parts: string[] = [];
  let inText = false;
  let length = 0;
  const add = (value: string) => {
    length += value.length;
    if (length > limits().text) throw new UploadError("This document contains too much text for one source. Upload a shorter section.", 413);
    parts.push(value);
  };
  parser.on("doctype", () => { throw new UploadError("This document uses an unsupported document structure. Save a new PDF or text copy and try again."); });
  parser.on("opentag", tag => {
    const local = tag.name.split(":").pop();
    if (local === "t") inText = true;
    if (local === "tab") add("\t");
    if (local === "br") add("\n");
  });
  parser.on("text", value => { if (inText) add(value); });
  parser.on("closetag", tag => {
    const local = tag.name.split(":").pop();
    if (local === "t") inText = false;
    if (local === "p") add("\n");
    if (local === "tc") add("\t");
  });
  parser.write(xml).close();
  return parts.join("");
}

/** No files are written, and no linked files or URLs are followed. */
async function officeParts(bytes: Uint8Array): Promise<Map<string, string>> {
  if (Buffer.from(bytes.subarray(0, 4)).toString("hex") !== "504b0304") throw new UploadError("This file does not match its document type. Save a new copy and try again.");
  return new Promise((resolve, reject) => {
    let archive: ZipFile | undefined;
    let stopped = false;
    const parts = new Map<string, string>();
    const names = new Set<string>();
    let expanded = 0;
    let count = 0;
    const fail = (error: unknown) => {
      if (stopped) return;
      stopped = true; archive?.close();
      reject(error instanceof UploadError ? error : new UploadError("This document could not be opened. Save a new, unprotected copy and try again."));
    };
    fromBuffer(Buffer.from(bytes), { lazyEntries: true, validateEntrySizes: true, strictFileNames: true }, (error, zip) => {
      if (error || !zip) { fail(error); return; }
      archive = zip;
      if (zip.entryCount > MAX_PARTS) { fail(new UploadError("This document has too many parts. Upload a shorter or simpler copy.", 413)); return; }
      zip.on("error", fail);
      zip.on("end", () => { if (!stopped) { stopped = true; resolve(parts); } });
      zip.on("entry", (entry: Entry) => {
        if (stopped) return;
        count += 1;
        expanded += entry.uncompressedSize;
        if (count > MAX_PARTS || expanded > MAX_EXPANDED_BYTES || !Number.isSafeInteger(expanded)) {
          fail(new UploadError("This document expands beyond the reading limit. Upload a shorter or simpler copy.", 413)); return;
        }
        if (names.has(entry.fileName) || (entry.generalPurposeBitFlag & 1) || /vbaProject\.bin$/i.test(entry.fileName)) {
          fail(new UploadError("This document contains protected or unsupported parts. Save a new PDF or plain document copy.")); return;
        }
        names.add(entry.fileName);
        const wanted = entry.fileName === "[Content_Types].xml" || entry.fileName === "word/document.xml"
          || /^word\/(?:header\d+|footer\d+|footnotes|endnotes)\.xml$/.test(entry.fileName)
          || entry.fileName === "ppt/presentation.xml" || entry.fileName === "ppt/_rels/presentation.xml.rels"
          || /^ppt\/slides\/slide\d+\.xml$/.test(entry.fileName);
        if (!wanted) { zip.readEntry(); return; }
        if (entry.uncompressedSize > limits().xmlBytes) { fail(new UploadError("A section of this document is too large. Upload a shorter copy.", 413)); return; }
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream) { fail(streamError); return; }
          const chunks: Buffer[] = [];
          let received = 0;
          stream.on("error", fail);
          stream.on("data", (chunk: Buffer) => {
            received += chunk.length;
            if (received > limits().xmlBytes || received > entry.uncompressedSize) {
              stream.destroy(); fail(new UploadError("A section of this document is too large or damaged. Upload a new copy.", 413)); return;
            }
            chunks.push(chunk);
          });
          stream.on("end", () => {
            if (stopped) return;
            try { parts.set(entry.fileName, decode(Buffer.concat(chunks))); zip.readEntry(); }
            catch (readError) { fail(readError); }
          });
        });
      });
      zip.readEntry();
    });
  });
}

function slideOrder(parts: Map<string, string>) {
  const relationships = new Map<string, string>();
  const relationshipParser = new SaxesParser({ xmlns: false });
  relationshipParser.on("doctype", () => { throw new UploadError("This presentation has an unsupported structure."); });
  relationshipParser.on("opentag", tag => {
    if (tag.name.split(":").pop() !== "Relationship") return;
    const attr = tag.attributes as Record<string, string>;
    if (attr.TargetMode === "External") return;
    if (/^slides\/slide\d+\.xml$/.test(attr.Target ?? "")) relationships.set(attr.Id, `ppt/${attr.Target}`);
  });
  relationshipParser.write(parts.get("ppt/_rels/presentation.xml.rels") ?? "").close();
  const ordered: string[] = [];
  const presentationParser = new SaxesParser({ xmlns: false });
  presentationParser.on("doctype", () => { throw new UploadError("This presentation has an unsupported structure."); });
  presentationParser.on("opentag", tag => {
    if (tag.name.split(":").pop() !== "sldId") return;
    const id = (tag.attributes as Record<string, string>)["r:id"];
    const target = relationships.get(id);
    if (!target || !parts.has(target)) throw new UploadError("A slide could not be read. Save a new PowerPoint or PDF copy and try again.");
    ordered.push(target);
    if (ordered.length > limits().pages) throw new UploadError("Use a presentation with fewer slides, or upload one section at a time.", 413);
  });
  presentationParser.write(parts.get("ppt/presentation.xml") ?? "").close();
  return ordered;
}

async function pdfText(bytes: Uint8Array): Promise<ExtractedUpload> {
  if (Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-") throw new UploadError("This file does not appear to be a PDF. Save a new PDF copy and try again.");
  // PDF.js is an external Node package. Its Node default resolves the worker
  // beside pdf.mjs; application-level require.resolve is rewritten by webpack
  // to a module number rather than a filesystem path in production builds.
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({ data: Uint8Array.from(bytes), useSystemFonts: false, useWasm: false, disableFontFace: true, maxImageSize: 0, verbosity: 0 });
  const timer = setTimeout(() => { void task.destroy().catch(() => undefined); }, 30000);
  try {
    const document = await task.promise;
    if (document.numPages > limits().pages) throw new UploadError("Use a PDF with fewer pages, or upload one section at a time.", 413);
    const pages: string[] = [];
    let total = 0;
    let emptyPages = 0;
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      try {
        const content = await page.getTextContent();
        const text = content.items.map(item => "str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : "").join("").trim();
        if (!text) emptyPages += 1;
        total += text.length + 20;
        if (total > limits().text) throw new UploadError("This PDF contains too much text for one source. Upload a shorter section.", 413);
        if (text) pages.push(`Page ${pageNumber}\n${text}`);
      } finally { page.cleanup(); }
    }
    return finish(pages.join("\n\n"), `Text extracted from ${document.numPages} PDF pages. Images, charts, and layout are not interpreted.${emptyPages ? ` ${emptyPages} pages had no readable text; review those pages separately.` : ""} Review the extracted text before analysis.`, true);
  } catch (error) {
    if (error instanceof UploadError) throw error;
    throw new UploadError("This PDF could not be read. If it is password-protected, scanned, or damaged, upload an unprotected copy with selectable text.");
  } finally { clearTimeout(timer); await task.destroy().catch(() => undefined); }
}

export function acceptsDocumentUpload(fileName: string) { return [".txt", ".pdf", ".docx", ".pptx"].includes(extname(fileName).toLowerCase()); }

export async function extractDocumentUpload(bytes: Uint8Array, fileName: string): Promise<ExtractedUpload> {
  if (!bytes.length) throw new UploadError("This file is empty. Choose a file with content.");
  if (bytes.length > MAX_UPLOAD_BYTES) throw new UploadError("Choose a file no larger than 20 MB.", 413);
  const extension = extname(fileName).toLowerCase();
  if (extension === ".txt") {
    const text = decode(bytes);
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) throw new UploadError("This file contains unreadable text. Save a UTF-8 text copy and try again.");
    return finish(text, "Text imported. Review it before analysis.");
  }
  if (extension === ".pdf") return pdfText(bytes);
  if (![".docx", ".pptx"].includes(extension)) throw new UploadError("Choose a PDF, Word document, PowerPoint presentation, or UTF-8 text file.", 415);
  try {
    const parts = await officeParts(bytes);
    const contentTypes = parts.get("[Content_Types].xml") ?? "";
    if (extension === ".docx") {
      if (!parts.has("word/document.xml") || !contentTypes.includes("wordprocessingml.document.main+xml")) throw new UploadError("This file does not contain a readable Word document.");
      const selected = ["word/document.xml", ...[...parts.keys()].filter(name => /^word\/(?:header\d+|footer\d+|footnotes|endnotes)\.xml$/.test(name)).sort()];
      return finish(selected.map(name => xmlText(parts.get(name)!)).join("\n\n"), "Word text imported, including tables, headers, footers, and footnotes when present. Images, comments, and layout are not interpreted. Review the text before analysis.", true);
    }
    if (!contentTypes.includes("presentationml.presentation.main+xml")) throw new UploadError("This file does not contain a readable PowerPoint presentation.");
    const slides = slideOrder(parts);
    const slideText = slides.map(name => xmlText(parts.get(name)!));
    if (!slideText.some(text => text.trim())) return finish("");
    return finish(slideText.map((text, index) => `Slide ${index + 1}\n${text.trim() || "No readable text on this slide."}`).join("\n\n"), "Slide text imported in presentation order. Images, charts, video, speaker notes, and layout are not interpreted. Review the slides alongside the extracted text.", true);
  } catch (error) {
    if (error instanceof UploadError) throw error;
    throw new UploadError("This document could not be read. Save a new PDF or plain document copy and try again.");
  }
}
