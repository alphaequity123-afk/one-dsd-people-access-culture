import { responsibleWording } from "./responsible-wording";
import { describe, expect, it } from "vitest";
import { PostgresStaffPublicationReader, type StaffPublicationDatabase } from "./staff-publications";
import { contentEvidence } from "./ask-evidence";
import variants from "../../docs/editorial/resource-published-variant-review.json";
import revisions from "./professional-language-revisions.json";

describe("reviewed publication presentation", () => {
  it("applies the eight reviewed publication variants before route normalization and keeps evidence on final objects", async () => {
    const rows = variants.records.map(record => ({
      content_item_id: record.publishedOriginal.id, revision_id: record.publishedRevision,
      scope_id: "one-dhs", canonical_payload: record.publishedOriginal,
      payload_sha256: record.publishedSha256, decided_at: "2026-11-01",
    }));
    const original = JSON.stringify(rows);
    const database: StaffPublicationDatabase = { query: async <T>() => rows as unknown as T[], close: async () => {} };
    const reader = new PostgresStaffPublicationReader({ databaseUrl: "postgres://localhost/test", databaseFactory: () => database });
    const items = await reader.list("dsd");
    expect(items).toHaveLength(8);
    for (const item of items) {
      const record = variants.records.find(r => r.publishedOriginal.id === item.id)!;
      const revision = revisions.revisions.find(r => r.target === `resource.${item.id}`)!;
      for (const change of revision.changes) {
        const actual = change.path.reduce<unknown>((value, key) => (value as Record<string | number, unknown>)[key], item);
        // The reviewed wording is shown with the owner's rule for naming who is responsible applied on top.
        expect(actual).toEqual(responsibleWording(change.after));
      }
      expect(contentEvidence(item)).toEqual({ sourceId: item.id, revisionId: record.publishedRevision, payloadHash: record.publishedSha256, scope: "one-dhs" });
      expect(item.nextActions?.every(action => !action.href.startsWith("/support/request"))).toBe(true);
    }
    expect(JSON.stringify(rows)).toBe(original);
  });
});
