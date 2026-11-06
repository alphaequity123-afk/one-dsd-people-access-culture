import "server-only";
import { getPolicy } from "@/lib/content/hub/dsd-policies";
import { POLICY_LIMITS, type PolicySource } from "./contract";
import { PolicyAnalysisError } from "./errors";

// Reads the official source named by a catalog entry. Only the catalog's own address is
// ever fetched, never an address someone supplies. HTTPS only; redirects stay within the
// same site family; 15 second limit; 3 MB limit.

const TIMEOUT_MS = 15_000;
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 5;

/** The site family a host belongs to: the last three labels under ".us" (state.mn.us), otherwise the last two (mn.gov). */
export function hostFamily(host: string): string {
  const labels = host.toLowerCase().replace(/\.$/, "").split(".");
  const count = labels[labels.length - 1] === "us" && labels.length >= 3 ? 3 : 2;
  return labels.slice(-count).join(".");
}

export function sameHostFamily(from: URL, to: URL): boolean {
  return hostFamily(from.hostname) === hostFamily(to.hostname);
}

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", hellip: "…", middot: "·", bull: "•", sect: "§", para: "¶", copy: "©", reg: "®" };
function decode(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    const code = entity[0] === "#" ? (entity[1] === "x" || entity[1] === "X" ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10)) : NaN;
    if (entity[0] === "#") return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : " ";
    return NAMED[entity.toLowerCase()] ?? match;
  });
}

/** Readable text from an HTML page: no scripts, styles or navigation; headings and blocks on their own lines. */
export function htmlToReadableText(html: string): string {
  const body = (/<main[\s>][\s\S]*?<\/main>/i.exec(html)?.[0]) ?? html;
  const stripped = body
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|nav|noscript|svg|template|iframe|footer|aside)\b[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi, (_match, _level, inner: string) => `\n\n${inner.replace(/<[^>]*>/g, " ")}\n`)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|section|article|li|ul|ol|tr|table|blockquote|dd|dt|dl|pre|h[1-6])\b[^>]*>/gi, "\n")
    .replace(/<\/t[dh]\s*>/gi, " \t ")
    .replace(/<[^>]*>/g, " ");
  return decode(stripped)
    .split("\n")
    .map(line => line.replace(/[\s ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Keep the text inside the case limit, with a visible line saying it was shortened. */
export function truncateSourceText(text: string, limit: number = POLICY_LIMITS.sourceCharacters): string {
  if (text.length <= limit) return text;
  const note = "\n\n[The text was shortened here to fit the case. Read the rest in the official source.]";
  return text.slice(0, limit - note.length).trimEnd() + note;
}

async function readCapped(response: Response): Promise<Uint8Array> {
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > MAX_BYTES) { await response.body?.cancel().catch(() => undefined); throw new PolicyAnalysisError("source_unreadable"); }
  const reader = response.body?.getReader();
  if (!reader) throw new PolicyAnalysisError("source_unreadable");
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const part = await reader.read(); if (part.done) break;
      length += part.value.byteLength;
      if (length > MAX_BYTES) { await reader.cancel().catch(() => undefined); throw new PolicyAnalysisError("source_unreadable"); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}

const PDF_TEXT_BUDGET = 110_000;
const PDF_MAX_PAGES = 400;

async function pdfToText(bytes: Uint8Array): Promise<string> {
  // Official catalog sources are often long reports and manuals. Read pages in order until the
  // source limit, then say plainly which pages are included rather than refusing the document.
  if (Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-") throw new PolicyAnalysisError("source_unsupported");
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({ data: Uint8Array.from(bytes), useSystemFonts: false, useWasm: false, disableFontFace: true, maxImageSize: 0, verbosity: 0 });
  const timer = setTimeout(() => { void task.destroy().catch(() => undefined); }, 30000);
  try {
    const document = await task.promise;
    const lastPage = Math.min(document.numPages, PDF_MAX_PAGES);
    const pages: string[] = [];
    let total = 0, readThrough = 0;
    for (let pageNumber = 1; pageNumber <= lastPage; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      try {
        const content = await page.getTextContent();
        const text = content.items.map(item => "str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : "").join("").replace(/[ \t]+\n/g, "\n").trim();
        if (total + text.length + 20 > PDF_TEXT_BUDGET) break;
        total += text.length + 20;
        readThrough = pageNumber;
        if (text) pages.push(`Page ${pageNumber}\n${text}`);
      } finally { page.cleanup(); }
    }
    if (!pages.length) throw new PolicyAnalysisError("source_unsupported");
    const note = readThrough < document.numPages
      ? `[Pages 1 to ${readThrough} of ${document.numPages} are included. Attach the later pages separately if the analysis needs them.]`
      : `[All ${document.numPages} pages are included. Images, charts and layout are not interpreted.]`;
    return `${note}\n\n${pages.join("\n\n")}`;
  } catch (error) {
    if (error instanceof PolicyAnalysisError) throw error;
    throw new PolicyAnalysisError("source_unsupported");
  } finally { clearTimeout(timer); await task.destroy().catch(() => undefined); }
}

/** Fetch the official source text of a catalog policy. Only the catalog's address is fetched. */
export async function fetchCatalogSource(catalogId: string, fetcher: typeof fetch = fetch, now = new Date()): Promise<PolicySource> {
  const policy = getPolicy(catalogId);
  if (!policy) throw new PolicyAnalysisError("not_found", "This policy is not in the catalog.");
  let url: URL;
  try { url = new URL(policy.source.url); } catch { throw new PolicyAnalysisError("source_unreadable"); }
  if (url.protocol !== "https:" || url.username || url.password) throw new PolicyAnalysisError("source_unreadable");
  const origin = url;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let response: Response | undefined;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      response = await fetcher(url.toString(), { method: "GET", redirect: "manual", signal: controller.signal, headers: { accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,text/plain;q=0.8" } });
      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel().catch(() => undefined);
        const location = response.headers.get("location");
        if (!location || hop === MAX_REDIRECTS) throw new PolicyAnalysisError("source_unreadable");
        const next = new URL(location, url);
        if (next.protocol !== "https:" || next.username || next.password || !sameHostFamily(origin, next)) throw new PolicyAnalysisError("source_unreadable");
        url = next;
        continue;
      }
      break;
    }
    if (!response || !response.ok) { await response?.body?.cancel().catch(() => undefined); throw new PolicyAnalysisError("source_unreadable"); }
    const type = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const bytes = await readCapped(response);
    const isPdf = type === "application/pdf" || Buffer.from(bytes.subarray(0, 5)).toString("ascii") === "%PDF-";
    let text: string;
    if (isPdf) text = await pdfToText(bytes);
    else if (type === "text/html" || type === "application/xhtml+xml" || type === "") text = htmlToReadableText(new TextDecoder("utf-8").decode(bytes));
    else if (type === "text/plain") text = new TextDecoder("utf-8").decode(bytes).trim();
    else throw new PolicyAnalysisError("source_unsupported");
    if (!text.trim()) throw new PolicyAnalysisError("source_unreadable");
    const date = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Chicago" }).format(now);
    return {
      id: `catalog-${catalogId}`,
      title: policy.source.title,
      text: truncateSourceText(text),
      url: policy.source.url,
      ...(policy.source.date ? { date: policy.source.date } : {}),
      origin: "catalog",
      note: `Text retrieved from the official source on ${date}.`,
    };
  } catch (error) {
    if (error instanceof PolicyAnalysisError) throw error;
    throw new PolicyAnalysisError("source_unreadable");
  } finally { clearTimeout(timer); }
}
