import "server-only";
import { getStore } from "@/lib/intelligence/memory/store";
import { inspectCollaborationText } from "@/lib/collaboration/schema";
import { ADSA_WORK_GOALS } from "./adsa-work-links";
import { programOutcomes } from "./model";
import { ProgramOutcomeInputSchema, ProgramOutcomeRecordSchema, ProgramOutcomeRecordV2Schema, outcomeGoalActionIds, outcomeMonth, type ProgramOutcomeInput, type ProgramOutcomeRecord, type ProgramOutcomeRecordV2 } from "./outcome-schema";
export { ProgramOutcomeInputSchema, ProgramOutcomeRecordSchema } from "./outcome-schema";
export type { ProgramOutcomeInput, ProgramOutcomeRecord } from "./outcome-schema";

/** The text holds names, case, health or personnel details, or other private information. */
export class OutcomeSharingRefused extends Error {}
/** Durable storage is not available, so nothing was kept. */
export class OutcomeSharingUnavailable extends Error {}

export function outcomeSharingProblem(input: Pick<ProgramOutcomeInput, "problem" | "action" | "adoptedChange" | "observedResult" | "followUp" | "evidenceUrl">): string | null {
  const text = [input.problem, input.action, input.adoptedChange, input.observedResult, input.followUp, input.evidenceUrl ?? ""].join("\n");
  const issue = inspectCollaborationText(text);
  if (issue) return issue.message;
  return null;
}

/** The month, never the day or time, in which a record was shared. */
export function sharingMonth(now: Date = new Date()): string {
  return now.toISOString().slice(0, 7);
}

/**
 * Keep a colleague's voluntary outcome record. Stores only what the schema allows: no identity, no network address,
 * no browser details, no page path and no timestamp, only the month. No idempotency receipt is written; the record id
 * comes from the browser's random submission id, so a retry rewrites the same record rather than adding one.
 */
export async function saveProgramOutcome(input: ProgramOutcomeInput, now: Date = new Date()): Promise<ProgramOutcomeRecordV2> {
  const parsed = ProgramOutcomeInputSchema.parse(input);
  const issue = outcomeSharingProblem(parsed);
  if (issue) throw new OutcomeSharingRefused(issue);
  const { submissionId, ...details } = parsed;
  const record = ProgramOutcomeRecordV2Schema.parse({ ...details, schemaVersion: 2, id: `program-outcome-${submissionId}`, month: sharingMonth(now), evidenceStatus: "self_reported" });
  const store = getStore();
  if ((process.env.NODE_ENV === "production" || process.env.VERCEL === "1") && store.backend !== "postgres") throw new OutcomeSharingUnavailable("Durable result sharing is unavailable.");
  const prior = await store.get<unknown>("decision", `program_outcome:${record.id}`);
  if (prior !== null) {
    const earlier = ProgramOutcomeRecordSchema.safeParse(prior);
    if (earlier.success) return earlier.data as ProgramOutcomeRecordV2;
  }
  const result = await store.put("decision", `program_outcome:${record.id}`, record);
  return ProgramOutcomeRecordV2Schema.parse(result.value);
}

/** Owner only; never expose the collection to staff. Ordered by month, then by the random record id, never by time. */
export async function listProgramOutcomes(): Promise<ProgramOutcomeRecord[]> {
  const rows = await getStore().list<unknown>("decision");
  return rows.flatMap(row => { const parsed = ProgramOutcomeRecordSchema.safeParse(row); return parsed.success ? [parsed.data] : []; })
    .sort((a, b) => outcomeMonth(b).localeCompare(outcomeMonth(a)) || a.id.localeCompare(b.id));
}

export type OutcomeThemeGroup = { key: string; heading: string; detail?: string; records: ProgramOutcomeRecord[] };
export type OutcomeThemes = { byGoal: OutcomeThemeGroup[]; byOutcome: OutcomeThemeGroup[]; unlinked: ProgramOutcomeRecord[] };

/**
 * Group shared accounts under the ADSA goals and the seven outcomes they name, for the owner to read as themes.
 * Groups with nothing in them are left out, and no totals are produced: these are accounts, not a measure of reach.
 */
export function outcomeThemes(records: readonly ProgramOutcomeRecord[]): OutcomeThemes {
  const byGoal = ADSA_WORK_GOALS.map(goal => {
    const ids = new Set<string>(goal.actions.map(action => action.id));
    return { key: `goal-${goal.number}`, heading: `Goal ${goal.number}: ${goal.title}`, records: records.filter(record => outcomeGoalActionIds(record).some(id => ids.has(id))) };
  }).filter(group => group.records.length > 0);
  const byOutcome = programOutcomes.map(outcome => ({ key: outcome.id, heading: outcome.title, detail: outcome.intendedChange, records: records.filter(record => record.outcomeId === outcome.id) }))
    .filter(group => group.records.length > 0);
  const unlinked = records.filter(record => !record.outcomeId && outcomeGoalActionIds(record).length === 0);
  return { byGoal, byOutcome, unlinked };
}
