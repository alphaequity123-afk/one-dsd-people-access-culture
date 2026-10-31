import { describe, expect, it } from "vitest";
import { assertAuditEventPersistence } from "@/lib/trust/work-object-contract";
import { indexedProgramResources } from "./program-resources";
import { indexedStaffDocs } from "./staff-search";

const event = (id: string) => ({ trace_id: "f5ba7d21-9571-41e7-839f-75b13e09ba01", span_id: "0123abcd", at: "2026-10-31T00:00:00.000Z", agent_id: "system", agent_version: "0.1.0", tool_name: "citation.attach", autonomy_level_used: "A0", permission_mode: "always", dry_run: false, content_ids_touched: [id], allowlist_hit: true, ok: true });

describe("Ask audit records", () => {
  it("accept every document Ask can touch", async () => {
    const docs = [...await indexedStaffDocs("dsd"), ...(await indexedProgramResources("dsd")).destinations];
    const rejected = Array.from(new Set(docs.map(doc => doc.id))).filter(id => { try { assertAuditEventPersistence(event(id)); return false; } catch { return true; } });
    console.log("REJECTED", rejected.length, rejected.slice(0, 60));
    const seen = new Map<string, string>(); const dup: string[] = [];
    for (const doc of docs) { if (seen.has(doc.id) && seen.get(doc.id) !== doc.text) dup.push(doc.id); seen.set(doc.id, doc.text); }
    console.log("DUP", dup.length, dup.slice(0, 20));
    expect(rejected).toEqual([]);
  }, 600000);
});
