import "server-only";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { z } from "zod";
import {
  isPageEditKey,
  PAGE_EDIT_LIMITS,
  pageEditKey,
  pagePathIsOwnerOnly,
  SITE_WIDE_PATH,
  type PageEditKind,
} from "@/lib/content/page-edit-keys";

/**
 * The owner's page edits, in one JSON file on the persistent data folder. It does not use the
 * database, so it works whichever content source production runs on. On Railway `.data` under
 * the working directory is the mounted volume (scripts/verify-clone-agent-pilot.mjs refuses to
 * start otherwise); locally it is excluded from the release archive.
 */
const StoredEditSchema = z.object({
  kind: z.enum(["text", "link"]),
  original: z.string().max(PAGE_EDIT_LIMITS.text),
  value: z.string().max(PAGE_EDIT_LIMITS.text),
  occurrence: z.number().int().min(0).max(PAGE_EDIT_LIMITS.occurrence),
  updatedAt: z.string(),
}).strict();

const LogEntrySchema = z.object({
  at: z.string(),
  action: z.enum(["save", "undo"]),
  path: z.string(),
  key: z.string(),
}).strict();

const StoreSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string().nullable(),
  pages: z.record(z.string(), z.record(z.string(), StoredEditSchema)),
  log: z.array(LogEntrySchema),
}).strict();

type PageEditStore = z.infer<typeof StoreSchema>;
export type StoredPageEdit = z.infer<typeof StoredEditSchema>;

/** The file exists but cannot be trusted. It is never treated as "no edits", and never overwritten. */
export class PageEditStoreUnreadableError extends Error {
  constructor() {
    super("The saved page edits could not be read.");
    this.name = "PageEditStoreUnreadableError";
  }
}

export class PageEditLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PageEditLimitError";
  }
}

function emptyStore(): PageEditStore {
  return { version: 1, updatedAt: null, pages: {}, log: [] };
}

export function pageEditsDirectory(): string {
  return path.join(process.cwd(), ".data", "page-edits");
}

function storeFile(): string {
  return path.join(pageEditsDirectory(), "page-edits.json");
}

let cached: { file: string; mtimeMs: number; size: number; store: PageEditStore } | null = null;

async function readStore(): Promise<PageEditStore> {
  const file = storeFile();
  let details;
  try {
    details = await fs.stat(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyStore();
    throw new PageEditStoreUnreadableError();
  }
  if (cached && cached.file === file && cached.mtimeMs === details.mtimeMs && cached.size === details.size) return cached.store;
  try {
    const store = StoreSchema.parse(JSON.parse(await fs.readFile(file, "utf8")));
    cached = { file, mtimeMs: details.mtimeMs, size: details.size, store };
    return store;
  } catch {
    throw new PageEditStoreUnreadableError();
  }
}

/** Replace the file in one step: readers see the whole old file or the whole new file. */
async function replaceFile(file: string, contents: string): Promise<void> {
  const temporary = path.join(path.dirname(file), `.page-edits-${process.pid}-${randomUUID()}.tmp`);
  const handle = await fs.open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(contents, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    for (let attempt = 0; ; attempt += 1) {
      try {
        await fs.rename(temporary, file);
        return;
      } catch (error) {
        // Windows refuses a rename while something briefly holds the target open.
        const code = (error as NodeJS.ErrnoException).code;
        if (attempt >= 4 || (code !== "EPERM" && code !== "EACCES" && code !== "EBUSY")) throw error;
        await pause(40 * (attempt + 1));
      }
    }
  } catch (error) {
    await fs.unlink(temporary).catch(() => undefined);
    throw error;
  }
}

/** Keep a timestamped copy of the current file, then drop the oldest beyond the retention limit. */
async function backUpCurrentFile(now: string): Promise<void> {
  const directory = path.join(pageEditsDirectory(), "backups");
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const stamp = now.replace(/[:.]/g, "-");
  try {
    await fs.copyFile(storeFile(), path.join(directory, `page-edits-${stamp}-${randomUUID().slice(0, 8)}.json`));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  const names = (await fs.readdir(directory)).filter((name) => /^page-edits-.*\.json$/.test(name)).sort();
  for (const name of names.slice(0, Math.max(0, names.length - PAGE_EDIT_LIMITS.backups))) {
    await fs.unlink(path.join(directory, name)).catch(() => undefined);
  }
}

async function writeStore(store: PageEditStore, now: string): Promise<void> {
  const contents = JSON.stringify(store, null, 1);
  if (Buffer.byteLength(contents, "utf8") > PAGE_EDIT_LIMITS.storeBytes) {
    throw new PageEditLimitError("The saved page edits have reached their size limit. Undo some edits before adding more.");
  }
  await fs.mkdir(pageEditsDirectory(), { recursive: true, mode: 0o700 });
  await backUpCurrentFile(now);
  await replaceFile(storeFile(), contents);
  cached = null;
}

/** One replica writes this file. Saves take turns so none is lost to a read-modify-write race. */
const lockHolder = globalThis as typeof globalThis & { __pacPageEditLock?: Promise<unknown> };

function inTurn<T>(work: () => Promise<T>): Promise<T> {
  const next = (lockHolder.__pacPageEditLock ?? Promise.resolve()).then(work, work);
  lockHolder.__pacPageEditLock = next.catch(() => undefined);
  return next;
}

function withLog(store: PageEditStore, entry: PageEditStore["log"][number]): PageEditStore["log"] {
  return [...store.log, entry].slice(-PAGE_EDIT_LIMITS.log);
}

function valuesOnly(edits: Record<string, StoredPageEdit> | undefined): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, edit] of Object.entries(edits ?? {})) values[key] = edit.value;
  return values;
}

export type PageEditListEntry = StoredPageEdit & { key: string; scope: "page" | "site" };

export type PageEditsView = {
  page: Record<string, string>;
  site: Record<string, string>;
  /** The original wording of each edit. Given to the owner only, never to readers. */
  entries?: PageEditListEntry[];
};

/**
 * What one page needs. Readers get key and replacement only: the original wording and the change
 * history stay on the server, and edits to owner-only pages are not sent at all.
 */
export async function readPageEdits(pagePath: string, options: { owner: boolean }): Promise<PageEditsView> {
  const store = await readStore();
  const pageEdits = Object.hasOwn(store.pages, pagePath) ? store.pages[pagePath] : undefined;
  const siteEdits = Object.hasOwn(store.pages, SITE_WIDE_PATH) ? store.pages[SITE_WIDE_PATH] : undefined;
  const hidden = pagePathIsOwnerOnly(pagePath) && !options.owner;
  const view: PageEditsView = { page: hidden ? {} : valuesOnly(pageEdits), site: valuesOnly(siteEdits) };
  if (options.owner) {
    view.entries = [
      ...Object.entries(pageEdits ?? {}).map(([key, edit]) => ({ ...edit, key, scope: "page" as const })),
      ...Object.entries(siteEdits ?? {}).map(([key, edit]) => ({ ...edit, key, scope: "site" as const })),
    ];
  }
  return view;
}

export type SavePageEditInput = {
  path: string;
  kind: PageEditKind;
  original: string;
  occurrence: number;
  value: string;
  scope: "page" | "site";
};

/** Save one edit. Callers validate the value first; the key is always computed here. */
export function savePageEdit(input: SavePageEditInput, nowDate = new Date()): Promise<string> {
  return inTurn(async () => {
    const store = await readStore();
    const now = nowDate.toISOString();
    const occurrence = input.scope === "site" ? 0 : input.occurrence;
    const key = pageEditKey(input.kind, input.original, occurrence);
    const target = input.scope === "site" ? SITE_WIDE_PATH : input.path;
    const pages = { ...store.pages };
    const entries = { ...(Object.hasOwn(pages, target) ? pages[target] : {}) };
    if (!Object.hasOwn(entries, key) && Object.keys(entries).length >= PAGE_EDIT_LIMITS.entriesPerPage) {
      throw new PageEditLimitError("This page has reached its limit of saved edits.");
    }
    entries[key] = { kind: input.kind, original: input.original, value: input.value, occurrence, updatedAt: now };
    pages[target] = entries;
    if (input.scope === "site" && Object.hasOwn(pages, input.path)) {
      // A page-only edit of this same text would otherwise keep hiding the every-page edit here.
      const pageKey = pageEditKey(input.kind, input.original, input.occurrence);
      if (Object.hasOwn(pages[input.path], pageKey)) {
        const remaining = { ...pages[input.path] };
        delete remaining[pageKey];
        if (Object.keys(remaining).length) pages[input.path] = remaining;
        else delete pages[input.path];
      }
    }
    await writeStore({ ...store, updatedAt: now, pages, log: withLog(store, { at: now, action: "save", path: input.path, key }) }, now);
    return key;
  });
}

/** Remove one edit so the original shows again. Works for edits whose original is gone from the page. */
export function undoPageEdit(input: { path: string; key: string; scope: "page" | "site" }, nowDate = new Date()): Promise<boolean> {
  return inTurn(async () => {
    if (!isPageEditKey(input.key)) return false;
    const store = await readStore();
    const target = input.scope === "site" ? SITE_WIDE_PATH : input.path;
    if (!Object.hasOwn(store.pages, target) || !Object.hasOwn(store.pages[target], input.key)) return false;
    const now = nowDate.toISOString();
    const pages = { ...store.pages };
    const remaining = { ...pages[target] };
    delete remaining[input.key];
    if (Object.keys(remaining).length) pages[target] = remaining;
    else delete pages[target];
    await writeStore({ ...store, updatedAt: now, pages, log: withLog(store, { at: now, action: "undo", path: input.path, key: input.key }) }, now);
    return true;
  });
}
