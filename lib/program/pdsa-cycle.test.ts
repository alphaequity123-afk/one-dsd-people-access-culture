import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { goal6WorkedExample } from "./evaluation";
import { PdsaCycleSchema, ProgramEventSchema, ProgramTaskSchema, pdsaFromProgramWork, type ProgramEvent } from "./work-schema";

const taskId = "task-" + "a".repeat(32);
const task = ProgramTaskSchema.parse({
  recordType: "program_task", id: taskId, createdAt: "2026-11-01T12:00:00.000Z", functionId: "evaluation", goalActionIds: ["ADSA-6.3", "ADSA-6.1"],
  outcomeIds: ["access"], kind: "work_preparation", title: "Plain-language appointment notice", objective: "Is the unit's appointment notice hard to act on?",
  agentId: "eval_steward", dueAt: "2026-11-01T12:00:00.000Z", eligible: true, source: "owner", evidenceMode: "operational", executionMode: "manual",
});
const at = (day: number) => `2026-11-${String(day).padStart(2, "0")}T12:00:00.000Z`;
const event = (phase: ProgramEvent["phase"], day: number, extra: Partial<ProgramEvent> = {}): ProgramEvent => ProgramEventSchema.parse({ recordType: "program_event", id: randomUUID(), taskId, at: at(day), phase, attempt: 0, actor: "owner", note: `Owner note for ${phase}.`, ...extra });
const measureDefinition = { ...goal6WorkedExample.plan.measure, id: "measure-" + "a".repeat(32), version: 1, status: "proposed" as const };

describe("Plan-Do-Study-Act cycle record", () => {
  it("accepts a complete cycle and keeps earlier work records valid", () => {
    expect(PdsaCycleSchema.parse(goal6WorkedExample).goalActionIds).toEqual(["ADSA-6.1", "ADSA-6.3"]);
    // An event written before the cycle fields existed still parses.
    expect(ProgramEventSchema.safeParse({ recordType: "program_event", id: randomUUID(), taskId, at: at(2), phase: "results_recorded", attempt: 0, actor: "owner", note: "Earlier result.", resultObservation: "General access observation", resultEvidence: "General comparison period", resultLimitations: "Attribution remains unknown", resultConfidence: "early_observation" }).success).toBe(true);
  });
  it("rejects a cycle whose measure, prediction or evidence counts learning or use", () => {
    const withMeasure = (patch: Record<string, string>) => ({ ...goal6WorkedExample, plan: { ...goal6WorkedExample.plan, measure: { ...goal6WorkedExample.plan.measure, ...patch } } });
    for (const patch of [{ calculation: "Course completions by unit divided by staff in the unit." }, { population: "Staff who attended the training sessions on plain language." }, { evidenceSource: "Page views of the plain-language course." }, { comparison: "Podcast episodes played before and after the change." }] as Record<string, string>[]) {
      const parsed = PdsaCycleSchema.safeParse(withMeasure(patch));
      expect(parsed.success).toBe(false);
      expect(parsed.error?.issues.map(i => i.message).join(" ")).toMatch(/never counted as evidence/);
    }
    expect(PdsaCycleSchema.safeParse({ ...goal6WorkedExample, plan: { ...goal6WorkedExample.plan, prediction: "More staff will have completed the course on plain language." } }).success).toBe(false);
    expect(PdsaCycleSchema.safeParse({ ...goal6WorkedExample, study: { ...goal6WorkedExample.study, evidence: "Ask counts by topic over the month." } }).success).toBe(false);
  });
  it("keeps the order Plan, Do, Study, Act and requires a link to an action or outcome", () => {
    const { do: _do, ...withoutDo } = goal6WorkedExample;
    void _do;
    expect(PdsaCycleSchema.safeParse(withoutDo).success).toBe(false);
    expect(PdsaCycleSchema.safeParse({ ...goal6WorkedExample, goalActionIds: [], outcomeIds: [] }).success).toBe(false);
    expect(PdsaCycleSchema.safeParse({ ...goal6WorkedExample, goalActionIds: ["ADSA-9.9"] }).success).toBe(false);
    expect(PdsaCycleSchema.safeParse({ ...goal6WorkedExample, act: { ...goal6WorkedExample.act, disposition: "approved" } }).success).toBe(false);
  });
  it("reads existing program work records as a cycle", () => {
    const events = [
      event("prepared", 2, { preparationPlan: { reviewNeeds: "Unit lead and Goal 6 lead review.", measure: "Next-step calls about the notice, before and after.", reportBack: "Phone staff", measureDefinition, prediction: "Fewer next-step questions after the rewrite." }, receipt: { title: "Plan", body: "A plan for a one-month plain-language test of the notice.", evidenceLevel: "delivery", method: "owner_report", references: [], contentHash: "0".repeat(64) } }),
      event("decision_recorded", 3, { decisionOwner: "Unit lead", decisionReference: "Unit meeting", nextAction: "Try the rewrite for one month.", implementationOwner: "Unit lead" }),
      event("applied", 4, { note: "The rewritten notice went out for one month." }),
      event("results_recorded", 5, { resultObservation: "Fewer next-step questions.", resultEvidence: "The unit's call-reason tallies for two months.", resultLimitations: "One month each side; seasonal change.", resultConfidence: "early_observation", resultEvidenceLevel: "application", resultSourceType: "independent_observation" }),
      event("decision_recorded", 6, { disposition: "revise", decisionOwner: "Unit lead", decisionReference: "Unit meeting", nextAction: "Add where to bring documents.", implementationOwner: "Unit lead" }),
    ];
    const view = pdsaFromProgramWork(task, events);
    expect(view.step).toBe("Act");
    expect(view.plan.prediction).toMatch(/Fewer next-step/);
    expect(view.plan.measureDefinition?.title).toBe(goal6WorkedExample.plan.measure.title);
    expect(view.plan.decisionOwner).toBe("Unit lead");
    expect(view.do?.whatHappened).toMatch(/one month/);
    expect(view.study).toMatchObject({ evidenceLevel: "application", sourceType: "independent_observation" });
    expect(view.act?.disposition).toBe("revise");
    expect(pdsaFromProgramWork(task, events.slice(0, 2)).step).toBe("Plan");
  });
});
