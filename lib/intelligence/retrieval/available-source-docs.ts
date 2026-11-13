import "server-only";
import { externalReadingHref, externalSourceHref } from "@/lib/content/external-readings";
import type { Doc } from "./search";

const projected = new WeakMap<Doc, Doc | null>();

/** The same destination projection must be used for retrieval and fresh
 * citation validation. Reviewed local copies survive a removed publisher URL;
 * other external references use only verified replacements or working originals.
 * This changes access, never a reference summary into full-text evidence. */
export function availableSourceDocs(docs: readonly Doc[]): Doc[] {
  return docs.flatMap(doc => {
    if (!/^https?:\/\//.test(doc.href)) return [doc];
    if (projected.has(doc)) return projected.get(doc) ? [projected.get(doc)!] : [];
    const href = externalReadingHref(doc.href) ?? externalSourceHref(doc.href);
    const next = href ? href === doc.href ? doc : {
      ...doc, href, graphLinks: [...new Set([...(doc.graphLinks ?? []), doc.href])],
    } : null;
    projected.set(doc, next);
    return next ? [next] : [];
  });
}
