import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { equityCaseDatabase } from "@/lib/db/owner-client";
import { casePayloadSchema, toolkitCaseSchema, validateToolkitResponse, type CasePayload, type ToolkitCase } from "./schema";
import { TOOLKIT_VERSION } from "./instrument";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const MAX_CASE_BYTES = 3_000_000;
type CaseStatus = ToolkitCase["status"];
export type CaseRow = { id: string; version: number; status: CaseStatus; encrypted_payload: string; created_at: Date | string; updated_at: Date | string; finalized_at: Date | string | null };

export class ToolkitCaseError extends Error {
  constructor(public readonly code: "unavailable" | "invalid" | "not_found" | "conflict" | "transition" | "instrument_version", public readonly status = 400) {
    super({ unavailable: "Private case saving is unavailable. Your open work is unchanged.", invalid: "This case could not be read. Check its fields and try again.", not_found: "This case was not found.", conflict: "This case changed in another window. Reopen the saved version before saving again.", transition: "Review the current draft before finalizing. Reopen a final case as a draft before changing it.", instrument_version: "This saved case uses a different toolkit instrument version. Open it with a compatible toolkit or complete an instrument migration before editing." }[code]);
    this.name = "ToolkitCaseError";
  }
}

/** A separately configured, stable key; it must never be derived from the sign-in key. */
export function decodeCaseKey(value: string | undefined): Buffer {
  const text = value?.trim() ?? "";
  const key = /^[a-f0-9]{64}$/i.test(text) ? Buffer.from(text, "hex") : /^[A-Za-z0-9+/]{43}=$/.test(text) ? Buffer.from(text, "base64") : Buffer.alloc(0);
  if (key.length !== 32 || new Set(key).size < 8) throw new ToolkitCaseError("unavailable", 503);
  return key;
}

/** The key every write uses. Shared with the policy analyzer, which stores its cases in the same table. */
export function activeCaseKey() { return decodeCaseKey(process.env.PAC_CONSULTANT_CASE_KEY); }
/** Temporary read-only fallback during a controlled key transition; writes always use activeCaseKey. */
export function previousCaseKey() {
  const value = process.env.PAC_CONSULTANT_CASE_PREVIOUS_KEY;
  return value === undefined ? undefined : decodeCaseKey(value);
}
const activeKey = activeCaseKey, previousKey = previousCaseKey;

// Each kind of case sealed in the shared table binds its own additional data, so a
// policy-change envelope never authenticates as a toolkit case and the reverse.
export function toolkitCaseAad(id: string, version: number) { return Buffer.from(`consultant-toolkit:pac_dsd:v1:${id}:${version}`, "utf8"); }
export function policyChangeCaseAad(id: string, version: number) { return Buffer.from(`policy-change:pac_dsd:v1:${id}:${version}`, "utf8"); }
const aad = toolkitCaseAad;

/** Seal a JSON body as a "v1:" AES-256-GCM envelope bound to the given additional data. */
export function sealCaseEnvelope(json: string, additionalData: Buffer, key: Buffer): string {
  const plaintext = Buffer.from(json, "utf8");
  if (plaintext.length > MAX_CASE_BYTES) throw new ToolkitCaseError("invalid", 413);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(additionalData);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(":");
}

/** Open an envelope with the active key, then the previous key. Returns undefined when neither authenticates. */
export function openCaseEnvelope(envelope: string, additionalData: Buffer, key: Buffer, previous?: Buffer): string | undefined {
  const parts = envelope.split(":");
  if (parts.length !== 4 || parts[0] !== "v1" || envelope.length > MAX_CASE_BYTES * 1.4) return undefined;
  const iv = Buffer.from(parts[1], "base64"), tag = Buffer.from(parts[2], "base64");
  if (iv.length !== 12 || tag.length !== 16) return undefined;
  // Retry only failed authentication, never authenticated schema or instrument validation.
  for (const candidate of previous ? [key, previous] : [key]) {
    try {
      const cipher = createDecipheriv("aes-256-gcm", candidate, iv);
      cipher.setAAD(additionalData); cipher.setAuthTag(tag);
      return Buffer.concat([cipher.update(Buffer.from(parts[3], "base64")), cipher.final()]).toString("utf8");
    } catch { /* The previous key can authenticate an unchanged pre-transition record. */ }
  }
  return undefined;
}

/** Which kind of case a stored row holds, decided only by which additional data authenticates it. */
export function caseRowKind(row: Pick<CaseRow, "id" | "version" | "encrypted_payload">, key: Buffer, previous?: Buffer): "toolkit" | "policy-change" | "unreadable" {
  if (openCaseEnvelope(row.encrypted_payload, toolkitCaseAad(row.id, row.version), key, previous) !== undefined) return "toolkit";
  if (openCaseEnvelope(row.encrypted_payload, policyChangeCaseAad(row.id, row.version), key, previous) !== undefined) return "policy-change";
  return "unreadable";
}

export function encryptToolkitCase(value: ToolkitCase, key: Buffer): string {
  return sealCaseEnvelope(JSON.stringify(value), aad(value.id, value.version), key);
}

export function decryptToolkitCase(envelope: string, id: string, version: number, key: Buffer, previous?: Buffer): ToolkitCase {
  try {
    const raw = openCaseEnvelope(envelope, aad(id, version), key, previous);
    if (raw === undefined) throw new Error();
    const decoded = JSON.parse(raw);
    if (decoded && typeof decoded === "object" && decoded.instrumentVersion !== undefined && decoded.instrumentVersion !== TOOLKIT_VERSION) throw new ToolkitCaseError("instrument_version", 409);
    const record = toolkitCaseSchema.parse(decoded);
    if (record.id !== id || record.version !== version) throw new Error();
    return record;
  } catch (error) {
    if (error instanceof ToolkitCaseError && error.code === "instrument_version") throw error;
    throw new ToolkitCaseError("unavailable", 503);
  }
}

function payload(value: unknown): CasePayload {
  const checked = casePayloadSchema.safeParse(value);
  if (!checked.success) throw new ToolkitCaseError("invalid");
  if (checked.data.result) validateToolkitResponse(checked.data.request, checked.data.result);
  return checked.data;
}

function idValue(id: string) { if (!UUID.test(id)) throw new ToolkitCaseError("not_found", 404); return id; }
const iso = (date: string | Date) => new Date(date).toISOString();
function decodeRow(row: CaseRow, key: Buffer, previous?: Buffer): ToolkitCase {
  const record = decryptToolkitCase(row.encrypted_payload, row.id, row.version, key, previous);
  if (record.status !== row.status || record.createdAt !== iso(row.created_at) || record.updatedAt !== iso(row.updated_at) || record.finalizedAt !== (row.finalized_at ? iso(row.finalized_at) : null)) throw new ToolkitCaseError("unavailable", 503);
  return record;
}

export function nextCaseStatus(current: CaseStatus, next: CaseStatus, changed: boolean, hasResult: boolean, approveFinal: boolean): CaseStatus {
  if (next === "draft") return next;
  if (changed || !hasResult || current === "final" || (next === "final" && (current !== "review" || !approveFinal))) throw new ToolkitCaseError("transition", 409);
  if (next === "review" && current !== "draft" && current !== "review") throw new ToolkitCaseError("transition", 409);
  return next;
}

export async function toolkitCaseSavingAvailability() {
  try {
    activeKey(); previousKey();
    const sql = await equityCaseDatabase();
    await sql`select id from pac_dsd.consultant_toolkit_cases limit 0`;
    return { caseSavingAvailable: true, caseSavingUnavailableReason: null };
  } catch { return { caseSavingAvailable: false, caseSavingUnavailableReason: "Private case storage requires its dedicated database table and encryption key." }; }
}

export async function getToolkitCase(id: string): Promise<ToolkitCase | null> {
  idValue(id);
  const key = activeKey(), previous = previousKey(), sql = await equityCaseDatabase();
  const rows = await sql<CaseRow[]>`select id, version, status, encrypted_payload, created_at, updated_at, finalized_at from pac_dsd.consultant_toolkit_cases where id=${id}::uuid`;
  return rows[0] ? decodeToolkitRowOrSkip(rows[0], key, previous) : null;
}

/** Decode a toolkit row; a policy-change row in the shared table reads as absent (null). Other failures keep their errors. */
export function decodeToolkitRowOrSkip(row: CaseRow, key: Buffer, previous?: Buffer): ToolkitCase | null {
  try { return decodeRow(row, key, previous); }
  catch (error) {
    if (error instanceof ToolkitCaseError && error.code === "unavailable" && caseRowKind(row, key, previous) === "policy-change") return null;
    throw error;
  }
}

export async function listToolkitCases(offset = 0) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) throw new ToolkitCaseError("invalid");
  const key = activeKey(), previous = previousKey(), sql = await equityCaseDatabase();
  const rows = await sql<CaseRow[]>`select id, version, status, encrypted_payload, created_at, updated_at, finalized_at from pac_dsd.consultant_toolkit_cases order by updated_at desc, id limit 101 offset ${offset}`;
  const cases = rows.slice(0, 100).flatMap(row => {
    // Policy-change cases share this table; the policy analyzer lists them, not the toolkit.
    const value = decodeToolkitRowOrSkip(row, key, previous);
    return value ? [{ id: value.id, version: value.version, instrumentVersion: value.instrumentVersion, status: value.status, title: value.title, createdAt: value.createdAt, updatedAt: value.updatedAt, finalizedAt: value.finalizedAt }] : [];
  });
  return { cases, nextOffset: rows.length > 100 ? offset + 100 : null };
}

export async function createToolkitCase(value: unknown): Promise<ToolkitCase> {
  const checked = payload(value), key = activeKey(), sql = await equityCaseDatabase();
  const now = new Date().toISOString();
  const record = toolkitCaseSchema.parse({ id: randomUUID(), version: 1, status: "draft", title: checked.request.title, ...checked, createdAt: now, updatedAt: now, finalizedAt: null });
  const encrypted = encryptToolkitCase(record, key);
  await sql.begin(async tx => {
    await tx`insert into pac_dsd.consultant_toolkit_cases(id,version,status,encrypted_payload,created_at,updated_at) values(${record.id}::uuid,1,'draft',${encrypted},${now}::timestamptz,${now}::timestamptz)`;
    await tx`insert into pac_dsd.consultant_toolkit_case_revisions(case_id,version,status,encrypted_payload,created_at) values(${record.id}::uuid,1,'draft',${encrypted},${now}::timestamptz)`;
  });
  return record;
}

export async function updateToolkitCase(id: string, expectedVersion: number, value: unknown, status: CaseStatus, approveFinal = false): Promise<ToolkitCase> {
  idValue(id);
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1 || !["draft", "review", "final"].includes(status)) throw new ToolkitCaseError("invalid");
  const checked = payload(value), key = activeKey(), previous = previousKey(), sql = await equityCaseDatabase();
  return sql.begin(async tx => {
    const rows = await tx<CaseRow[]>`select id,version,status,encrypted_payload,created_at,updated_at,finalized_at from pac_dsd.consultant_toolkit_cases where id=${id}::uuid for update`;
    if (!rows[0]) throw new ToolkitCaseError("not_found", 404);
    const current = decodeToolkitRowOrSkip(rows[0], key, previous);
    if (!current) throw new ToolkitCaseError("not_found", 404);
    if (current.version !== expectedVersion) throw new ToolkitCaseError("conflict", 409);
    const changed = JSON.stringify({ request: current.request, result: current.result }) !== JSON.stringify(checked);
    const next = nextCaseStatus(current.status, status, changed, Boolean(checked.result), approveFinal);
    const now = new Date().toISOString();
    const record = toolkitCaseSchema.parse({ ...current, ...checked, title: checked.request.title, version: current.version + 1, status: next, updatedAt: now, finalizedAt: next === "final" ? now : null });
    const encrypted = encryptToolkitCase(record, key);
    const changedRows = await tx<{ id: string }[]>`update pac_dsd.consultant_toolkit_cases set version=${record.version},status=${next},encrypted_payload=${encrypted},updated_at=${now}::timestamptz,finalized_at=${record.finalizedAt}::timestamptz where id=${id}::uuid and version=${expectedVersion} returning id`;
    if (changedRows.length !== 1) throw new ToolkitCaseError("conflict", 409);
    await tx`insert into pac_dsd.consultant_toolkit_case_revisions(case_id,version,status,encrypted_payload,created_at) values(${id}::uuid,${record.version},${next},${encrypted},${now}::timestamptz)`;
    return record;
  }) as Promise<ToolkitCase>;
}

export async function deleteToolkitCase(id: string, expectedVersion: number): Promise<void> {
  idValue(id);
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) throw new ToolkitCaseError("invalid");
  const sql = await equityCaseDatabase();
  const rows = await sql<{ id: string }[]>`delete from pac_dsd.consultant_toolkit_cases where id=${id}::uuid and version=${expectedVersion} returning id`;
  if (!rows.length) throw new ToolkitCaseError("conflict", 409);
}
