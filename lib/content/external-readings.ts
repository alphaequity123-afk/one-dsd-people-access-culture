import manifest from "@/data/source-readings/manifest.json";
import unavailable from "@/data/source-readings/unavailable.json";
import sourceRedirects from "@/data/source-readings/source-redirects.json";

export type ReadingEntry = { id: string; title: string; url: string; original: string; format: string; anchors?: Record<string, number> };
export const EXTERNAL_READINGS = manifest as ReadingEntry[];
export function readingUrlKey(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port) return null;
    url.hash = "";
    return url.href.replace(/\/$/, "");
  } catch { return null; }
}
const byUrl = new Map(EXTERNAL_READINGS.flatMap(entry => [[readingUrlKey(entry.url), entry], [readingUrlKey(entry.original), entry]] as const));
const byId = new Map(EXTERNAL_READINGS.map(entry => [entry.id, entry]));
const unavailableUrls = new Set<string>(unavailable);
const verifiedRedirects = new Map(sourceRedirects.map(entry => [readingUrlKey(entry.from), entry.to]));
/** Only specific, reviewed replacements change a publisher destination. */
export function externalSourceHref(raw: string): string | undefined {
  const key = readingUrlKey(raw);
  if (!key) return raw;
  const replacement = verifiedRedirects.get(key);
  const destination = replacement ? replacement + new URL(raw).hash : raw;
  return unavailableUrls.has(readingUrlKey(destination) ?? "") ? undefined : destination;
}
export const externalReading = (id: string) => byId.get(id);
export const externalReadingForUrl = (url: string) => byUrl.get(readingUrlKey(url)) ?? byUrl.get(readingUrlKey(externalSourceHref(url) ?? url));
export function externalReadingHref(url: string): string | undefined {
  const entry = externalReadingForUrl(url);
  if (!entry) return undefined;
  const hash = new URL(url).hash;
  let anchor = hash.slice(1);
  try { anchor = decodeURIComponent(anchor); } catch { /* Preserve literal publisher fragment. */ }
  const section = entry.anchors?.[anchor];
  if (hash && !section) return undefined;
  return `/source-reading/${entry.id}${section ? `?section=${section}` : ""}${hash}`;
}
export const unavailableExternalUrl = (url: string) => externalSourceHref(url) === undefined;
