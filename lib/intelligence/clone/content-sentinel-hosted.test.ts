import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
vi.mock("server-only", () => ({}));
import { getStore, withIsolatedMemoryStore } from "../memory/store";
import { setPolicy } from "../policy";
import { getAgent } from "../registry/agents";
import { runTool } from "../tools/runtime";
import type { ToolContext } from "../types";
import { createProgramTask, listProgramWork, runProgramWork } from "@/lib/program/work";

beforeEach(() => {
  vi.stubEnv("PAC_CLONE_AGENTS", "on");
  vi.stubEnv("PAC_AUTONOMY_MAX", "A5");
  vi.stubEnv("PAC_CONTENT_SOURCE", "static");
});
afterEach(() => vi.unstubAllEnvs());

describe.each(["preview", "production"])("content sentinel in %s", environment => {
  beforeEach(() => vi.stubEnv("VERCEL_ENV", environment));

  it("completes and reopens an owner resource-review receipt without recording approval or application", async () => {
    await withIsolatedMemoryStore(async () => {
      const task = await createProgramTask({
        functionId: "organizational_knowledge", kind: "resource_review",
        title: "Organizational knowledge: published resource review",
        objective: "Review published organizational resources and record source-linked maintenance findings.",
        dueAt: "2026-10-01T12:00:00Z", eligible: true,
        source: "program_maintenance", evidenceMode: "verification",
      });
      expect(task.agentId).toBe("content_sentinel");
      const result = await runProgramWork({ limit: 1 });
      expect(result).toEqual({ completed: [task.id], failed: [], skipped: [] });
      const reopened = (await listProgramWork()).find(item => item.id === task.id)!;
      expect(reopened.status).toBe("completed");
      expect(reopened.receipt?.method).toBe("program_record_review");
      expect(reopened.receipt?.references.length).toBeGreaterThan(0);
      expect(reopened.events.map(event => event.phase)).toEqual(["started", "completed"]);
      expect(getAgent("content_sentinel").review_rule).toBe("human_approve");
      expect(await getStore().listAudit(10)).toContainEqual(expect.objectContaining({
        agent_id: "content_sentinel", tool_name: "program.work_execute", ok: true,
      }));
    });
  }, 60_000);

  it.each([
    { name: "staff role", role: "staff" as const, patch: {}, reason: "role outside agent scope", code: "agent_disabled" },
    { name: "disabled feature flag", role: "owner" as const, patch: { flags: { "agent.content_sentinel": false } }, reason: "agent feature flag is off", code: "agent_disabled" },
    { name: "owner stop", role: "owner" as const, patch: { killed: true }, reason: undefined, code: "kill_switch" },
    { name: "reduced autonomy", role: "owner" as const, patch: { max_autonomy: "A1" as const }, reason: "tool requires A2; effective ceiling A1", code: "autonomy_ceiling" },
  ])("still blocks $name before executing the tool", async ({ role, patch, reason, code }) => {
    await withIsolatedMemoryStore(async () => {
      await setPolicy(patch);
      const ctx: ToolContext = { agent: getAgent("content_sentinel"), role, dry_run: false, trace_id: randomUUID() };
      const execute = vi.fn(() => "must not execute");
      await expect(runTool(ctx, "program.work_execute", execute)).rejects.toMatchObject({
        tool: "program.work_execute", ...(reason ? { reason } : {}),
      });
      expect(execute).not.toHaveBeenCalled();
      expect(await getStore().listAudit(10)).toContainEqual(expect.objectContaining({
        agent_id: "content_sentinel", tool_name: "program.work_execute", ok: false, error_code: code,
      }));
    });
  });
});
