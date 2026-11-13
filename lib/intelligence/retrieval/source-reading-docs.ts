import "server-only";
import { createHash } from "node:crypto";
import { parseDocument } from "htmlparser2";
import { textContent } from "domutils";
import { EXTERNAL_READINGS, unavailableExternalUrl } from "@/lib/content/external-readings";
import { loadExternalReading } from "@/lib/content/external-reading-body";
import type { Doc } from "./search";

let published: Promise<Doc[]> | undefined;

/** These reviewed source files and their manifest change only with an app release. */
export function sourceReadingDocs(): Promise<Doc[]> {
  return published ??= Promise.all(EXTERNAL_READINGS.filter(entry => !unavailableExternalUrl(entry.original)).map(async entry => {
    const reading = await loadExternalReading(entry.id);
    if (!reading || reading.id !== entry.id) return [];
    const parent = `/source-reading/${entry.id}`;
    return (reading.sections ?? []).flatMap((section, index) => {
      const text = textContent(parseDocument(section.html.replace(/<\/(?:p|div|li|h[1-6]|tr|section|blockquote)>/gi, '$&\n'))).replace(/\s+/g, ' ').trim();
      if (!text) return [];
      const id = `asset-source-reading-${entry.id}-${index + 1}`;
      const href = index === 0 ? parent : `${parent}?section=${index + 1}`;
      const title = section.title && section.title !== 'Reading' ? `${entry.title}: ${section.title}` : entry.title;
      const publisher = new URL(entry.original).hostname;
      return [{
        id, kind: 'content', title, href, text, summary: `Outside reading from ${publisher}. ${text.slice(0, 200)}`,
        type: 'source_reading_section', authority: 'external_verify', status: 'approved', scope: 'public',
        reviewDate: reading.checkedAt, tags: [entry.title, publisher], intents: [], graphRelated: [parent, entry.original],
        evidenceRevisions: [{ sourceId: id, revisionId: null, scope: 'public', payloadHash: createHash('sha256').update(JSON.stringify({ original: entry.original, href, title, text })).digest('hex') }],
      } satisfies Doc];
    });
  })).then(groups => groups.flat()).catch(error => { published = undefined; throw error; });
}
