import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { ownerDatabase } from "@/lib/db/owner-client";
import { casePayloadSchema, toolkitCaseSchema, validateToolkitResponse, type CasePayload, type ToolkitCase } from "./schema";
import { TOOLKIT_VERSION } from "./instrument";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CASE_BYTES = 3_000_000;
type CaseStatus = ToolkitCase["status"];
type CaseRow = { id: string; version: number; status: CaseStatus; encrypted_payload: string; created_at: Date | string; updated_at: Date | string; finalized_at: Date | string | null };

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

function activeKey() { return decodeCaseKey(process.env.PAC_CONSULTANT_CASE_KEY); }
/** Temporary read-only fallback during a controlled key transition; writes always use activeKey. */
function previousKey() {
  const value = process.env.PAC_CONSULTANT_CASE_PREVIOUS_KEY;
  return value === undefined ? undefined : decodeCaseKey(value);
}
function aad(id: string, version: number) { return Buffer.from(`consultant-toolkit:pac_dsd:v1:${id}:${version}`, "utf8"); }

export function encryptToolkitCase(value: ToolkitCase, key: Buffer): string {
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  if (plaintext.length > MAX_CASE_BYTES) throw new ToolkitCaseError("invalid", 413);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad(value.id, value.version));
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(":");
}

export function decryptToolkitCase(envelope: string, id: string, version: number, key: Buffer, previous?: Buffer): ToolkitCase {
  try {
    const parts = envelope.split(":");
    if (parts.length !== 4 || parts[0] !== "v1" || envelope.length > MAX_CASE_BYTES * 1.4) throw new Error();
    const iv = Buffer.from(parts[1], "base64"), tag = Buffer.from(parts[2], "base64");
    if (iv.length !== 12 || tag.length !== 16) throw new Error();
    let raw: string | undefined;
    // Retry only failed authentication, never authenticated schema or instrument validation.
    for (const candidate of previous ? [key, previous] : [key]) {
      try {
        const cipher = createDecipheriv("aes-256-gcm", candidate, iv);
        cipher.setAAD(aad(id, version)); cipher.setAuthTag(tag);
        raw = Buffer.concat([cipher.update(Buffer.from(parts[3], "base64")), cipher.final()]).toString("utf8");
        break;
      } catch { /* The previous key can authenticate an unchanged pre-transition record. */ }
    }
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
    const sql = await ownerDatabase();
    await sql`select id from pac_dsd.consultant_toolkit_cases limit 0`;
    return { caseSavingAvailable: true, caseSavingUnavailableReason: null };
  } catch { return { caseSavingAvailable: false, caseSavingUnavailableReason: "Private case storage requires its dedicated database table and encryption key." }; }
}

export async function getToolkitCase(id: string): Promise<ToolkitCase | null> {
  idValue(id);
  const key = activeKey(), previous = previousKey(), sql = await ownerDatabase();
  const rows = await sql<CaseRow[]>`select id, version, status, encrypted_payload, created_at, updated_at, finalized_at from pac_dsd.consultant_toolkit_cases where id=${id}::uuid`;
  return rows[0] ? decodeRow(rows[0], key, previous) : null;
}

export async function listToolkitCases(offset = 0) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) throw new ToolkitCaseError("invalid");
  const key = activeKey(), previous = previousKey(), sql = await ownerDatabase();
  const rows = await sql<CaseRow[]>`select id, version, status, encrypted_payload, created_at, updated_at, finalized_at from pac_dsd.consultant_toolkit_cases order by updated_at desc, id limit 101 offset ${offset}`;
  const cases = rows.slice(0, 100).map(row => {
    const value = decodeRow(row, key, previous);
    return { id: value.id, version: value.version, instrumentVersion: value.instrumentVersion, status: value.status, title: value.title, createdAt: value.createdAt, updatedAt: value.updatedAt, finalizedAt: value.finalizedAt };
  });
  return { cases, nextOffset: rows.length > 100 ? offset + 100 : null };
}

export async function createToolkitCase(value: unknown): Promise<ToolkitCase> {
  const checked = payload(value), key = activeKey(), sql = await ownerDatabase();
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
  const checked = payload(value), key = activeKey(), previous = previousKey(), sql = await ownerDatabase();
  return sql.begin(async tx => {
    const rows = await tx<CaseRow[]>`select id,version,status,encrypted_payload,created_at,updated_at,finalized_at from pac_dsd.consultant_toolkit_cases where id=${id}::uuid for update`;
    if (!rows[0]) throw new ToolkitCaseError("not_found", 404);
    const current = decodeRow(rows[0], key, previous);
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
  const sql = await ownerDatabase();
  const rows = await sql<{ id: string }[]>`delete from pac_dsd.consultant_toolkit_cases where id=${id}::uuid and version=${expectedVersion} returning id`;
  if (!rows.length) throw new ToolkitCaseError("conflict", 409);
}
