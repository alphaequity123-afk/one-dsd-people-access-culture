export const REQUIREMENT_FIELDS = [
  { id: "requirement", label: "Requirement or commitment", help: "Describe the specific requirement being examined. Keep an obligation separate from a recommendation or a proposed commitment." },
  { id: "source", label: "Governing source and version", help: "Record the document, section, reference or address, effective or review date, and who maintains it. Distinguish binding requirements, approved policy, official guidance and other resources." },
  { id: "applicability", label: "How it applies to this work", help: "Identify the policy, service, workforce practice or decision affected, the people affected, and any conflict or uncertainty about scope. A source being available does not establish that it applies." },
  { id: "evidence", label: "Work and evidence to review", help: "Connect the requirement to the draft, change, participation record, test or other evidence. Identify what that evidence supports and what remains missing. Use references to approved records instead of copying confidential details." },
  { id: "review", label: "Required review and reported outcome", help: "Name the responsible role, the question for that person and any actual review reference and date. Distinguish a requested review from a completed review and record unresolved interpretation." },
  { id: "next", label: "Next action and review trigger", help: "Identify the person or role responsible, what needs to happen next, and when a changed source, work product or decision requires another review." },
] as const;
export type RequirementField = typeof REQUIREMENT_FIELDS[number]["id"];
export const REQUIREMENT_STATUSES = ["Needs source review", "Applicability unresolved", "Evidence or review pending", "Review reported", "Does not apply—reason recorded"] as const;
export type RequirementStatus = typeof REQUIREMENT_STATUSES[number];
export type RequirementEntry = Record<RequirementField, string> & { id: string; status: RequirementStatus };
export type RequirementsCrosswalk = { format: "one-dhs-requirements-v1"; title: string; revision: string; entries: RequirementEntry[] };
export const emptyRequirement = (id: string): RequirementEntry => ({ id, status: "Needs source review", requirement: "", source: "", applicability: "", evidence: "", review: "", next: "" });
export const emptyCrosswalk = (): RequirementsCrosswalk => ({ format: "one-dhs-requirements-v1", title: "", revision: "1", entries: [emptyRequirement("R1")] });
export function requirementsSummary(work: RequirementsCrosswalk): string {
  return ["One DSD People, Access and Culture", "Requirements and review evidence", `Work: ${work.title || "Not yet named"}`, `Working revision: ${work.revision || "Not recorded"}`, "This is a working crosswalk for human review. Recorded status does not certify compliance, establish authority or replace a required review. Recheck affected entries when a source or the work changes.", ...work.entries.flatMap((entry, i) => ["", `${i + 1}. ${entry.id} — ${entry.requirement || "Requirement to identify"}`, `Status reported by the preparer: ${entry.status}`, ...REQUIREMENT_FIELDS.filter(field => field.id !== "requirement").flatMap(field => [field.label, entry[field.id] || "Not recorded"]), ...(entry.status === "Review reported" && !entry.review.trim() ? ["Review evidence is missing. This entry does not establish a completed review."] : []), ...(entry.status === "Does not apply—reason recorded" && !entry.applicability.trim() ? ["The reason for non-applicability is missing and needs review."] : [])]), "", "Use the responsible agency review channel to share the relevant working summary. Carry the references, open questions and next action with the recommendation. The application does not send or submit this file."].join("\n");
}
/** Accept only this bounded working-file shape; file text never becomes executable instructions. */
export function readRequirementsCrosswalk(raw: string): RequirementsCrosswalk {
  if (raw.length > 600_000) throw new Error("This working file is too large. Keep no more than 20 requirement entries.");
  let data: unknown;
  try { data = JSON.parse(raw); }
  catch { throw new Error("This file could not be read as a requirements working file. Your current notes are unchanged."); }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Choose a requirements working file saved from this page.");
  const item = data as Record<string, unknown>;
  const bounded = (value: unknown, length: number) => { if (typeof value !== "string" || value.length > length) throw new Error("The working file has an unsupported field. Your current notes are unchanged."); return value; };
  if (item.format !== "one-dhs-requirements-v1" || !Array.isArray(item.entries) || item.entries.length < 1 || item.entries.length > 20) throw new Error("Choose a requirements working file with 1 to 20 entries.");
  const ids = new Set<string>();
  const entries = item.entries.map((value: unknown) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("A requirement entry could not be read. Your current notes are unchanged.");
    const record = value as Record<string, unknown>;
    const id = bounded(record.id, 80);
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(id) || ids.has(id) || !REQUIREMENT_STATUSES.includes(record.status as RequirementStatus)) throw new Error("A requirement identity or status is invalid. Your current notes are unchanged.");
    ids.add(id);
    const entry = { id, status: record.status as RequirementStatus } as RequirementEntry;
    for (const field of REQUIREMENT_FIELDS) entry[field.id] = bounded(record[field.id], 4000);
    return entry;
  });
  return { format: "one-dhs-requirements-v1", title: bounded(item.title, 300), revision: bounded(item.revision, 80), entries };
}
