/**
 * Personal action plans and decision records: plain, typed field lists that live in the
 * person's own browser. Nothing here is sent anywhere unless the person chooses to save a
 * decision record to the team space.
 */
export type RecordField = { key: string; label: string; help: string; kind?: "text" | "long" | "date" | "choice"; choices?: string[] };
export type RecordKind = "action-plan" | "decision-record";
export type LocalRecord = { id: string; kind: RecordKind; title: string; createdAt: string; updatedAt: string; fields: Record<string, string>; teamRecordId?: string };
export type RecordBook = { version: 1; records: LocalRecord[] };

export const ACTION_PLAN_FIELDS: RecordField[] = [
  { key: "source", label: "What I learned from", help: "The lesson, practice or reading that prompted this plan." },
  { key: "insight", label: "What I want to carry forward", help: "One idea, in your own words, that you want to act on.", kind: "long" },
  { key: "commitment", label: "What I will do differently", help: "A specific behavior you can see or hear. Start with a verb: ask, offer, check, invite, write.", kind: "long" },
  { key: "situation", label: "Where and when it will happen", help: "The meeting, task or moment where you will try it. A real date helps." },
  { key: "firstStep", label: "My first small step this week", help: "Something you can do in fifteen minutes or less." },
  { key: "involve", label: "Who I will involve or tell", help: "A colleague, supervisor or the people affected. Naming a role is enough." },
  { key: "obstacle", label: "What might get in the way, and my plan for it", help: "If this happens, then I will...", kind: "long" },
  { key: "reviewDate", label: "Review date", help: "Thirty days is a good rhythm. Change it if another date fits.", kind: "date" },
  { key: "happened", label: "At review: what happened", help: "What you tried and what you noticed. Leave out client, case, health and personnel details.", kind: "long" },
  { key: "changed", label: "At review: what changed for the people affected", help: "Separate what you observed from what you hope.", kind: "long" },
  { key: "next", label: "At review: keep, adjust or stop", help: "Your next step after the review.", kind: "choice", choices: ["", "Keep doing it", "Adjust it", "Stop and try something else"] },
];

export const DECISION_RECORD_FIELDS: RecordField[] = [
  { key: "decision", label: "The decision", help: "What is being decided, by whom, and by when.", kind: "long" },
  { key: "authority", label: "Person or area responsible", help: "The role that holds authority for this decision." },
  { key: "affected", label: "Who is affected", help: "Groups of people who receive, deliver or pay for the service. Describe groups, not individuals.", kind: "long" },
  { key: "heard", label: "What we heard, and from whom", help: "Input from people affected and how it was gathered.", kind: "long" },
  { key: "evidence", label: "Evidence and gaps", help: "What the evidence shows, what is inference, and what is not yet known.", kind: "long" },
  { key: "options", label: "Options considered", help: "At least two, including keeping the current practice.", kind: "long" },
  { key: "choice", label: "What we chose and why", help: "The reasoning a reader can follow later.", kind: "long" },
  { key: "toolkit", label: "Equity Analysis Toolkit", help: "Whether the Toolkit was used and where its record is kept.", kind: "choice", choices: ["", "Used for this decision", "Not required for this decision", "Planned before final approval"] },
  { key: "followUp", label: "How people will hear what happened to their input", help: "Who closes the loop, how and when." },
  { key: "reviewDate", label: "Review date", help: "When to revisit the decision and its effects.", kind: "date" },
];

export const FIELDS_FOR: Record<RecordKind, RecordField[]> = { "action-plan": ACTION_PLAN_FIELDS, "decision-record": DECISION_RECORD_FIELDS };
export const RECORD_LABEL: Record<RecordKind, string> = { "action-plan": "Action plan", "decision-record": "Decision record" };
export const MAX_FIELD = 4000;
export const MAX_TITLE = 160;
export const MAX_RECORDS = 60;

function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }

export function validRecord(value: unknown, kind?: RecordKind): value is LocalRecord {
  if (!isRecord(value) || typeof value.id !== "string" || !value.id || typeof value.title !== "string" || value.title.length > MAX_TITLE) return false;
  if (value.kind !== "action-plan" && value.kind !== "decision-record") return false;
  if (kind && value.kind !== kind) return false;
  if (typeof value.createdAt !== "string" || typeof value.updatedAt !== "string" || !isRecord(value.fields)) return false;
  const allowed = new Set(FIELDS_FOR[value.kind].map(field => field.key));
  for (const [key, text] of Object.entries(value.fields)) if (!allowed.has(key) || typeof text !== "string" || text.length > MAX_FIELD) return false;
  return value.teamRecordId === undefined || typeof value.teamRecordId === "string";
}

export function emptyRecord(kind: RecordKind, id: string, now: Date, prefill: Record<string, string> = {}): LocalRecord {
  const fields: Record<string, string> = {};
  for (const field of FIELDS_FOR[kind]) fields[field.key] = "";
  const review = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
  fields.reviewDate = review;
  for (const [key, text] of Object.entries(prefill)) if (key in fields) fields[key] = text.slice(0, MAX_FIELD);
  const stamp = now.toISOString();
  return { id, kind, title: prefill.title?.slice(0, MAX_TITLE) || (kind === "action-plan" ? "My action plan" : "Decision record"), createdAt: stamp, updatedAt: stamp, fields };
}

export function loadBook(raw: string | null): RecordBook {
  if (!raw) return { version: 1, records: [] };
  try {
    const parsed = JSON.parse(raw);
    if (isRecord(parsed) && parsed.version === 1 && Array.isArray(parsed.records)) return { version: 1, records: parsed.records.filter(record => validRecord(record)) as LocalRecord[] };
  } catch { /* unreadable: start over without throwing away the raw value */ }
  return { version: 1, records: [] };
}

function escapeHtml(value: string): string { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

export function recordText(record: LocalRecord): string {
  const lines = [`${RECORD_LABEL[record.kind]}: ${record.title}`, `Last updated ${record.updatedAt.slice(0, 10)}`, ""];
  for (const field of FIELDS_FOR[record.kind]) lines.push(field.label, record.fields[field.key]?.trim() || "(not yet written)", "");
  lines.push("Kept by you. People, Access and Culture keeps no copy of this record.");
  return lines.join("\n");
}

/** A Word-readable document (HTML saved with a .doc name), so no conversion service is needed. */
export function recordWordDocument(record: LocalRecord): string {
  const body = FIELDS_FOR[record.kind].map(field => `<h2>${escapeHtml(field.label)}</h2><p>${escapeHtml(record.fields[field.key]?.trim() || "(not yet written)").replace(/\n/g, "<br>")}</p>`).join("");
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${escapeHtml(record.title)}</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.4}h1{font-size:18pt}h2{font-size:12pt;margin-top:14pt}</style></head><body><h1>${escapeHtml(record.title)}</h1><p>${RECORD_LABEL[record.kind]}. Last updated ${record.updatedAt.slice(0, 10)}.</p>${body}</body></html>`;
}

export function fileName(record: LocalRecord, extension: string): string {
  const base = record.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || record.kind;
  return `${base}.${extension}`;
}
