import { z } from "zod";
import { adsaWorkAction } from "./adsa-work-links";
import { programOutcomes, type ProgramOutcomeId } from "./model";
import { forbiddenEvidenceIn, measureDefinitionProblems, pdsaDispositions, type PdsaStep } from "./evaluation";
export const GoalActionIdsSchema=z.array(z.string().refine(id=>Boolean(adsaWorkAction(id)),"Choose a supplied ADSA action step.")).max(28).refine(ids=>new Set(ids).size===ids.length,"Choose each action once.").transform(ids=>[...ids].sort());
/** Public/general references only; a link is not proof of applicability or approval. */
export const ProgramReferenceSchema = z.object({
  label: z.string().trim().min(2).max(240),
  href: z.string().trim().max(1500).refine(value => {
    if (/^\/(?!\/)/.test(value)) return !/[\\\s]/.test(value);
    try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; }
    catch { return false; }
  }, "Use a program path or a public HTTPS source without sign-in details."),
}).strict();
export const MeasureDefinitionInputSchema = z.object({
  title:z.string().trim().min(5).max(240),
  calculation:z.string().trim().min(10).max(1500),
  population:z.string().trim().min(10).max(1000),
  evidenceSource:z.string().trim().min(10).max(1500),
  period:z.string().trim().min(5).max(500),
  comparison:z.string().trim().min(10).max(1500),
  differencesPrivacy:z.string().trim().min(10).max(1500),
  targetReference:z.string().trim().min(5).max(1500),
  reviewReference:z.string().trim().min(5).max(1500),
  nextTrigger:z.string().trim().min(5).max(1000),
}).strict();
export const MeasureDefinitionSchema = MeasureDefinitionInputSchema.extend({
  id:z.string().regex(/^measure-[a-f0-9]{32}$/),
  version:z.number().int().min(1).max(100000),
  status:z.literal("proposed"),
}).strict();
export const ProgramTaskSchema = z.object({
  recordType: z.literal("program_task"), id: z.string().regex(/^task-[a-f0-9]{32}$/), createdAt: z.iso.datetime(),
  functionId: z.string().min(1).max(60), goalActionIds:GoalActionIdsSchema.optional(), outcomeIds: z.array(z.string().max(60)).max(7),
  kind: z.enum(["work_preparation", "cadence_review", "outcome_followup", "source_review", "resource_review"]),
  title: z.string().min(5).max(180), objective: z.string().min(10).max(3000),
  agentId: z.enum(["program_orchestrator", "ask_concierge", "ci_guide", "librarian", "a11y_reviewer", "consult_intake", "graduation_coach", "embed_advisor", "content_sentinel", "eval_steward"]),
  sourceId: z.string().max(180).optional(), dueAt: z.iso.datetime(),
  eligible: z.boolean(), exclusionReason: z.string().max(300).optional(),
  source: z.enum(["owner", "cadence", "staff_result", "program_maintenance"]),
  evidenceMode: z.enum(["operational", "verification"]),
  executionMode: z.enum(["manual", "assisted"]).optional(),
}).strict().refine(x => x.eligible || Boolean(x.exclusionReason), "An exclusion needs a reason.");
export type ProgramTask = z.infer<typeof ProgramTaskSchema>;
export const ProgramReceiptSchema = z.object({
  title: z.string().min(1).max(180), body: z.string().min(20).max(18000),
  evidenceLevel: z.enum(["delivery", "application", "benefit"]),
  method: z.enum(["generated_artifact", "program_record_review", "source_check", "owner_report"]),
  references: z.array(z.object({ label: z.string().max(240), href: z.string().max(1500).refine(v => /^\/(?!\/)/.test(v) || /^https:\/\//.test(v)) }).strict()).max(20),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
export const ProgramEventSchema = z.object({
  recordType: z.literal("program_event"), id: z.string().uuid(), taskId: z.string().regex(/^task-[a-f0-9]{32}$/), at: z.iso.datetime(),
  phase: z.enum(["started", "completed", "prepared", "decision_recorded", "results_recorded", "failed", "applied", "reviewed", "cancelled", "retry_requested"]),
  attempt: z.number().int().min(0).max(10000), actor: z.enum(["agent", "owner"]),
  note: z.string().max(3000), receipt: ProgramReceiptSchema.optional(),
  disposition: z.enum(["retain", "revise", "stop", "not_yet_known"]).optional(),
  followUpAt: z.iso.datetime().optional(), humanMinutes: z.number().min(0).max(100000).optional(),
  preparationPlan: z.object({reviewNeeds:z.string().trim().min(10).max(1500),measure:z.string().trim().min(10).max(1500),reportBack:z.string().trim().min(5).max(1000),measureDefinition:MeasureDefinitionSchema.optional(),
    /** Plan-Do-Study-Act: what the owner expects to happen. Optional so earlier records stay valid. */
    prediction:z.string().trim().min(10).max(1500).optional()}).strict().optional(),
  resultObservation: z.string().trim().min(10).max(1500).optional(),
  resultEvidence: z.string().trim().min(10).max(1500).optional(),
  resultLimitations: z.string().trim().min(10).max(1500).optional(),
  resultConfidence: z.enum(["early_observation", "supported_observation", "not_yet_known"]).optional(),
  /** Plan-Do-Study-Act Study labels. Optional so earlier records stay valid. */
  resultEvidenceLevel: z.enum(["delivery", "application", "benefit"]).optional(),
  resultSourceType: z.enum(["participant_report", "independent_observation"]).optional(),
  decisionOwner: z.string().trim().min(2).max(240).optional(),
  decisionReference: z.string().trim().min(5).max(1500).optional(),
  nextAction: z.string().trim().min(5).max(1500).optional(),
  implementationOwner: z.string().trim().min(2).max(240).optional(),
}).strict().refine(x => x.phase !== "completed" || Boolean(x.receipt), "Completion requires a receipt.")
.refine(x => x.phase !== "prepared" || (x.actor === "owner" && x.receipt?.method === "owner_report" && x.receipt.evidenceLevel === "delivery"), "Manual preparation requires the owner's saved draft.")
.refine(x => x.phase !== "decision_recorded" || Boolean(x.decisionOwner && x.decisionReference && x.nextAction && x.implementationOwner), "Record the decision authority, reference and responsible next action.")
.refine(x => x.phase !== "results_recorded" || Boolean(x.resultObservation && x.resultEvidence && x.resultLimitations && x.resultConfidence), "Results require an observation, evidence and limitations.")
.refine(x => !["results_recorded", "prepared", "decision_recorded", "applied", "reviewed", "cancelled", "retry_requested"].includes(x.phase) || x.actor === "owner", "Only the owner can record this decision.");
export type ProgramEvent = z.infer<typeof ProgramEventSchema>;

/* ------------------------------------------------------- Plan-Do-Study-Act cycle record ------------------------------------------------------- */

const outcomeIdValues = programOutcomes.map(outcome => outcome.id) as [ProgramOutcomeId, ...ProgramOutcomeId[]];
const cycleText = (min: number, max: number) => z.string().trim().min(min).max(max);

/** Problems when a measure, prediction or piece of evidence counts learning or use. Empty means allowed. */
export function learningActivityProblems(fields: { measure?: Partial<Record<string, string>>; texts?: Array<string | undefined> }): string[] {
  const problems = fields.measure ? measureDefinitionProblems(fields.measure) : [];
  for (const text of fields.texts ?? []) for (const finding of forbiddenEvidenceIn(text ?? "")) problems.push(`uses forbidden evidence (${finding.id}): "${finding.match}"`);
  return problems;
}

/**
 * One Plan-Do-Study-Act cycle, the owner's name for the program's six-stage improvement cycle (evaluation.ts pdsaCycle).
 * It reuses the program work record's parts: ADSA action links, outcome ids, the ten measure fields and the disposition.
 * A cycle can be written whole (this schema) or read from existing program work records (pdsaFromProgramWork).
 */
export const PdsaCycleSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^pdsa-[a-z0-9-]{3,80}$/),
  taskId: z.string().regex(/^task-[a-f0-9]{32}$/).optional(),
  title: cycleText(5, 180),
  goalActionIds: GoalActionIdsSchema,
  outcomeIds: z.array(z.enum(outcomeIdValues)).max(7).refine(ids => new Set(ids).size === ids.length, "Choose each outcome once."),
  plan: z.object({
    question: cycleText(10, 1500), change: cycleText(10, 1500), affected: cycleText(5, 1000), prediction: cycleText(10, 1500),
    measure: MeasureDefinitionInputSchema, decisionOwner: cycleText(2, 240),
    reviewMonth: z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/).optional(),
  }).strict(),
  do: z.object({ scope: cycleText(5, 1000), whatHappened: cycleText(10, 1500), beforeAfter: cycleText(5, 1500).optional() }).strict().optional(),
  study: z.object({
    comparedWithPrediction: cycleText(10, 1500), observation: cycleText(10, 1500), evidence: cycleText(10, 1500),
    evidenceLevel: z.enum(["delivery", "application", "benefit"]), sourceType: z.enum(["participant_report", "independent_observation"]),
    limits: cycleText(10, 1500), confidence: z.enum(["early_observation", "supported_observation", "not_yet_known"]),
  }).strict().optional(),
  act: z.object({
    disposition: z.enum(pdsaDispositions), decisionOwner: cycleText(2, 240), decisionReference: cycleText(5, 1500),
    nextAction: cycleText(5, 1500), implementationOwner: cycleText(2, 240), reportBack: cycleText(5, 1000),
  }).strict().optional(),
}).strict().superRefine((cycle, context) => {
  if (!cycle.goalActionIds.length && !cycle.outcomeIds.length) context.addIssue({ code: "custom", path: ["outcomeIds"], message: "Link the cycle to an ADSA action or an outcome." });
  if (cycle.study && !cycle.do) context.addIssue({ code: "custom", path: ["study"], message: "Study follows Do: write down what happened first." });
  if (cycle.act && !cycle.study) context.addIssue({ code: "custom", path: ["act"], message: "Act follows Study: compare the result with the prediction first." });
  for (const problem of learningActivityProblems({ measure: cycle.plan.measure, texts: [cycle.plan.prediction, cycle.study?.evidence] }))
    context.addIssue({ code: "custom", path: ["plan", "measure"], message: `Learning or use is never counted as evidence. ${problem}` });
});
export type PdsaCycle = z.infer<typeof PdsaCycleSchema>;

type MeasureDefinitionInput = z.infer<typeof MeasureDefinitionInputSchema>;
export type PdsaView = {
  taskId: string; title: string; step: PdsaStep | "Closed";
  goalActionIds: string[]; outcomeIds: string[];
  plan: { question: string; prediction?: string; measure?: string; measureDefinition?: MeasureDefinitionInput; decisionOwner?: string };
  do?: { whatHappened: string };
  study?: { observation: string; evidence: string; limits: string; confidence: string; evidenceLevel?: string; sourceType?: string };
  act?: { disposition: string; decisionOwner: string; nextAction: string; implementationOwner: string };
};

/** Read an existing program work record as a Plan-Do-Study-Act cycle. Older records without a prediction still read. */
export function pdsaFromProgramWork(task: ProgramTask, events: readonly ProgramEvent[]): PdsaView {
  const own = events.filter(event => event.taskId === task.id && event.actor === "owner");
  const prepared = own.findLast(event => event.phase === "prepared" && event.preparationPlan);
  const firstDecision = own.find(event => event.phase === "decision_recorded");
  const applied = own.findLast(event => event.phase === "applied");
  const results = own.findLast(event => event.phase === "results_recorded");
  const act = results ? own.findLast(event => event.phase === "decision_recorded" && event.at > results.at) : undefined;
  const definition = prepared?.preparationPlan?.measureDefinition;
  const view: PdsaView = {
    taskId: task.id, title: task.title, step: "Plan",
    goalActionIds: [...(task.goalActionIds ?? [])], outcomeIds: [...task.outcomeIds],
    plan: {
      question: task.objective, prediction: prepared?.preparationPlan?.prediction, measure: prepared?.preparationPlan?.measure,
      measureDefinition: definition ? MeasureDefinitionInputSchema.parse(Object.fromEntries(Object.entries(definition).filter(([key]) => !["id", "version", "status"].includes(key)))) : undefined,
      decisionOwner: firstDecision?.decisionOwner,
    },
  };
  if (applied) { view.do = { whatHappened: applied.note }; view.step = "Do"; }
  if (results?.resultObservation && results.resultEvidence && results.resultLimitations && results.resultConfidence) {
    view.study = { observation: results.resultObservation, evidence: results.resultEvidence, limits: results.resultLimitations, confidence: results.resultConfidence, evidenceLevel: results.resultEvidenceLevel, sourceType: results.resultSourceType };
    view.step = "Study";
  }
  if (act?.disposition && act.decisionOwner && act.nextAction && act.implementationOwner) {
    view.act = { disposition: act.disposition, decisionOwner: act.decisionOwner, nextAction: act.nextAction, implementationOwner: act.implementationOwner };
    view.step = act.disposition === "stop" || act.disposition === "retain" ? "Closed" : "Act";
  }
  return view;
}
