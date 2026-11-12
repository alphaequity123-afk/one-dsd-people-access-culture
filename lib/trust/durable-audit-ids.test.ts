import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { durableAuditContentIds } from "./work-object-contract";

describe("audit IDs stored in the database", () => {
  it("keeps only IDs the database accepts", () => {
    expect(durableAuditContentIds(["pn-a", "ja-b", "hmong", "tool-c", "program-reading-d", "ref-dhs-equity-landscape", "research-hmong-person-0", "curriculum-A23", "profile-hmong-people-0", "calendar-hmong--new-year", "water-module-1-0"]))
      .toEqual(["pn-a", "ja-b", "hmong"]);
  });
  it("uses the same rule as the database's bootstrap", () => {
    const sql = readFileSync("db/standalone/bootstrap.sql", "utf8");
    const contract = readFileSync("lib/trust/work-object-contract.ts", "utf8");
    expect(contract).toContain(JSON.stringify(sql.match(/content_id !~ '([^']+)'/)![1]));
    expect(contract).toContain(JSON.stringify(sql.match(/or content_id ~\* '([^']+)'/)![1]));
  });
});

describe("identifiers an activity record may carry", () => {
  it("accepts state agencies, state pages and policies, and leaves out anything unrecognised", async () => {
    const { auditableContentIds, assertAuditEventPersistence } = await import("./work-object-contract");
    const ids = auditableContentIds(["agency:federal-social-security-administration", "state-page:32", "policy:language-access", "asset-lesson-a3c8", "asset-lesson-a3c8", "Not An Id!"]);
    expect(ids).toEqual(["agency:federal-social-security-administration", "state-page:32", "policy:language-access", "asset-lesson-a3c8"]);
    expect(() => assertAuditEventPersistence({
      trace_id: "4cc2957e-3f32-4587-923c-11096b910116", span_id: "afbc9909", at: "2026-11-11T23:35:57.977Z", agent_id: "ask_concierge", agent_version: "0.1.0",
      tool_name: "citation.attach", autonomy_level_used: "A0", permission_mode: "always", dry_run: false, content_ids_touched: ids, allowlist_hit: true, human_disposition: null, ok: true, latency_ms: 17,
    })).not.toThrow();
  });
});
