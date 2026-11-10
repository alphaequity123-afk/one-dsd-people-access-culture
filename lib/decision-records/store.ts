import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { equityCaseDatabase } from "@/lib/db/owner-client";
import { activeCaseKey, decisionRecordAad, openCaseEnvelope, previousCaseKey, sealCaseEnvelope, ToolkitCaseError, type CaseRow } from "@/lib/consultant-toolkit/cases";
import { DECISION_RECORD_FIELDS, MAX_FIELD, MAX_TITLE } from "@/lib/implementation/records";

// A decision record lives on the person's computer unless they choose "Save to the team space".
// Saved records sit in the Equity workspace's encrypted case table under their own additional
// data, with kind "decision-record" inside the envelope. No database change is needed.

export const DECISION_RECORD_KIND = "decision-record";
const fieldKeys = DECISION_RECORD_FIELDS.map(field => field.key) as [string, ...string[]];
export const recordFieldsSchema = z.partialRecord(z.enum(fieldKeys), z.string().max(MAX_FIELD));
export const saveRecordSchema = z.object({ title: z.string().trim().min(1).max(MAX_TITLE), fields: recordFieldsSchema, savedBy: z.string().trim().max(120).default("") }).strict();
export const updateRecordSchema = saveRecordSchema.extend({ id: z.string().uuid(), version: z.number().int().min(1) }).strict();

const storedSchema = z.object({
  kind: z.literal(DECISION_RECORD_KIND), id: z.string().uuid(), version: z.number().int().min(1),
  title: z.string().max(MAX_TITLE), fields: recordFieldsSchema, savedBy: z.string().max(120),
  createdAt: z.string(), updatedAt: z.string(),
}).strict();
export type TeamDecisionRecord = z.infer<typeof storedSchema>;

export class DecisionRecordError extends Error {
  constructor(readonly code: "unavailable" | "not_found" | "conflict" | "invalid", readonly status: number) { super(code); }
}

function keys() {
  try { return { key: activeCaseKey(), previous: previousCaseKey() }; }
  catch { throw new DecisionRecordError("unavailable", 503); }
}
async function database() {
  try { return await equityCaseDatabase(); }
  catch { throw new DecisionRecordError("unavailable", 503); }
}

export function sealRecord(value: TeamDecisionRecord, key: Buffer): string {
  try { return sealCaseEnvelope(JSON.stringify(value), decisionRecordAad(value.id, value.version), key); }
  catch (error) { throw error instanceof ToolkitCaseError ? new DecisionRecordError("invalid", 413) : error; }
}

/** The record in a row, or null when the row holds another kind of case. */
export function openRecord(row: Pick<CaseRow, "id" | "version" | "encrypted_payload">, key: Buffer, previous?: Buffer): TeamDecisionRecord | null {
  const raw = openCaseEnvelope(row.encrypted_payload, decisionRecordAad(row.id, row.version), key, previous);
  if (raw === undefined) return null;
  try {
    const value = storedSchema.parse(JSON.parse(raw));
    if (value.id !== row.id || value.version !== row.version) return null;
    return value;
  } catch { return null; }
}

export async function teamSpaceAvailable(): Promise<boolean> {
  try { keys(); const sql = await database(); await sql`select id from pac_dsd.consultant_toolkit_cases limit 0`; return true; }
  catch { return false; }
}

export async function listTeamRecords(): Promise<TeamDecisionRecord[]> {
  const { key, previous } = keys(), sql = await database();
  const rows = await sql<CaseRow[]>`select id, version, status, encrypted_payload, created_at, updated_at, finalized_at from pac_dsd.consultant_toolkit_cases order by updated_at desc, id limit 400`;
  return rows.flatMap(row => { const value = openRecord(row, key, previous); return value ? [value] : []; });
}

export async function saveTeamRecord(input: z.infer<typeof saveRecordSchema>): Promise<TeamDecisionRecord> {
  const now = new Date().toISOString();
  const record: TeamDecisionRecord = { kind: DECISION_RECORD_KIND, id: randomUUID(), version: 1, title: input.title, fields: input.fields, savedBy: input.savedBy, createdAt: now, updatedAt: now };
  const { key } = keys(), sql = await database();
  const sealed = sealRecord(record, key);
  await sql.begin(async tx => {
    await tx`insert into pac_dsd.consultant_toolkit_cases(id,version,status,encrypted_payload,created_at,updated_at) values(${record.id}::uuid,1,'draft',${sealed},${now}::timestamptz,${now}::timestamptz)`;
    await tx`insert into pac_dsd.consultant_toolkit_case_revisions(case_id,version,status,encrypted_payload,created_at) values(${record.id}::uuid,1,'draft',${sealed},${now}::timestamptz)`;
  });
  return record;
}

export async function updateTeamRecord(input: z.infer<typeof updateRecordSchema>): Promise<TeamDecisionRecord> {
  const { key, previous } = keys(), sql = await database();
  return sql.begin(async tx => {
    const rows = await tx<CaseRow[]>`select id,version,status,encrypted_payload,created_at,updated_at,finalized_at from pac_dsd.consultant_toolkit_cases where id=${input.id}::uuid for update`;
    const current = rows[0] ? openRecord(rows[0], key, previous) : null;
    if (!current) throw new DecisionRecordError("not_found", 404);
    if (current.version !== input.version) throw new DecisionRecordError("conflict", 409);
    const now = new Date().toISOString();
    const next: TeamDecisionRecord = { ...current, title: input.title, fields: input.fields, savedBy: input.savedBy || current.savedBy, version: current.version + 1, updatedAt: now };
    const sealed = sealRecord(next, key);
    await tx`update pac_dsd.consultant_toolkit_cases set version=${next.version},encrypted_payload=${sealed},updated_at=${now}::timestamptz where id=${next.id}::uuid and version=${current.version}`;
    await tx`insert into pac_dsd.consultant_toolkit_case_revisions(case_id,version,status,encrypted_payload,created_at) values(${next.id}::uuid,${next.version},'draft',${sealed},${now}::timestamptz)`;
    return next;
  });
}
