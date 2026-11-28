import { z } from "zod";

/**
 * The page a person was reading when they opened Ask: its address and its title, nothing else.
 * Neither is personal data. Nothing typed on the page ever goes with it, and it is not recorded.
 * On the server it is only a hint for finding sources, so a question about something else is
 * still answered on its own terms.
 */
export type AskPage = { path: string; title: string };

const MAX_PATH = 300;
const MAX_TITLE = 160;
// A site path: one leading slash, then ordinary address characters. No host, no query, no fragment.
const SAFE_PATH = /^\/(?!\/)[A-Za-z0-9\-._~/]*$/;
// Pages that are the person's own space, or Ask itself: there is no shared page to read about.
const NO_PAGE_CONTEXT = /^\/(?:home|ask|my-work|my-view)?(?:\/|$)/;

/** Accepts anything from the browser and returns a clean page hint, or nothing. */
export const AskPageSchema = z.object({ path: z.string().max(MAX_PATH), title: z.string().max(400) }).strict();

export function normalizeAskPath(raw: string): string | undefined {
  const path = raw.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  return path.length <= MAX_PATH && SAFE_PATH.test(path) ? path : undefined;
}

export function cleanAskPageTitle(raw: string): string {
  const text = raw.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u2064\ufeff]/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= MAX_TITLE) return text;
  const cut = text.slice(0, MAX_TITLE);
  return (cut.slice(0, cut.lastIndexOf(" ")) || cut).trim() + "…";
}

/** A page hint that is missing, malformed or about a personal space is simply left out. */
export function readAskPage(value: unknown): AskPage | undefined {
  const parsed = AskPageSchema.safeParse(value);
  if (!parsed.success) return undefined;
  const path = normalizeAskPath(parsed.data.path);
  const title = cleanAskPageTitle(parsed.data.title);
  if (!path || !title || !askPageContextAllowed(path)) return undefined;
  return { path, title };
}

export function askPageContextAllowed(path: string): boolean {
  return !NO_PAGE_CONTEXT.test(path);
}

/**
 * The title a reader sees for the page: its main heading, or the browser title without the site name.
 * Read from the page's own heading, never from anything the person has typed into it.
 */
export function askPageTitle(doc: Pick<Document, "querySelector" | "title">): string {
  const fromHeading = cleanAskPageTitle(doc.querySelector("#main h1, main h1")?.textContent ?? "");
  // The browser title ends with the site's name ("Somali Minnesotans | One DSD ..."); only the page's part is kept.
  return fromHeading || cleanAskPageTitle((doc.title ?? "").split(" | ")[0]);
}

/** The page hint for the page at this path, or nothing where the page has none. */
export function askPageFor(pathname: string, doc: Pick<Document, "querySelector" | "title">): AskPage | undefined {
  const path = normalizeAskPath(pathname);
  if (!path || !askPageContextAllowed(path)) return undefined;
  const title = askPageTitle(doc);
  return title ? { path, title } : undefined;
}
