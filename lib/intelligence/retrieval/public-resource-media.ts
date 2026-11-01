import "server-only";
import { createHash } from "node:crypto";
import { runtimeDatabase } from "@/lib/content/page-text";
import { selfDirectedHref } from "@/lib/content/self-directed";
import { unifiedPublishedCatalogScope, type StaffProgramScope } from "@/lib/content/staff-publications";
import type { ContentItem } from "@/lib/content/types";
import type { RuntimeSql } from "@/lib/db/runtime-client";
import { askPrivacyGate } from "../safety";
import type { Doc } from "./search";

export const PUBLIC_RESOURCE_MEDIA_TYPE = "public_resource_media_transcript";
export const PUBLIC_RESOURCE_MEDIA_LIMITS = { parents: 5000, lines: 5000, passages: 12000, page: 250 } as const;
const NIL = "00000000-0000-0000-0000-000000000000";
const SHA = /^[a-f0-9]{64}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export type PublicResourceMediaLine = {
  content_item_id: string; revision_id: string; publication_hash: string; publication_scope: string;
  resource_media_id: string; media_title: string; line_number: number | string; line_text: string;
};

export function publicResourceMediaEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
  return environment.PAC_PUBLIC_RESOURCE_MEDIA_INDEX?.trim().toLowerCase() === "on";
}

/** One bounded, consistent DB snapshot. The SQL function independently checks
 * publication, sensitivity, scope and model-context permissions. */
export async function readPublicResourceMediaLines(sql: RuntimeSql, scope: StaffProgramScope, ids: readonly string[]): Promise<PublicResourceMediaLine[]> {
  if (ids.length > PUBLIC_RESOURCE_MEDIA_LIMITS.parents) throw Error("public_media_parent_limit_exceeded");
  if (!ids.length) return [];
  const allowed = new Set(ids);
  return sql.begin("isolation level repeatable read read only", async tx => {
    let item = "", media = NIL, line = 0;
    const out: PublicResourceMediaLine[] = [];
    for (;;) {
      const rows = await tx<PublicResourceMediaLine[]>`select * from pac_dsd.read_published_media_script_lines(${unifiedPublishedCatalogScope(scope)}, ${tx.array([...ids])}::text[], ${item}, ${media}::uuid, ${line}::bigint, ${PUBLIC_RESOURCE_MEDIA_LIMITS.page})`;
      for (const row of rows) {
        if (!allowed.has(row.content_item_id) || !UUID.test(row.resource_media_id) || !UUID.test(row.revision_id)
          || !SHA.test(row.publication_hash) || !["one-dhs", "adsa", "dsd"].includes(row.publication_scope)
          || typeof row.line_text !== "string" || !row.line_text.trim() || row.line_text.length > 4000
          || typeof row.media_title !== "string" || row.media_title.length > 300
          || !Number.isSafeInteger(Number(row.line_number)) || Number(row.line_number) < 1) throw Error("public_media_invalid_row");
        out.push(row);
        if (out.length > PUBLIC_RESOURCE_MEDIA_LIMITS.lines) throw Error("public_media_line_limit_exceeded");
      }
      if (rows.length < PUBLIC_RESOURCE_MEDIA_LIMITS.page) return out;
      const last = rows[rows.length - 1];
      if (last.content_item_id === item && last.resource_media_id === media && Number(last.line_number) === line) throw Error("public_media_cursor_stalled");
      item = last.content_item_id; media = last.resource_media_id; line = Number(last.line_number);
    }
  }) as Promise<PublicResourceMediaLine[]>;
}

/** Only a public parent from the same scoped snapshot may project its visible
 * audio script. Safety is checked across full scripts before any text is sent
 * to a search index or model. */
export function projectPublicResourceMedia(rows: readonly PublicResourceMediaLine[], parents: readonly ContentItem[], scope: StaffProgramScope): Doc[] {
  const allowed = new Map(parents.filter(parent => parent.status === "approved" && !selfDirectedHref(parent.id)).map(parent => [parent.id, parent]));
  const scripts = new Map<string, string[]>();
  for (const row of rows) {
    if (!allowed.has(row.content_item_id)) throw Error("public_media_parent_mismatch");
    const key = `${row.content_item_id}:${row.resource_media_id}`;
    let parts = scripts.get(key);
    if (!parts) { parts = []; scripts.set(key, parts); }
    parts.push(row.line_text);
    if (!askPrivacyGate(row.media_title).ok) throw Error("public_media_safety_failed");
  }
  for (const script of scripts.values()) if (!askPrivacyGate(script.join("\n")).ok) throw Error("public_media_safety_failed");
  const out: Doc[] = [];
  for (const row of rows) {
    const parent = allowed.get(row.content_item_id)!;
    let remaining = Array.from(row.line_text.replace(/\s+/g, " ").trim()), chunk = 0;
    while (remaining.length) {
      let end = Math.min(300, remaining.length);
      if (end < remaining.length) { const boundary = remaining.slice(0, end).lastIndexOf(" "); if (boundary > 150) end = boundary; }
      const passage = remaining.slice(0, end).join("").trim(); remaining = remaining.slice(end);
      while (remaining[0] === " ") remaining.shift();
      if (!passage) continue;
      const sourceId = `asset-media-${hash(`${row.resource_media_id}:${row.line_number}:${chunk++}`).slice(0, 32)}`;
      const payloadHash = hash({ parent: parent.id, revision: row.revision_id, publicationHash: row.publication_hash, title: row.media_title, line: row.line_text, passage });
      out.push({ kind: "content", id: sourceId, title: row.media_title || parent.title,
        href: `/resources/${encodeURIComponent(parent.id)}#resource-listen-${encodeURIComponent(parent.id)}`,
        authority: parent.authority, type: PUBLIC_RESOURCE_MEDIA_TYPE, status: "approved", reviewDate: parent.reviewDate,
        scope: scope === "dsd" ? "dsd" : "agencywide", summary: passage, text: passage, tags: ["recording", "transcript"], intents: [],
        graphRelated: [`/library/${encodeURIComponent(parent.id)}`],
        evidenceRevisions: [{ sourceId, revisionId: row.revision_id, payloadHash, scope: row.publication_scope }] });
      if (out.length > PUBLIC_RESOURCE_MEDIA_LIMITS.passages) throw Error("public_media_passage_limit_exceeded");
    }
  }
  return out;
}

export async function publicResourceMediaDocs(parents: readonly ContentItem[], scope: StaffProgramScope): Promise<Doc[]> {
  if (!publicResourceMediaEnabled()) return [];
  const ids = [...new Set(parents.filter(parent => parent.status === "approved" && !selfDirectedHref(parent.id)).map(parent => parent.id))];
  return projectPublicResourceMedia(await readPublicResourceMediaLines(runtimeDatabase(), scope, ids), parents, scope);
}

/** No cross-request cache: changed or withdrawn passages invalidate the entire
 * answer that saw them, whether or not the model chose to cite the passage. */
export function publicResourceMediaStillCurrent(supplied: readonly Doc[], fresh: readonly Doc[]): boolean {
  const current = new Map(fresh.filter(doc => doc.type === PUBLIC_RESOURCE_MEDIA_TYPE).map(doc => [doc.id, doc]));
  return supplied.every(doc => {
    const now = current.get(doc.id);
    return now && now.href === doc.href && now.title === doc.title && now.text === doc.text && now.authority === doc.authority
      && JSON.stringify(now.evidenceRevisions) === JSON.stringify(doc.evidenceRevisions);
  });
}
