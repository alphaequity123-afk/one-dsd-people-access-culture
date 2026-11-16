import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { auditBelongsToOwnerWork, withOwnerWorkAudit } from "./owner-audit";
import { resetStoreForTests } from "./store";
import type { AuditEvent } from "../types";

const event = (agent_id: AuditEvent["agent_id"], permission_mode: AuditEvent["permission_mode"] = "always"): AuditEvent => ({
  trace_id: "4cc2957e-3f32-4587-923c-11096b910116", span_id: "afbc9909", at: "2026-11-16T12:00:00.000Z", agent_id, agent_version: "0.1.0",
  tool_name: "citation.attach", autonomy_level_used: "A0", permission_mode, dry_run: false, content_ids_touched: [], allowlist_hit: true, human_disposition: null, ok: true, latency_ms: 1,
});

describe("the activity record keeps owner and contributor work only (owner rule 2026-11-16)", () => {
  it("drops every agent staff can reach", () => {
    for (const agent of ["ask_concierge", "ci_guide", "consult_intake", "graduation_coach", "embed_advisor", "a11y_reviewer", "program_orchestrator"] as const) {
      expect(auditBelongsToOwnerWork(event(agent)), agent).toBe(false);
    }
  });
  it("keeps owner-only agents and owner-only system actions", () => {
    for (const agent of ["librarian", "content_sentinel", "eval_steward"] as const) expect(auditBelongsToOwnerWork(event(agent)), agent).toBe(true);
    expect(auditBelongsToOwnerWork(event("system", "owner_only"))).toBe(true);
    expect(auditBelongsToOwnerWork(event("system", "always"))).toBe(false);
  });
  it("keeps the steps of owner or scheduled work", async () => {
    await withOwnerWorkAudit(async () => expect(auditBelongsToOwnerWork(event("program_orchestrator"))).toBe(true));
    expect(auditBelongsToOwnerWork(event("program_orchestrator"))).toBe(false);
  });
  it("stores nothing for a staff request", async () => {
    const store = resetStoreForTests();
    await store.appendAudit(event("ask_concierge"));
    await store.appendAudit(event("ci_guide"));
    expect(await store.listAudit()).toEqual([]);
    await store.appendAudit(event("content_sentinel"));
    expect(await store.listAudit()).toHaveLength(1);
    expect("counter" in store).toBe(false);
  });
});
