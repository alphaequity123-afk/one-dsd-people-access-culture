import { z } from "zod";
import { adsaWorkAction } from "./adsa-work-links";
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
  preparationPlan: z.object({reviewNeeds:z.string().trim().min(10).max(1500),measure:z.string().trim().min(10).max(1500),reportBack:z.string().trim().min(5).max(1000),measureDefinition:MeasureDefinitionSchema.optional()}).strict().optional(),
  resultObservation: z.string().trim().min(10).max(1500).optional(),
  resultEvidence: z.string().trim().min(10).max(1500).optional(),
  resultLimitations: z.string().trim().min(10).max(1500).optional(),
  resultConfidence: z.enum(["early_observation", "supported_observation", "not_yet_known"]).optional(),
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

