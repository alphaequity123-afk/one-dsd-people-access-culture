import { z } from "zod";
import { GoalActionIdsSchema } from "./work-schema";

/**
 * Voluntary outcome record: a colleague chooses to share what they tried in their work and what changed.
 * Owner decision, 2026-11-16: no identity, month only (no timestamp), consent required, private-details check.
 * The record holds no name, contact, role, unit, network address, browser details or page path.
 */
const narrative = (max: number) => z.string().trim().min(1).max(max);
const outcomeIds = ["staff_capability", "capability_transfer", "access", "workplace_culture", "institutional_application", "organizational_memory", "agency_coherence"] as const;
const publicLink = z.string().trim().max(1000).url().refine(value => {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash && !/^(?:localhost|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|\[|.*\.(?:local|internal)$)/i.test(url.hostname); }
  catch { return false; }
}, "Use a public HTTPS link without access keys or query details.");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => { const parsed = new Date(value + "T00:00:00Z"); return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value; }, "Choose a valid date.");
export const OUTCOME_MONTH = /^\d{4}-(?:0[1-9]|1[0-2])$/;
const month = z.string().regex(OUTCOME_MONTH, "Choose a month.");
const recordId = z.string().regex(/^program-outcome-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
const decision = z.enum(["retain", "revise", "stop", "not_yet_known"]);

/** What the form sends. `submissionId` is a random value made in the browser so a retry cannot create a second record. */
export const ProgramOutcomeInputSchema = z.object({
  submissionId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/), programScope: z.enum(["one-dhs", "dsd"]),
  problem: narrative(1500), action: narrative(1500), adoptedChange: narrative(1500), observedResult: narrative(2000),
  evidenceUrl: publicLink.optional(), followUp: narrative(1500),
  decision, consent: z.literal(true),
  outcomeId: z.enum(outcomeIds).optional(),
  goalActionIds: GoalActionIdsSchema.optional(),
  reviewMonth: month.optional(),
}).strict();

/** Stored record (schema 2): the input without the submission id, plus the month it was shared. */
export const ProgramOutcomeRecordV2Schema = ProgramOutcomeInputSchema.omit({ submissionId: true }).extend({
  schemaVersion: z.literal(2), id: recordId, month, evidenceStatus: z.literal("self_reported"),
}).strict();

/** Earlier records (schema 1, shared before sharing closed) are still read. They are never written again. */
export const ProgramOutcomeRecordV1Schema = z.object({
  schemaVersion: z.literal(1), id: recordId, createdAt: z.string().datetime(), evidenceStatus: z.literal("self_reported"),
  programScope: z.enum(["one-dhs", "dsd"]),
  problem: narrative(1500), action: narrative(1500), adoptedChange: narrative(1500), observedResult: narrative(2000),
  evidenceUrl: publicLink.optional(), followUp: narrative(1500), reviewDate: date.optional(),
  decision, consent: z.literal(true),
  sourceRoute: z.string().max(200).regex(/^\/(?:practice|courses|learn|areas|one-dsd|support)(?:\/[a-z0-9-]+)*$/).optional(),
  outcomeId: z.enum(outcomeIds).optional(),
}).strict();

export const ProgramOutcomeRecordSchema = z.union([ProgramOutcomeRecordV2Schema, ProgramOutcomeRecordV1Schema]);

export type ProgramOutcomeInput = z.input<typeof ProgramOutcomeInputSchema>;
export type ProgramOutcomeRecordV2 = z.infer<typeof ProgramOutcomeRecordV2Schema>;
export type ProgramOutcomeRecord = z.infer<typeof ProgramOutcomeRecordSchema>;

/** Every field a stored record may hold. The schema refuses anything else, including any identity. */
export const PROGRAM_OUTCOME_STORED_FIELDS = ["schemaVersion", "id", "month", "evidenceStatus", "programScope", "problem", "action", "adoptedChange", "observedResult", "evidenceUrl", "followUp", "decision", "consent", "outcomeId", "goalActionIds", "reviewMonth"] as const;

/** The month a record was shared. An earlier record shows only the month of its timestamp. */
export function outcomeMonth(record: ProgramOutcomeRecord): string {
  return record.schemaVersion === 2 ? record.month : record.createdAt.slice(0, 7);
}

/** The day a follow-up becomes due, if the contributor named one. */
export function outcomeReviewDay(record: ProgramOutcomeRecord): string | undefined {
  if (record.schemaVersion === 2) return record.reviewMonth ? `${record.reviewMonth}-01` : undefined;
  return record.reviewDate;
}

/** The ADSA actions a record names. Earlier records named none. */
export function outcomeGoalActionIds(record: ProgramOutcomeRecord): readonly string[] {
  return record.schemaVersion === 2 ? record.goalActionIds ?? [] : [];
}
