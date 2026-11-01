import { describe, expect, it } from "vitest";
import postgres from "postgres";
import type { ContentItem } from "@/lib/content/types";
import { projectPublicResourceMedia, publicResourceMediaStillCurrent, readPublicResourceMediaLines } from "./public-resource-media";

const runtime = process.env.PAC_TEST_PUBLIC_MEDIA_URL;
const admin = process.env.PAC_TEST_PUBLIC_MEDIA_ADMIN_URL;
function localFixtureUrl(value: string, username: string): string {
  const url = new URL(value);
  if (url.protocol !== "postgres:" || url.hostname !== "127.0.0.1" || url.username !== username || url.pathname !== "/postgres" || !url.port) throw Error("Only the isolated loopback fixture database is allowed");
  return value;
}

describe.skipIf(!runtime || !admin)("standalone public media database boundary", () => {
  it("enforces publication, paginates exact text, and detects edits and withdrawal", async () => {
    const db = postgres(localFixtureUrl(runtime!, "pac_dsd_app_runtime"), { ssl: false, max: 1 });
    const owner = postgres(localFixtureUrl(admin!, "pac_audit"), { ssl: false, max: 1 });
    const parent = { id: "approved", title: "Synthetic resource", status: "approved", authority: "learning", reviewDate: "2026-10-01" } as ContentItem;
    try {
      const rows = await readPublicResourceMediaLines(db, "dsd", ["approved", "withdrawn", "restricted", "private", "draft", "no-model"]);
      expect(rows).toHaveLength(301);
      expect(rows.every(row => row.content_item_id === "approved")).toBe(true);
      const original = projectPublicResourceMedia(rows, [parent], "dsd");
      expect(original).toHaveLength(301);
      expect(original[0].text).toBe("synthetic public line 1");
      expect(original.every(doc => doc.href === "/resources/approved#resource-listen-approved")).toBe(true);
      await owner`update pac_dsd.resource_media set script = jsonb_set(script, '{0,text}', to_jsonb('synthetic revised line'::text)) where content_item_id = 'approved' and kind = 'audio'`;
      const edited = projectPublicResourceMedia(await readPublicResourceMediaLines(db, "dsd", ["approved"]), [parent], "dsd");
      expect(publicResourceMediaStillCurrent(original, edited)).toBe(false);
      await owner`alter table pac_dsd.publication_decisions disable trigger user`;
      await owner`insert into pac_dsd.publication_decisions(content_item_id,revision_id,scope_id,decision,gate_snapshot,decided_by,reason,sensitivity_class,unauthenticated_exposure_permitted,exposure_reason) select content_item_id,revision_id,'dsd','withdraw','{}'::jsonb,'synthetic','fixture','S1',true,'synthetic public fixture' from pac_dsd.content_revisions where content_item_id='approved'`;
      await owner`alter table pac_dsd.publication_decisions enable trigger user`;
      const withdrawn = await readPublicResourceMediaLines(db, "dsd", ["approved"]);
      expect(withdrawn).toEqual([]);
      expect(publicResourceMediaStillCurrent(original, projectPublicResourceMedia(withdrawn, [parent], "dsd"))).toBe(false);
    } finally { await db.end(); await owner.end(); }
  });
});
