import { downloadHref } from "@/lib/downloads/catalog";
import { REFERRAL_ONLY_COURSE_IDS } from "@/lib/program/retired-features";

/**
 * A course opened in the Equity Analysis Toolkit from its own page:
 * /consultant/toolkit?source=course:<course id> or ?source=self-directed-course:<number>.
 * Only these kinds and id shapes are accepted; anything else is ignored with a plain message.
 */
export const LINKED_SOURCE_KINDS = ["course", "self-directed-course"] as const;
export type LinkedSourceKind = (typeof LINKED_SOURCE_KINDS)[number];
export type LinkedSource = { kind: LinkedSourceKind; id: string };

const ID_PATTERNS: Record<LinkedSourceKind, RegExp> = {
  course: /^[a-z0-9][a-z0-9._-]{0,119}$/,
  "self-directed-course": /^[FIA](?:0[1-9]|1[0-9]|2[0-4])$/,
};

/** Referral-only courses are never offered for download or analysis. */
export function linkedSourceAllowed(kind: LinkedSourceKind, id: string): boolean {
  return ID_PATTERNS[kind].test(id) && !REFERRAL_ONLY_COURSE_IDS.has(id);
}

export function parseLinkedSource(value: string | null | undefined): LinkedSource | null {
  if (!value || value.length > 160) return null;
  const separator = value.indexOf(":");
  if (separator < 1) return null;
  const kind = value.slice(0, separator);
  const id = value.slice(separator + 1);
  if (!(LINKED_SOURCE_KINDS as readonly string[]).includes(kind)) return null;
  return linkedSourceAllowed(kind as LinkedSourceKind, id) ? { kind: kind as LinkedSourceKind, id } : null;
}

export function linkedSourceHref(kind: LinkedSourceKind, id: string): string {
  return `/consultant/toolkit?source=${encodeURIComponent(`${kind}:${id}`)}`;
}

/** One stable source identifier per course, so the same course is never added twice. */
export function linkedSourceId(source: LinkedSource): string {
  return `linked-${source.kind}:${source.id}`;
}

/** The plain-text copy the downloads route builds for this course. */
export function linkedSourceTextHref(source: LinkedSource): string {
  return downloadHref(source.kind, source.id, "txt");
}

/**
 * The course title and its text from the plain-text copy. The copy opens with the program line,
 * then the title (see documentToPlainText); the file name is the fallback.
 */
export function linkedSourceTitle(text: string, source: LinkedSource): string {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const title = (lines[1] ?? lines[0] ?? "").slice(0, 500);
  return title || (source.kind === "course" ? `Course ${source.id}` : `Self-directed course ${source.id}`);
}
