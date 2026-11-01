import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/page-edits/route";
import { issueSessionCookieValue, OWNER_COOKIE } from "@/lib/auth/owner";
import {
  cleanReplacementText,
  comparableText,
  isPageEditKey,
  linkAddressIsAllowed,
  normalizePagePath,
  pagePathIsOwnerOnly,
  PAGE_EDIT_LIMITS,
  pageEditKey,
} from "./page-edit-keys";
import {
  PageEditStoreUnreadableError,
  pageEditsDirectory,
  readPageEdits,
  savePageEdit,
  undoPageEdit,
} from "./page-edits-store";

const ORIGIN = "http://localhost:8900";
const THROWAWAY_KEY = "throwaway-test-owner-key-for-page-edit-tests";
const directories: string[] = [];

function useTemporaryWorkingDirectory() {
  const directory = mkdtempSync(path.join(os.tmpdir(), "page-edits-"));
  directories.push(directory);
  vi.spyOn(process, "cwd").mockReturnValue(directory);
  return directory;
}

function storeFile() {
  return path.join(pageEditsDirectory(), "page-edits.json");
}

function saveInput(overrides: Partial<Parameters<typeof savePageEdit>[0]> = {}) {
  return { path: "/about", kind: "text" as const, original: "Old wording", occurrence: 0, value: "New wording", scope: "page" as const, ...overrides };
}

beforeEach(() => {
  vi.stubEnv("PAC_OWNER_KEY", THROWAWAY_KEY);
  useTemporaryWorkingDirectory();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

afterAll(() => {
  for (const directory of directories) rmSync(directory, { recursive: true, force: true });
});

describe("edit keys", () => {
  it("stays the same for the same wording, and pins the value so a change here is noticed", () => {
    expect(pageEditKey("text", "Find your path", 0)).toBe(pageEditKey("text", "Find your path", 0));
    expect(pageEditKey("text", "Find your path", 0)).toBe("t:zk52x7qjcg-e:0");
  });

  it("ignores spacing differences from markup", () => {
    expect(pageEditKey("text", "  Find\n   your\tpath ", 2)).toBe(pageEditKey("text", "Find your path", 2));
    expect(comparableText("  a \n b ")).toBe("a b");
  });

  it("separates repeats, different wording, and text from links", () => {
    expect(pageEditKey("text", "Open", 0)).not.toBe(pageEditKey("text", "Open", 1));
    expect(pageEditKey("text", "Open", 0)).not.toBe(pageEditKey("text", "Opens", 0));
    expect(pageEditKey("text", "/a", 0)).not.toBe(pageEditKey("link", "/a", 0));
  });

  it("produces keys the store accepts, and refuses others", () => {
    expect(isPageEditKey(pageEditKey("link", "https://example.org/a", 12))).toBe(true);
    for (const bad of ["", "__proto__", "t:x", "x:abc-1:0", "t:ABC-1:0", 7]) expect(isPageEditKey(bad)).toBe(false);
  });
});

describe("page paths", () => {
  it("normalizes a page path", () => {
    expect(normalizePagePath("/")).toBe("/");
    expect(normalizePagePath("/library/")).toBe("/library");
    expect(normalizePagePath("/courses/a.b/%C3%A9")).toBe("/courses/a.b/%C3%A9");
  });

  it("refuses what is not a page", () => {
    for (const bad of [null, "", "about", "//evil.org", "https://evil.org", "/a?b=1", "/a#b", "/a/../b", "/a b", "/a\\b", "/api/page-edits", "/_next/x", `/${"a".repeat(600)}`]) {
      expect(normalizePagePath(bad)).toBeNull();
    }
  });
});

describe("link addresses", () => {
  it("accepts a local path, an anchor, or https", () => {
    for (const good of ["/library", "/library/x?y=1#z", "#section", "#", "https://mn.gov/dhs/"]) expect(linkAddressIsAllowed(good)).toBe(true);
  });

  it("refuses everything else", () => {
    for (const bad of [
      "", " ", "javascript:alert(1)", "JAVASCRIPT:alert(1)", "data:text/html,x", "http://mn.gov", "mailto:a@b.org", "//evil.org",
      "/\\evil.org", "/ a", "https://", "https://user:pw@evil.org", "library", "vbscript:x", "\u0001/a", `/${"a".repeat(PAGE_EDIT_LIMITS.href)}`, 5, null,
    ]) expect(linkAddressIsAllowed(bad)).toBe(false);
  });
});

describe("plain text", () => {
  it("keeps markup as the literal characters typed", () => {
    expect(cleanReplacementText("<img src=x onerror=alert(1)> & <b>bold</b>")).toBe("<img src=x onerror=alert(1)> & <b>bold</b>");
  });

  it("refuses empty, oversized, control-character and non-text values", () => {
    for (const bad of ["", "   \n", "a\u0000b", "a\u001bb", "x".repeat(PAGE_EDIT_LIMITS.text + 1), 5, null, { html: "x" }]) expect(cleanReplacementText(bad)).toBeNull();
    expect(cleanReplacementText(" line one\r\nline two ")).toBe("line one\nline two");
  });
});

describe("the store", () => {
  it("reads a missing store as no edits and creates nothing", async () => {
    await expect(readPageEdits("/about", { owner: false })).resolves.toEqual({ page: {}, site: {} });
    expect(existsSync(pageEditsDirectory())).toBe(false);
  });

  it("saves into the data folder, never the code folder, and reads back", async () => {
    const key = await savePageEdit(saveInput());
    expect(pageEditsDirectory()).toBe(path.join(process.cwd(), ".data", "page-edits"));
    const edits = await readPageEdits("/about", { owner: false });
    expect(edits.page).toEqual({ [key]: "New wording" });
    expect(JSON.parse(readFileSync(storeFile(), "utf8")).log).toMatchObject([{ action: "save", path: "/about", key }]);
  });

  it("gives readers replacements only, and the owner the originals", async () => {
    await savePageEdit(saveInput({ original: "Secret original" }));
    expect(JSON.stringify(await readPageEdits("/about", { owner: false }))).not.toContain("Secret original");
    const owner = await readPageEdits("/about", { owner: true });
    expect(owner.entries?.[0]).toMatchObject({ original: "Secret original", value: "New wording", scope: "page" });
  });

  it("does not send edits of owner-only pages to anyone else", async () => {
    const key = await savePageEdit(saveInput({ path: "/consultant/queue" }));
    expect((await readPageEdits("/consultant/queue", { owner: false })).page).toEqual({});
    expect((await readPageEdits("/consultant/queue", { owner: true })).page).toEqual({ [key]: "New wording" });
  });

  it("keeps protected, personal, unknown and encoded paths private by default", async () => {
    for (const privatePath of ["/one-dsd/team/workspace", "/contribute/resources", "/my-work/plan", "/program/reflection", "/ask", "/a-new-page", "/%63onsultant/queue"]) {
      expect(pagePathIsOwnerOnly(privatePath)).toBe(true);
      const key = await savePageEdit(saveInput({ path: privatePath, value: `Private: ${privatePath}` }));
      expect((await readPageEdits(privatePath, { owner: false })).page).toEqual({});
      expect((await readPageEdits(privatePath, { owner: true })).page).toEqual({ [key]: `Private: ${privatePath}` });
    }
    for (const publicPath of ["/", "/home", "/about", "/leading", "/learn/collections", "/courses/sm-first-week", "/resources/ja-sm-first-week"]) {
      expect(pagePathIsOwnerOnly(publicPath)).toBe(false);
    }
  });

  it("publishes edits on the verified public organization, reading, podcast, guide and program pages", async () => {
    const publicPaths = [
      "/administrations", "/administrations/adsa", "/administrations/adsa/divisions/dsd", "/areas/workforce",
      "/learn/readings/caste", "/podcasts/example", "/practice-guides/inclusive-meetings", "/one-dsd/planning",
      "/program/what-informs", "/program/practice", "/program/resources", "/program/progress", "/program/impact",
    ];
    for (const publicPath of publicPaths) {
      expect(pagePathIsOwnerOnly(publicPath)).toBe(false);
      const key = await savePageEdit(saveInput({ path: publicPath, value: `Public: ${publicPath}` }));
      expect((await readPageEdits(publicPath, { owner: false })).page).toEqual({ [key]: `Public: ${publicPath}` });
    }
    for (const privatePath of ["/program/reflection", "/my-work", "/my-work/plan", "/ask", "/contribute", "/one-dsd/team/workspace", "/paths/example", "/practice/example"]) {
      expect(pagePathIsOwnerOnly(privatePath)).toBe(true);
    }
  });

  it("retains but does not publish legacy site-wide edits with unknown origin until re-saved on a public page", async () => {
    const key = await savePageEdit(saveInput({ path: "/consultant/queue", scope: "site", value: "Unverified legacy value" }));
    const before = readFileSync(storeFile(), "utf8");
    expect((await readPageEdits("/home", { owner: false })).site).toEqual({});
    expect((await readPageEdits("/consultant/queue", { owner: true })).site).toEqual({ [key]: "Unverified legacy value" });
    expect(readFileSync(storeFile(), "utf8")).toBe(before);
    await savePageEdit(saveInput({ path: "/home", scope: "site", value: "Unverified legacy value" }));
    expect((await readPageEdits("/home", { owner: false })).site).toEqual({ [key]: "Unverified legacy value" });
    // The file remains readable by the previous strict v1 schema after a rollback.
    const saved = JSON.parse(readFileSync(storeFile(), "utf8"));
    for (const entries of Object.values(saved.pages) as Array<Record<string, Record<string, unknown>>>) {
      for (const entry of Object.values(entries)) expect(Object.keys(entry).sort()).toEqual(["kind", "occurrence", "original", "updatedAt", "value"]);
    }
    expect((await readPageEdits("*published-site-origins", { owner: false })).page).toEqual({});
    await undoPageEdit({ path: "/home", scope: "site", key });
    expect(JSON.parse(readFileSync(storeFile(), "utf8")).pages["*published-site-origins"]).toBeUndefined();
  });

  it("applies every-page edits on every path and clears a page-only edit they replace", async () => {
    const pageKey = await savePageEdit(saveInput({ occurrence: 3 }));
    const siteKey = await savePageEdit(saveInput({ occurrence: 3, value: "Everywhere", scope: "site" }));
    expect(siteKey).toBe(pageEditKey("text", "Old wording", 0));
    const edits = await readPageEdits("/about", { owner: false });
    expect(edits.page).toEqual({});
    expect(edits.site).toEqual({ [siteKey]: "Everywhere" });
    expect(pageKey).not.toBe(siteKey);
    expect((await readPageEdits("/other", { owner: false })).site).toEqual({ [siteKey]: "Everywhere" });
  });

  it("undoes an edit whether or not its original still exists", async () => {
    const key = await savePageEdit(saveInput());
    await expect(undoPageEdit({ path: "/about", key, scope: "page" })).resolves.toBe(true);
    await expect(undoPageEdit({ path: "/about", key, scope: "page" })).resolves.toBe(false);
    expect((await readPageEdits("/about", { owner: false })).page).toEqual({});
  });

  it("replaces the file atomically and leaves no temporary file", async () => {
    await savePageEdit(saveInput());
    await savePageEdit(saveInput({ original: "Second" }));
    expect(readdirSync(pageEditsDirectory()).sort()).toEqual(["backups", "page-edits.json"]);
    expect(() => JSON.parse(readFileSync(storeFile(), "utf8"))).not.toThrow();
  });

  it("keeps the old file whole if the replacement step fails", async () => {
    const key = await savePageEdit(saveInput());
    const before = readFileSync(storeFile(), "utf8");
    vi.spyOn(fs, "rename").mockRejectedValue(Object.assign(new Error("disk"), { code: "EIO" }));
    await expect(savePageEdit(saveInput({ original: "Second" }))).rejects.toThrow("disk");
    expect(readFileSync(storeFile(), "utf8")).toBe(before);
    expect(readdirSync(pageEditsDirectory()).filter((name) => name.endsWith(".tmp"))).toEqual([]);
    vi.restoreAllMocks();
    useTemporaryWorkingDirectory();
    expect(key).toBeTruthy();
  });

  it("backs up the previous version on each save, with limited retention", async () => {
    await savePageEdit(saveInput({ original: "First" }));
    expect(existsSync(path.join(pageEditsDirectory(), "backups"))).toBe(true);
    expect(readdirSync(path.join(pageEditsDirectory(), "backups"))).toEqual([]);
    const previous = readFileSync(storeFile(), "utf8");
    await savePageEdit(saveInput({ original: "Second" }));
    const backups = path.join(pageEditsDirectory(), "backups");
    expect(readdirSync(backups)).toHaveLength(1);
    expect(readFileSync(path.join(backups, readdirSync(backups)[0]), "utf8")).toBe(previous);

    for (let index = 0; index < PAGE_EDIT_LIMITS.backups + 5; index += 1) await savePageEdit(saveInput({ original: `Edit ${index}` }));
    expect(readdirSync(backups)).toHaveLength(PAGE_EDIT_LIMITS.backups);
  });

  it("loses nothing when saves arrive together", async () => {
    await Promise.all(Array.from({ length: 12 }, (_, index) => savePageEdit(saveInput({ original: `Text ${index}` }))));
    expect(Object.keys((await readPageEdits("/about", { owner: false })).page)).toHaveLength(12);
  });

  it("refuses a save past the size limit and keeps what was there", async () => {
    const value = "x".repeat(PAGE_EDIT_LIMITS.text);
    const edits = Object.fromEntries(Array.from({ length: Math.ceil(PAGE_EDIT_LIMITS.storeBytes / PAGE_EDIT_LIMITS.text) }, (_, index) => {
      const original = `Large ${index}`;
      return [pageEditKey("text", original, 0), { kind: "text", original, value, occurrence: 0, updatedAt: "2026-10-31T00:00:00.000Z" }];
    }));
    mkdirSync(pageEditsDirectory(), { recursive: true });
    const full = JSON.stringify({ version: 1, updatedAt: null, pages: { "/about": edits }, log: [] });
    writeFileSync(storeFile(), full);
    await expect(savePageEdit(saveInput())).rejects.toThrow("size limit");
    expect(readFileSync(storeFile(), "utf8")).toBe(full);
  });

  it("refuses more edits than a page may hold", async () => {
    const edits = Object.fromEntries(Array.from({ length: PAGE_EDIT_LIMITS.entriesPerPage }, (_, index) => {
      const original = `Item ${index}`;
      return [pageEditKey("text", original, 0), { kind: "text", original, value: "v", occurrence: 0, updatedAt: "2026-10-31T00:00:00.000Z" }];
    }));
    mkdirSync(pageEditsDirectory(), { recursive: true });
    writeFileSync(storeFile(), JSON.stringify({ version: 1, updatedAt: null, pages: { "/about": edits }, log: [] }));
    await expect(savePageEdit(saveInput())).rejects.toThrow("limit");
  });

  it("never treats a damaged file as empty, and never overwrites it", async () => {
    mkdirSync(pageEditsDirectory(), { recursive: true });
    writeFileSync(storeFile(), "{ not json");
    await expect(readPageEdits("/about", { owner: false })).rejects.toBeInstanceOf(PageEditStoreUnreadableError);
    await expect(savePageEdit(saveInput())).rejects.toBeInstanceOf(PageEditStoreUnreadableError);
    expect(readFileSync(storeFile(), "utf8")).toBe("{ not json");
  });
});

function read(pathParam: string, owner = false) {
  const headers: Record<string, string> = {};
  if (owner) headers.cookie = `${OWNER_COOKIE}=${issueSessionCookieValue()}`;
  return GET(new NextRequest(`${ORIGIN}/api/page-edits?path=${encodeURIComponent(pathParam)}`, { headers }));
}

function write(body: unknown, options: { owner?: boolean; origin?: string | null; cookie?: string } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (options.origin !== null) headers.origin = options.origin ?? ORIGIN;
  if (options.owner) headers.cookie = `${OWNER_COOKIE}=${issueSessionCookieValue()}`;
  if (options.cookie) headers.cookie = options.cookie;
  return POST(new NextRequest(`${ORIGIN}/api/page-edits`, { method: "POST", headers, body: JSON.stringify(body) }));
}

const saveBody = { action: "save", path: "/about", kind: "text", original: "Old wording", occurrence: 0, value: "New wording", scope: "page" };

describe("who can write", () => {
  it("denies anonymous writes and stores nothing", async () => {
    const response = await write(saveBody);
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(existsSync(storeFile())).toBe(false);
  });

  it("denies a forged or expired session, a staff cookie, and the editing-mode cookie alone", async () => {
    const expired = issueSessionCookieValue(Date.now() - 9 * 60 * 60 * 1000);
    for (const cookie of [`${OWNER_COOKIE}=v2.forged.signature`, `${OWNER_COOKIE}=${expired}`, "pac_editing=on", "pac_program_session=staff", `${OWNER_COOKIE}=`]) {
      expect((await write(saveBody, { cookie })).status).toBe(401);
    }
    expect(existsSync(storeFile())).toBe(false);
  });

  it("denies a session signed with a different key", async () => {
    const other = issueSessionCookieValue();
    vi.stubEnv("PAC_OWNER_KEY", "a-different-throwaway-owner-key-for-this-test");
    expect((await write(saveBody, { cookie: `${OWNER_COOKIE}=${other}` })).status).toBe(401);
  });

  it("denies the owner's cookie from another origin or with no origin", async () => {
    expect((await write(saveBody, { owner: true, origin: "https://evil.example" })).status).toBe(403);
    expect((await write(saveBody, { owner: true, origin: null })).status).toBe(403);
    expect(existsSync(storeFile())).toBe(false);
  });

  it("denies undo to anyone but the owner", async () => {
    const key = await savePageEdit(saveInput());
    expect((await write({ action: "undo", path: "/about", key, scope: "page" })).status).toBe(401);
    expect((await readPageEdits("/about", { owner: false })).page).toEqual({ [key]: "New wording" });
  });

  it("lets the owner save and undo through the route", async () => {
    const saved = await write(saveBody, { owner: true });
    expect(saved.status).toBe(200);
    const body = await saved.json();
    expect(body.entries).toHaveLength(1);
    expect((await read("/about")).status).toBe(200);
    expect((await (await read("/about")).json()).page).toEqual({ [body.key]: "New wording" });
    const undone = await write({ action: "undo", path: "/about", key: body.key, scope: "page" }, { owner: true });
    expect((await undone.json()).removed).toBe(true);
    expect((await (await read("/about")).json()).page).toEqual({});
  });

  it("does not expose private page replacements through the anonymous route", async () => {
    const privatePath = "/one-dsd/team/workspace";
    const saved = await write({ ...saveBody, path: privatePath, value: "Private working note" }, { owner: true });
    expect(saved.status).toBe(200);
    expect((await (await read(privatePath)).json()).page).toEqual({});
    expect(Object.values((await (await read(privatePath, true)).json()).page)).toContain("Private working note");
  });

  it("refuses site-wide publication from an owner-only path while permitting page-only saving", async () => {
    const privatePath = "/consultant/queue";
    expect((await write({ ...saveBody, path: privatePath, scope: "site" }, { owner: true })).status).toBe(403);
    expect(existsSync(storeFile())).toBe(false);
    expect((await write({ ...saveBody, path: privatePath, scope: "page" }, { owner: true })).status).toBe(200);
  });
});

describe("what the route accepts", () => {
  it("refuses unsafe link addresses", async () => {
    for (const value of ["javascript:alert(1)", "http://mn.gov", "//evil.org", "/\\evil.org", ""]) {
      const response = await write({ ...saveBody, kind: "link", original: "/about", value }, { owner: true });
      expect(response.status).toBe(400);
    }
    expect(existsSync(storeFile())).toBe(false);
  });

  it("saves a permitted link address", async () => {
    const response = await write({ ...saveBody, kind: "link", original: "/about", value: "https://mn.gov/dhs/" }, { owner: true });
    expect(response.status).toBe(200);
    expect(Object.values((await response.json()).page)).toEqual(["https://mn.gov/dhs/"]);
  });

  it("stores markup as literal text", async () => {
    const value = "<script>alert(1)</script> & <b>x</b>";
    const response = await write({ ...saveBody, value }, { owner: true });
    expect(Object.values((await response.json()).page)).toEqual([value]);
  });

  it("refuses empty text, oversized text, an unknown page, extra fields and bad keys", async () => {
    const bad = [
      { ...saveBody, value: "   " },
      { ...saveBody, value: "x".repeat(PAGE_EDIT_LIMITS.text + 1) },
      { ...saveBody, original: "   " },
      { ...saveBody, path: "https://evil.org" },
      { ...saveBody, path: "/api/page-edits" },
      { ...saveBody, html: "<b>x</b>" },
      { ...saveBody, occurrence: -1 },
      { action: "undo", path: "/about", key: "__proto__", scope: "page" },
      { action: "delete-everything", path: "/about" },
    ];
    for (const body of bad) expect((await write(body, { owner: true })).status).toBeGreaterThanOrEqual(400);
    expect(existsSync(storeFile())).toBe(false);
  });

  it("treats saving the original wording as an undo", async () => {
    await write(saveBody, { owner: true });
    const response = await write({ ...saveBody, value: "  Old   wording " }, { owner: true });
    expect((await response.json()).page).toEqual({});
  });
});

describe("reading through the route", () => {
  it("answers every page when the store is missing, without editing rights", async () => {
    const response = await read("/about");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: true, canEdit: false, page: {}, site: {} });
  });

  it("tells only the signed-in owner that editing is available", async () => {
    expect((await (await read("/about", true)).json()).canEdit).toBe(true);
  });

  it("reports a damaged store as degraded rather than as no edits, and refuses to write over it", async () => {
    mkdirSync(pageEditsDirectory(), { recursive: true });
    writeFileSync(storeFile(), "{ not json");
    const body = await (await read("/about", true)).json();
    expect(body).toMatchObject({ ok: true, canEdit: true, degraded: true, page: {} });
    expect((await write(saveBody, { owner: true })).status).toBe(503);
    expect(readFileSync(storeFile(), "utf8")).toBe("{ not json");
  });

  it("refuses a path that is not a page", async () => {
    expect((await read("https://evil.org")).status).toBe(400);
  });
});
