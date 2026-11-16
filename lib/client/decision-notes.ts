/** Private, portable working notes. No storage, submission, or approval occurs here. */
export const decisionFields = [
  { key: "decision", label: "Decision and purpose" },
  { key: "outcome", label: "Intended result" },
  { key: "requirements", label: "Applicable requirements and sources" },
  { key: "people", label: "People affected and access needs" },
  { key: "evidence", label: "Available evidence" },
  { key: "uncertainties", label: "Uncertainties and information still needed" },
  { key: "participation", label: "Participation and perspectives" },
  { key: "alternatives", label: "Notes on comparing options" },
  { key: "proposal", label: "Proposed approach and reasons" },
  { key: "decisionOwner", label: "Responsible decision-maker or office" },
  { key: "action", label: "Next action" },
  { key: "nextActionOwner", label: "Role responsible for the next action" },
  { key: "support", label: "Time, resources, and support" },
  { key: "reviewDate", label: "Review date" },
  { key: "review", label: "What to observe at review" },
  { key: "observations", label: "What happened and what remains uncertain" },
  { key: "feedback", label: "Response to the people who contributed" },
] as const;
export const decisionChecks = [
  { key: "authority", label: "Requirements and decision responsibility" },
  { key: "participation", label: "Participation and response" },
  { key: "access", label: "Access and participant burden" },
  { key: "evidence", label: "Evidence, options, and uncertainties" },
  { key: "followThrough", label: "Actions and review" },
] as const;
export const decisionCheckStatuses = ["not-started", "reviewed", "needs-work", "not-applicable"] as const;
export type DecisionField = (typeof decisionFields)[number]["key"];
export type DecisionCheck = (typeof decisionChecks)[number]["key"];
export type DecisionCheckStatus = (typeof decisionCheckStatuses)[number];
export type DecisionOption = { id: string; title: string; benefits: string; risks: string; burden: string; evidence: string };
export type DecisionResource = { id: string; title: string; href: string };
export type DecisionNotes = {
  version: 1;
  title: string;
  task: string;
  fields: Record<DecisionField, string>;
  options: DecisionOption[];
  resources: DecisionResource[];
  checklist: Record<DecisionCheck, { status: DecisionCheckStatus; note: string }>;
};
export type DecisionSection = { heading: string; entries: { label: string; text: string }[] };

export function emptyDecisionNotes(): DecisionNotes {
  return {
    version: 1, title: "", task: "",
    fields: Object.fromEntries(decisionFields.map(field => [field.key, ""])) as DecisionNotes["fields"],
    options: [1, 2].map(number => ({ id: `option-${number}`, title: "", benefits: "", risks: "", burden: "", evidence: "" })),
    resources: [],
    checklist: Object.fromEntries(decisionChecks.map(check => [check.key, { status: "not-started", note: "" }])) as DecisionNotes["checklist"],
  };
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every(key => Object.prototype.hasOwnProperty.call(value, key));
}
function text(value: unknown, max = 20_000): value is string {
  return typeof value === "string" && value.length <= max;
}
/** Preserve native links and consultant-provided HTTPS sources without accepting executable URLs or credentials. */
function resourceHref(value: unknown): value is string {
  if (!text(value, 2000) || value.startsWith("//") || /[\\\s\u0000-\u001f\u007f]/.test(value)) return false;
  try {
    if (value.startsWith("/")) return new URL(value, "https://local.invalid").origin === "https://local.invalid";
    const authority = /^https:\/\/([^/?#]+)/i.exec(value);
    if (!authority || authority[1].includes("@") || /%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/i.test(value)) return false;
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}
export function validDecisionNotes(value: unknown): value is DecisionNotes {
  if (!record(value) || !exactKeys(value, ["version", "title", "task", "fields", "options", "resources", "checklist"])
    || value.version !== 1 || !text(value.title, 120) || !text(value.task, 120)
    || !record(value.fields) || !exactKeys(value.fields, decisionFields.map(field => field.key))
    || !decisionFields.every(field => text((value.fields as Record<string, unknown>)[field.key]))
    || !Array.isArray(value.options) || value.options.length < 2 || value.options.length > 8
    || !Array.isArray(value.resources) || value.resources.length > 50
    || !record(value.checklist) || !exactKeys(value.checklist, decisionChecks.map(check => check.key))) return false;
  if (!value.options.every(option => record(option)
    && exactKeys(option, ["id", "title", "benefits", "risks", "burden", "evidence"])
    && text(option.id, 120) && option.id.length > 0 && text(option.title, 500)
    && [option.benefits, option.risks, option.burden, option.evidence].every(entry => text(entry)))) return false;
  if (new Set(value.options.map(option => option.id)).size !== value.options.length) return false;
  if (!value.resources.every(resource => record(resource) && exactKeys(resource, ["id", "title", "href"])
    && text(resource.id, 200) && resource.id.length > 0 && text(resource.title, 500) && resourceHref(resource.href))) return false;
  if (new Set(value.resources.map(resource => resource.id)).size !== value.resources.length) return false;
  return decisionChecks.every(check => {
    const entry = (value.checklist as Record<string, unknown>)[check.key];
    return record(entry) && exactKeys(entry, ["status", "note"]) && text(entry.note)
      && decisionCheckStatuses.includes(entry.status as DecisionCheckStatus);
  });
}

/** The same complete content feeds text, editable Word, print/PDF, and the saved-plan summary. */
export function decisionNotesSections(notes: DecisionNotes): DecisionSection[] {
  const taskLabels = new Map<string, string>([
    ["notice", "A notice, form, or message"],
    ["policy", "A policy or legislative question"],
    ["service", "A service, process, or handoff"],
    ["workforce", "Hiring, onboarding, or team practice"],
    ["participation", "Participation and community feedback"],
    ["contracts", "A contract or purchase"],
  ]);
  const taskLabel = taskLabels.get(notes.task) ?? (notes.task.trim() ? notes.task : "Not yet selected.");
  const entries = (keys: DecisionField[]) => keys.map(key => ({ label: decisionFields.find(field => field.key === key)!.label, text: notes.fields[key] || "Not yet recorded." }));
  const statuses: Record<DecisionCheckStatus, string> = { "not-started": "Not yet reviewed", reviewed: "Reviewed", "needs-work": "Needs more work", "not-applicable": "Not applicable" };
  return [
    { heading: "Decision and intended result", entries: [{ label: "Type of work", text: taskLabel }, ...entries(["decision", "outcome", "requirements", "people"])] },
    { heading: "Evidence and participation", entries: entries(["evidence", "uncertainties", "participation"]) },
    { heading: "Compare possible approaches", entries: entries(["alternatives"]) },
    ...notes.options.map((option, index) => ({ heading: `Option ${index + 1}: ${option.title || "Not yet named"}`, entries: [
      { label: "Potential benefits", text: option.benefits || "Not yet recorded." },
      { label: "Risks and tradeoffs", text: option.risks || "Not yet recorded." },
      { label: "Access needs and participant burden", text: option.burden || "Not yet recorded." },
      { label: "Evidence or information still needed", text: option.evidence || "Not yet recorded." },
    ] })),
    { heading: "Recommendation and responsibilities", entries: entries(["proposal", "decisionOwner", "action", "nextActionOwner", "support"]) },
    { heading: "Review and response", entries: entries(["reviewDate", "review", "observations", "feedback"]) },
    { heading: "Resources connected to this analysis", entries: notes.resources.length ? notes.resources.map(resource => ({ label: resource.title, text: resource.href })) : [{ label: "Resources", text: "None selected." }] },
    { heading: "Review notes — these do not establish approval", entries: decisionChecks.map(check => ({ label: check.label, text: `${statuses[notes.checklist[check.key].status]}\n${notes.checklist[check.key].note || "No note recorded."}` })) },
  ];
}
export function decisionNotesText(notes: DecisionNotes, scope: "dsd" | "dhs" = "dsd"): string {
  return [`One ${scope.toUpperCase()} People, Access and Culture`, notes.title || "Untitled analysis",
    "Working draft. This is not a completed official equity analysis.",
    ...decisionNotesSections(notes).flatMap(section => [section.heading, ...section.entries.map(entry => `${entry.label}\n${entry.text}`)]),
  ].join("\n\n") + "\n";
}
