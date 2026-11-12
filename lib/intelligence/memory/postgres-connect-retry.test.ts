import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const f = vi.hoisted(() => ({ unsafe: vi.fn(), begin: vi.fn() }));
vi.mock("@/lib/db/runtime-client", () => ({ leaseRuntimeSql: () => ({ sql: { unsafe: f.unsafe, begin: f.begin }, release: async () => undefined }) }));
import { PostgresStore } from "./postgres-store";

const event = { trace_id: "4cc2957e-3f32-4587-923c-11096b910116", span_id: "afbc9909", at: "2026-11-11T23:35:57.977Z", agent_id: "ask_concierge" as const, agent_version: "0.1.0",
  tool_name: "citation.attach", autonomy_level_used: "A0" as const, permission_mode: "always" as const, dry_run: false, content_ids_touched: [], allowlist_hit: true, human_disposition: null, ok: true, latency_ms: 17 };
const timedOut = () => Object.assign(new Error("write CONNECT_TIMEOUT db.example:5432"), { code: "CONNECT_TIMEOUT" });
const store = () => new PostgresStore({ databaseUrl: "postgres://runtime@localhost:5432/pac" });

beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, "warn").mockImplementation(() => undefined); });

describe("a database connection that could not be opened in time", () => {
  it("is tried once more, so one slow connection does not lose an activity record", async () => {
    f.unsafe.mockRejectedValueOnce(timedOut()).mockResolvedValueOnce([]);
    await expect(store().appendAudit(event as never)).resolves.toBeUndefined();
    expect(f.unsafe).toHaveBeenCalledTimes(2);
    expect(f.unsafe.mock.calls[1]).toEqual(f.unsafe.mock.calls[0]);
  });
  it("is reported when the second try also fails", async () => {
    f.unsafe.mockRejectedValue(timedOut());
    await expect(store().appendAudit(event as never)).rejects.toThrow("CONNECT_TIMEOUT");
    expect(f.unsafe).toHaveBeenCalledTimes(2);
  });
  it("never repeats a statement that failed for another reason, since it may have run", async () => {
    f.unsafe.mockRejectedValueOnce(Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" }));
    await expect(store().appendAudit(event as never)).rejects.toThrow("ECONNRESET");
    expect(f.unsafe).toHaveBeenCalledTimes(1);
  });
});
