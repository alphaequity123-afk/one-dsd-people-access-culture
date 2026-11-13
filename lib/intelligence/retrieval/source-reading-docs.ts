import "server-only";
import { createHash } from "node:crypto";
import { parseDocument } from "htmlparser2";
import { textContent } from "domutils";
import { EXTERNAL_READINGS } from "@/lib/content/external-readings";
import { loadExternalReading } from "@/lib/content/external-reading-body";
import sourceRegister from "@/data/source-register/source-register.json";
import { normalizeSourceHref } from "@/lib/content/source-register";
import type { Doc } from "./search";

let published: Promise<Doc[]> | undefined;

/** These reviewed source files and their manifest change only with an app release. */
export function sourceReadingDocs(): Promise<Doc[]> {
  // An approved local reading remains usable when its publisher later removes
  // the original URL. Its local body, provenance and review date are the evidence.
  return published ??= Promise.all(EXTERNAL_READINGS.map(async entry => {
    const reading = await loadExternalReading(entry.id);
    if (!reading || reading.id !== entry.id) return [];
    const parent = `/source-reading/${entry.id}`;
    const citingPages = sourceRegister.sources
      .filter(source => source.href && normalizeSourceHref(source.href) === normalizeSourceHref(entry.original))
      .flatMap(source => source.citations.map(citation => citation.route).filter(route => route.startsWith("/")));
    return (reading.sections ?? []).flatMap((section, index) => {
      const text = textContent(parseDocument(section.html.replace(/<\/(?:p|div|li|h[1-6]|tr|section|blockquote)>/gi, '$&\n'))).replace(/\s+/g, ' ').trim();
      if (!text) return [];
      const id = `asset-source-reading-${entry.id}-${index + 1}`;
      const href = index === 0 ? parent : `${parent}?section=${index + 1}`;
      const title = section.title && section.title !== 'Reading' ? `${entry.title}: ${section.title}` : entry.title;
      const publisher = new URL(entry.original).hostname;
      const sourceContext = entry.id === '7e5f68e5c07f566d2dcf' && index === 35 ? {
        note: 'This section preserves a historical footnote to the EEOC’s 2012 arrest and conviction guidance. The EEOC rescinded that separate guidance effective October 28, 2026. Do not present the footnote’s cited guidance as current. This status note does not say that the National Origin Discrimination guidance itself was rescinded.',
        sourceUrl: 'https://www.eeoc.gov/newsroom/eeoc-votes-rescind-enforcement-guidance-arrest-and-conviction-records',
        checkedAt: '2026-11-13',
      } : undefined;
      return [{
        id, kind: 'content', title, href, text, summary: `Outside reading from ${publisher}. ${text.slice(0, 200)}`,
        type: 'source_reading_section', authority: 'external_verify', status: 'approved', scope: 'public',
        reviewDate: reading.checkedAt, tags: [entry.title, publisher], intents: [], graphRelated: [...new Set([parent, entry.original, ...citingPages])],
        ...(sourceContext ? { sourceContext } : {}),
        evidenceRevisions: [{ sourceId: id, revisionId: null, scope: 'public', payloadHash: createHash('sha256').update(JSON.stringify({ original: entry.original, href, title, text, ...(sourceContext ? { sourceContext } : {}) })).digest('hex') }],
      } satisfies Doc];
    });
  })).then(groups => groups.flat()).catch(error => { published = undefined; throw error; });
}
