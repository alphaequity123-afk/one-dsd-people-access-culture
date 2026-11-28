import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { programFunctions, programOutcomes } from "./model";
import { ProgramTaskSchema } from "./work-schema";

const task = (functionId: string, outcomeIds: readonly string[]) => ({
  recordType: "program_task", id: "task-" + "a".repeat(32), createdAt: "2026-11-26T00:00:00.000Z",
  functionId, outcomeIds: [...outcomeIds], kind: "resource_review", title: "Program area resource review",
  objective: "Review the currently published resources for this program area.", agentId: "program_orchestrator",
  dueAt: "2026-11-26T00:00:00.000Z", eligible: true, source: "program_maintenance", evidenceMode: "operational",
});

describe("program task outcome identifiers", () => {
  it("accept every program area's outcomes, including an area that lists them all", () => {
    for (const fn of programFunctions) expect(ProgramTaskSchema.safeParse(task(fn.id, fn.outcomeIds)).success, fn.id).toBe(true);
    expect(ProgramTaskSchema.safeParse(task("evaluation", programOutcomes.map(outcome => outcome.id))).success).toBe(true);
  });

  it("match the stored contract's limit in the latest forward migration", () => {
    const migration = readFileSync(new URL("../../db/standalone/0076_pac_dsd_program_task_outcome_limit.sql", import.meta.url), "utf8");
    expect(migration).toContain(`jsonb_array_length(payload->''outcomeIds'')>${programOutcomes.length}`);
  });
});
