import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { parseDocument } from "htmlparser2";
import { findAll, getOuterHTML, textContent } from "domutils";
import { externalReading, externalReadingHref, externalSourceHref, type ReadingEntry } from "./external-readings";
import { rewriteSourceReadingLinks } from "./source-reading-links.mjs";

export type ReadingBody = ReadingEntry & {
  checkedAt: string;
  document?: string;
  sections?: { id: string; title: string; html: string }[];
  interactive?: { tag: string; src: string }[];
  attribution?: string;
  licenseUrl?: string;
};

/** The original title appears in the page header; keep its in-body anchor. */
export function readingSectionHtml(html: string, title: string, firstSection: boolean): string {
  const linkedHtml = rewriteSourceReadingLinks(html, original => externalReadingHref(original) ?? externalSourceHref(original));
  const document = parseDocument(linkedHtml);
  let changed = false;
  const heading = firstSection ? findAll(node => node.name === "h2", document.children)[0] : undefined;
  const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
  if (heading && normalize(textContent(heading)) === normalize(title)) {
    heading.name = "span";
    heading.children = [];
    changed = true;
  }
  // Published source wording and anchors stay intact. Only presentation levels
  // change to place each independently opened section beneath the page's h1.
  const stack: { sourceLevel: number; level: number }[] = [{ sourceLevel: 0, level: 1 }];
  for (const item of findAll(node => /^h[1-6]$/.test(node.name), document.children)) {
    const sourceLevel = Number(item.name.slice(1));
    while (stack.length > 1 && stack[stack.length - 1].sourceLevel >= sourceLevel) stack.pop();
    const level = Math.min(6, stack[stack.length - 1].level + 1);
    if (item.name !== `h${level}`) { item.name = `h${level}`; changed = true; }
    stack.push({ sourceLevel, level });
  }
  return changed ? getOuterHTML(document) : linkedHtml;
}
export const loadExternalReading = cache(async (id: string): Promise<ReadingBody | null> => {
  if (!/^[a-f0-9]{20}$/.test(id) || !externalReading(id)) return null;
  try {
    const text = await readFile(path.join(process.cwd(), "data", "source-readings", `${id}.json`), "utf8");
    return JSON.parse(text) as ReadingBody;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
});
