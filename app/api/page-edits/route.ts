import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { ownerFromRequest } from "@/lib/auth/request";
import { readBoundedJson } from "@/lib/http/request";
import {
  cleanReplacementText,
  comparableText,
  isPageEditKey,
  linkAddressIsAllowed,
  normalizePagePath,
  PAGE_EDIT_LIMITS,
  pageEditKey,
} from "@/lib/content/page-edit-keys";
import {
  PageEditLimitError,
  PageEditStoreUnreadableError,
  readPageEdits,
  savePageEdit,
  undoPageEdit,
  type PageEditsView,
} from "@/lib/content/page-edits-store";

/**
 * The owner's page edits. Anyone may read the replacement wording for a page, because it is what
 * the page now says. Only the signed-in owner can write, and same-origin alone never authorizes
 * a write (lib/product/staff-lock.ts). The database audit log is not used: its tool-name rule
 * (db/standalone/bootstrap.sql) is a closed list that would refuse this event without a
 * migration, so saves and undos are logged inside the store file instead.
 */
const NO_STORE = { headers: { "cache-control": "no-store" } };

const SaveSchema = z.object({
  action: z.literal("save"),
  path: z.string(),
  kind: z.enum(["text", "link"]),
  original: z.string().max(PAGE_EDIT_LIMITS.text),
  occurrence: z.number().int().min(0).max(PAGE_EDIT_LIMITS.occurrence),
  value: z.string().max(PAGE_EDIT_LIMITS.text),
  scope: z.enum(["page", "site"]),
}).strict();

const UndoSchema = z.object({
  action: z.literal("undo"),
  path: z.string(),
  key: z.string().max(64),
  scope: z.enum(["page", "site"]),
}).strict();

const WriteSchema = z.discriminatedUnion("action", [SaveSchema, UndoSchema]);

function view(edits: PageEditsView, canEdit: boolean, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, canEdit, ...edits, ...extra }, NO_STORE);
}

function refuse(status: number, error: string) {
  return NextResponse.json({ error }, { status, ...NO_STORE });
}

/** A store failure is reported and never read as "no edits": the page keeps its original wording. */
export async function GET(request: NextRequest) {
  const pagePath = normalizePagePath(request.nextUrl.searchParams.get("path"));
  if (!pagePath) return refuse(400, "Unknown page.");
  let owner = false;
  try {
    owner = await ownerFromRequest(request);
    return view(await readPageEdits(pagePath, { owner }), owner);
  } catch (error) {
    console.error("Page edits could not be read.", error instanceof Error ? error.name : "Error");
    return view({ page: {}, site: {} }, owner, { degraded: true });
  }
}

export async function POST(request: NextRequest) {
  if (!(await ownerFromRequest(request))) return refuse(401, "Sign in to the Consultant Workspace to edit this page.");
  if (!isSameOriginMutation(request)) return refuse(403, "Open the page before saving changes.");

  const body = await readBoundedJson(request, PAGE_EDIT_LIMITS.requestBytes);
  if (!body.ok) return refuse(body.status, body.message);
  const parsed = WriteSchema.safeParse(body.value);
  const pagePath = parsed.success ? normalizePagePath(parsed.data.path) : null;
  if (!parsed.success || !pagePath) return refuse(400, "Check the change and try again.");

  try {
    if (parsed.data.action === "undo") {
      if (!isPageEditKey(parsed.data.key)) return refuse(400, "Check the change and try again.");
      const removed = await undoPageEdit({ path: pagePath, key: parsed.data.key, scope: parsed.data.scope });
      return view(await readPageEdits(pagePath, { owner: true }), true, { removed });
    }

    const { kind, original, occurrence, scope } = parsed.data;
    if (kind === "text") {
      if (!comparableText(original)) return refuse(400, "That text cannot be edited.");
      const value = cleanReplacementText(parsed.data.value);
      if (!value) return refuse(400, "Replacement text cannot be empty or contain control characters. Use Undo to restore the original.");
      // Saving the original wording again is an undo: nothing should stay stored for it.
      if (comparableText(value) === comparableText(original)) {
        const key = pageEditKey("text", original, scope === "site" ? 0 : occurrence);
        const removed = await undoPageEdit({ path: pagePath, key, scope });
        return view(await readPageEdits(pagePath, { owner: true }), true, { removed });
      }
      const key = await savePageEdit({ path: pagePath, kind, original, occurrence, value, scope });
      return view(await readPageEdits(pagePath, { owner: true }), true, { key });
    }

    const value = parsed.data.value.trim();
    if (!original.trim() || original.length > PAGE_EDIT_LIMITS.href) return refuse(400, "That link cannot be edited.");
    if (!linkAddressIsAllowed(value)) return refuse(400, "Use a local path starting with /, an anchor starting with #, or an address starting with https://.");
    if (value === original.trim()) {
      const key = pageEditKey("link", original, scope === "site" ? 0 : occurrence);
      const removed = await undoPageEdit({ path: pagePath, key, scope });
      return view(await readPageEdits(pagePath, { owner: true }), true, { removed });
    }
    const key = await savePageEdit({ path: pagePath, kind, original, occurrence, value, scope });
    return view(await readPageEdits(pagePath, { owner: true }), true, { key });
  } catch (error) {
    if (error instanceof PageEditLimitError) return refuse(413, error.message);
    if (error instanceof PageEditStoreUnreadableError) return refuse(503, "The saved edits file could not be read, so nothing was changed.");
    console.error("Page edit could not be saved.", error instanceof Error ? error.name : "Error");
    return refuse(503, "The change could not be saved.");
  }
}
