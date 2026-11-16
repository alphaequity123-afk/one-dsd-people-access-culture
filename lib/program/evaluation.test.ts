import { describe, expect, it } from "vitest";
import {
  allIndicators, allowedEvidenceSources, assertAllowedMeasure, evaluationCoverage, forbiddenEvidence, forbiddenEvidenceIn,
  goal6WorkedExample, goalIndicators, indicatorProblems, logicLevels, measureDefinitionProblems, pdsaCycle, validateEvaluationModel,
  yearEvidenceLevel, type EvaluationIndicator, type EvaluationReferences,
} from "./evaluation";
import { programOutcomes } from "./model";
import { ADSA_WORK_GOALS } from "./adsa-work-links";
import { adsaImplementationActions } from "./adsa-implementation";
import { logicStages } from "./dsd-logic-model";
import { EQUITY_FRAMEWORK } from "./equity-framework";
import { measureDefinitionFields } from "./measure-definition-fields";
import { PdsaCycleSchema } from "./work-schema";

const refs: EvaluationReferences = {
  outcomeIds: programOutcomes.map(o => o.id),
  goals: ADSA_WORK_GOALS.map(goal => ({ number: goal.number, actionIds: goal.actions.map(action => action.id) })),
  logicStageSlugs: logicStages.map(stage => stage.slug),
  frameworkStages: EQUITY_FRAMEWORK.cycle.map(stage => stage.stage),
};
const good: EvaluationIndicator = {
  id: "test-good", statement: "Key decisions carry an equity review with the decision owner's disposition.", evidenceSources: ["shared_decision_record"],
  evidenceLevel: "application", sourceType: "independent_observation", reviewer: "decision_owner", logicLevel: "intermediate_outcomes",
  outcomeIds: ["institutional_application"], goalActionIds: ["ADSA-1.4"], limits: "Only shared decisions are visible.",
};

describe("evaluation model references the live program model", () => {
  it("resolves every outcome, action, goal, logic stage and cycle stage", () => {
    expect(validateEvaluationModel(refs)).toEqual([]);
  });
  it("covers all 28 actions, all seven outcomes, all six levels and every goal-year", () => {
    const coverage = evaluationCoverage(refs);
    expect(coverage.actionCount).toBe(28);
    expect(coverage.outcomeCount).toBe(7);
    expect(coverage).toMatchObject({ actionsWithout: [], outcomesWithout: [], levelsWithout: [], goalYearsWithout: [] });
    expect(adsaImplementationActions.map(a => a.id).sort()).toEqual(refs.goals.flatMap(g => g.actionIds).sort());
  });
  it("labels every indicator with level, source type, reviewer and limits; goal indicators follow the year-to-level rule", () => {
    for (const indicator of allIndicators) {
      expect(["delivery", "application", "benefit"]).toContain(indicator.evidenceLevel);
      expect(["participant_report", "independent_observation"]).toContain(indicator.sourceType);
      expect(indicator.limits.length).toBeGreaterThan(10);
    }
    for (const indicator of goalIndicators) expect(indicator.evidenceLevel).toBe(yearEvidenceLevel[indicator.year!]);
    expect(new Set(logicLevels.map(l => l.stageSlug)).size).toBeGreaterThanOrEqual(5);
  });
  it("maps all six improvement-cycle stages onto Plan, Do, Study and Act", () => {
    expect(pdsaCycle.map(step => step.step)).toEqual(["Plan", "Do", "Study", "Act"]);
    expect(pdsaCycle.flatMap(step => step.frameworkStages).sort()).toEqual([...refs.frameworkStages].sort());
  });
  it("finds an unknown action, outcome or a goal mismatch", () => {
    const bad = [{ ...good, id: "bad-ref", goalActionIds: ["ADSA-9.9"], outcomeIds: ["reach"] } as unknown as EvaluationIndicator, { ...good, id: "bad-goal", goalNumber: 2, year: 2, goalActionIds: ["ADSA-1.4"] } as EvaluationIndicator];
    const problems = validateEvaluationModel(refs, bad).join("\n");
    expect(problems).toMatch(/unknown ADSA action "ADSA-9.9"/);
    expect(problems).toMatch(/unknown outcome "reach"/);
    expect(problems).toMatch(/action ADSA-1.4 is not in goal 2/);
  });
});

describe("the validator rejects forbidden evidence", () => {
  it("accepts an indicator from allowed sources", () => {
    expect(indicatorProblems(good)).toEqual([]);
  });
  it.each(forbiddenEvidence.map(f => f.id))("rejects an indicator that names the forbidden source %s", id => {
    const problems = indicatorProblems({ ...good, evidenceSources: [id as never] });
    expect(problems.join("\n")).toMatch(/forbidden evidence source/);
  });
  it.each([
    "Course completions by unit show capability.",
    "Podcast chapters played each month.",
    "Page views and visits to the site.",
    "Average time spent on lessons.",
    "Ask counts by topic.",
    "Attendance by unit at training sessions.",
    "Share of right answers on lesson checks.",
    "Rank staff by their readiness.",
  ])("rejects an indicator whose statement uses forbidden evidence: %s", statement => {
    expect(indicatorProblems({ ...good, statement }).join("\n")).toMatch(/statement uses forbidden evidence/);
  });
  it("rejects a source that cannot support the level and a goal indicator in the wrong year", () => {
    expect(indicatorProblems({ ...good, evidenceSources: ["plan_or_charter"], evidenceLevel: "benefit" }).join("\n")).toMatch(/no source supports the benefit level/);
    expect(indicatorProblems({ ...good, goalNumber: 1, year: 1 }).join("\n")).toMatch(/year 1 indicators are delivery evidence/);
  });
  it("rejects measure definitions that count learning or use, in any measured field", () => {
    const fields = measureDefinitionFields.map(f => f.id).filter(id => !["differencesPrivacy", "reviewReference", "nextTrigger"].includes(id));
    for (const field of fields) expect(measureDefinitionProblems({ [field]: "Percent of staff completing the Core 15 courses" })).not.toEqual([]);
    expect(() => assertAllowedMeasure({ calculation: "Podcast episodes played per month" })).toThrow(/never evidence/);
    expect(measureDefinitionProblems({ population: "All staff who visited the site", evidenceSource: "Site analytics" })).not.toEqual([]);
  });
  it("accepts measures from allowed sources and limits stated in the negative", () => {
    expect(measureDefinitionProblems(goal6WorkedExample.plan.measure)).toEqual([]);
    expect(measureDefinitionProblems({ evidenceSource: "Shared decision records, rather than page views or completions." })).toEqual([]);
    expect(measureDefinitionProblems({ calculation: "Key decisions with a completed equity review divided by key decisions." })).toEqual([]);
    expect(forbiddenEvidenceIn("Completing a course is a starting point, not evidence of change.")).toEqual([]);
  });
  it("flags copy that promises future counting", () => {
    expect(forbiddenEvidenceIn("Completed reviews are not counted yet.").map(f => f.id)).toContain("learning_activity_count");
  });
  it("keeps allowed and forbidden sources apart", () => {
    const allowed = new Set<string>(allowedEvidenceSources.map(s => s.id));
    for (const f of forbiddenEvidence) expect(allowed.has(f.id)).toBe(false);
  });
});

describe("the worked Goal 6 example is a complete, valid Plan-Do-Study-Act cycle", () => {
  it("passes the cycle schema", () => {
    expect(PdsaCycleSchema.safeParse(goal6WorkedExample).success).toBe(true);
  });
});
