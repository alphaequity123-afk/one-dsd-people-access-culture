import "server-only";
import { randomUUID } from "node:crypto";
import { ownerDatabase } from "@/lib/db/owner-client";
import {
  activeCaseKey,
  caseRowKind,
  openCaseEnvelope,
  policyChangeCaseAad,
  previousCaseKey,
  sealCaseEnvelope,
  toolkitCaseSavingAvailability,
  ToolkitCaseError,
  type CaseRow,
} from "@/lib/consultant-toolkit/cases";
import { POLICY_CASE_KIND, type PolicyCase } from "./contract";
import { PolicyAnalysisError } from "./errors";
import { caseSummary, newPolicyCase, nextVersion, validCase, type CreateCaseRequest, type PolicyCaseSummary } from "./service";

// Policy-change cases live in the consultant toolkit's encrypted case table
// (pac_dsd.consultant_toolkit_cases), sealed with the same key but bound to their own
// additional data, with kind "policy-change" inside the encrypted payload. Every write
// mirrors a revision row. No database change is needed.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const iso = (date: string | Date) => new Date(date).toISOString();

export function encryptPolicyCase(value: PolicyCase, key: Buffer): string {
  try { return sealCaseEnvelope(JSON.stringify(value), policyChangeCaseAad(value.id, value.version), key); }
  catch (error) {
    if (error instanceof ToolkitCaseError && error.status === 413) throw new PolicyAnalysisError("too_large");
    throw error;
  }
}

/** Decrypt a policy-change envelope. Returns null when the envelope does not authenticate as a policy case. */
export function decryptPolicyCase(envelope: string, id: string, version: number, key: Buffer, previous?: Buffer): PolicyCase | null {
  const raw = openCaseEnvelope(envelope, policyChangeCaseAad(id, version), key, previous);
  if (raw === undefined) return null;
  try {
    const decoded = JSON.parse(raw);
    if (!decoded || decoded.kind !== POLICY_CASE_KIND) throw new Error();
    const record = validCase(decoded);
    if (record.id !== id || record.version !== version) throw new Error();
    return record;
  } catch { throw new PolicyAnalysisError("storage_unavailable"); }
}

/** A stored row as a policy case; null for a toolkit row; an error for a row neither kind can read. */
export function decodePolicyRow(row: CaseRow, key: Buffer, previous?: Buffer): PolicyCase | null {
  const record = decryptPolicyCase(row.encrypted_payload, row.id, row.version, key, previous);
  if (!record) {
    if (caseRowKind(row, key, previous) === "toolkit") return null;
    throw new PolicyAnalysisError("storage_unavailable");
  }
  if (record.status !== row.status || record.createdAt !== iso(row.created_at) || record.updatedAt !== iso(row.updated_at) || record.finalizedAt !== (row.finalized_at ? iso(row.finalized_at) : null)) throw new PolicyAnalysisError("storage_unavailable");
  return record;
}

function keys() {
  try { return { key: activeCaseKey(), previous: previousCaseKey() }; }
  catch { throw new PolicyAnalysisError("storage_unavailable"); }
}
async function database() {
  try { return await ownerDatabase(); }
  catch { throw new PolicyAnalysisError("storage_unavailable"); }
}
function caseId(id: string) {
  if (!UUID.test(id)) throw new PolicyAnalysisError("not_found");
  return id;
}

export async function policyCaseSavingAvailability() {
  return toolkitCaseSavingAvailability();
}

export async function getPolicyCase(id: string): Promise<PolicyCase | null> {
  caseId(id);
  const { key, previous } = keys(), sql = await database();
  const rows = await sql<CaseRow[]>`select id, version, status, encrypted_payload, created_at, updated_at, finalized_at from pac_dsd.consultant_toolkit_cases where id=${id}::uuid`;
  return rows[0] ? decodePolicyRow(rows[0], key, previous) : null;
}

/** Policy-change cases only; toolkit cases in the shared table are skipped. Pages advance by stored rows. */
export async function listPolicyCases(offset = 0): Promise<{ cases: PolicyCaseSummary[]; nextOffset: number | null }> {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) throw new PolicyAnalysisError("invalid", "Choose a valid case-list page.");
  const { key, previous } = keys(), sql = await database();
  const rows = await sql<CaseRow[]>`select id, version, status, encrypted_payload, created_at, updated_at, finalized_at from pac_dsd.consultant_toolkit_cases order by updated_at desc, id limit 101 offset ${offset}`;
  const cases = rows.slice(0, 100).flatMap(row => {
    const value = decodePolicyRow(row, key, previous);
    return value ? [caseSummary(value)] : [];
  });
  return { cases, nextOffset: rows.length > 100 ? offset + 100 : null };
}

export async function createPolicyCase(request: CreateCaseRequest): Promise<PolicyCase> {
  const now = new Date().toISOString();
  const record = newPolicyCase(request, randomUUID(), now);
  const { key } = keys(), sql = await database();
  const encrypted = encryptPolicyCase(record, key);
  await sql.begin(async tx => {
    await tx`insert into pac_dsd.consultant_toolkit_cases(id,version,status,encrypted_payload,created_at,updated_at) values(${record.id}::uuid,1,'draft',${encrypted},${now}::timestamptz,${now}::timestamptz)`;
    await tx`insert into pac_dsd.consultant_toolkit_case_revisions(case_id,version,status,encrypted_payload,created_at) values(${record.id}::uuid,1,'draft',${encrypted},${now}::timestamptz)`;
  });
  return record;
}

/**
 * Apply a pure transition to the saved case under a row lock, with optimistic concurrency:
 * the saved version must equal expectedVersion. The result is validated, sealed, saved and
 * mirrored into the revision table.
 */
export async function mutatePolicyCase(id: string, expectedVersion: number, change: (current: PolicyCase) => PolicyCase): Promise<PolicyCase> {
  caseId(id);
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) throw new PolicyAnalysisError("invalid");
  const { key, previous } = keys(), sql = await database();
  return sql.begin(async tx => {
    const rows = await tx<CaseRow[]>`select id,version,status,encrypted_payload,created_at,updated_at,finalized_at from pac_dsd.consultant_toolkit_cases where id=${id}::uuid for update`;
    const current = rows[0] ? decodePolicyRow(rows[0], key, previous) : null;
    if (!current) throw new PolicyAnalysisError("not_found");
    if (current.version !== expectedVersion) throw new PolicyAnalysisError("conflict");
    const now = new Date().toISOString();
    const record = nextVersion(change(current), now);
    if (record.id !== current.id || record.createdAt !== current.createdAt) throw new PolicyAnalysisError("invalid");
    const encrypted = encryptPolicyCase(record, key);
    const changedRows = await tx<{ id: string }[]>`update pac_dsd.consultant_toolkit_cases set version=${record.version},status=${record.status},encrypted_payload=${encrypted},updated_at=${now}::timestamptz,finalized_at=${record.finalizedAt}::timestamptz where id=${id}::uuid and version=${expectedVersion} returning id`;
    if (changedRows.length !== 1) throw new PolicyAnalysisError("conflict");
    await tx`insert into pac_dsd.consultant_toolkit_case_revisions(case_id,version,status,encrypted_payload,created_at) values(${id}::uuid,${record.version},${record.status},${encrypted},${now}::timestamptz)`;
    return record;
  }) as Promise<PolicyCase>;
}

/** Delete only a policy-change case at the expected version; a toolkit case is never removed here. */
export async function deletePolicyCase(id: string, expectedVersion: number): Promise<void> {
  caseId(id);
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) throw new PolicyAnalysisError("invalid");
  const { key, previous } = keys(), sql = await database();
  await sql.begin(async tx => {
    const rows = await tx<CaseRow[]>`select id,version,status,encrypted_payload,created_at,updated_at,finalized_at from pac_dsd.consultant_toolkit_cases where id=${id}::uuid for update`;
    const current = rows[0] ? decodePolicyRow(rows[0], key, previous) : null;
    if (!current) throw new PolicyAnalysisError("not_found");
    if (current.version !== expectedVersion) throw new PolicyAnalysisError("conflict");
    const removed = await tx<{ id: string }[]>`delete from pac_dsd.consultant_toolkit_cases where id=${id}::uuid and version=${expectedVersion} returning id`;
    if (removed.length !== 1) throw new PolicyAnalysisError("conflict");
  });
}
