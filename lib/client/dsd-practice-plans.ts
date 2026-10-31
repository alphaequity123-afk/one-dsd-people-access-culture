import { decisionNotesSections, decisionNotesText, emptyDecisionNotes, validDecisionNotes, type DecisionNotes, type DecisionSection } from "./decision-notes";

export const PRACTICE_PLANS_KEY = "one-dsd-practice-plans-v1";

export const planFields = [
  { key: "decision", label: "Decision and purpose", help: "Describe the decision, process, or practice and what you hope to improve." },
  { key: "people", label: "People affected and access needs", help: "Whose experience should shape the decision? Consider ways to participate and barriers to access." },
  { key: "evidence", label: "Available evidence and open questions", help: "Separate what you know from assumptions, reported experiences, and information you still need." },
  { key: "alternatives", label: "Options to compare", help: "Consider more than one approach, including the effects of keeping the current practice." },
  { key: "action", label: "Next action and responsible role", help: "Name a feasible step and the role with responsibility or authority to take it." },
  { key: "support", label: "Time, resources, and support", help: "Identify capacity, information, accessibility support, or consultation needed to proceed." },
  { key: "reviewDate", label: "Review date", help: "Choose a date to revisit the work. You can change it as the plan develops." },
  { key: "review", label: "What to observe at review", help: "Describe what would show whether the change helps, whose feedback matters, and reasons to revise it." },
] as const;
export type PlanField = (typeof planFields)[number]["key"];
export type PracticePlan = { id: string; title: string; createdAt: string; updatedAt: string; fields: Record<PlanField, string>; analysis?: DecisionNotes };
export type PracticePlans = { version: 1; activeId: string | null; plans: PracticePlan[] };
export type PlanStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type PlanStorageAccess = () => PlanStorage;
export type LoadedPlans = { ok: true; data: PracticePlans; raw: string | null } | { ok: false; reason: "invalid" | "unavailable" };
export type SavedPlans = { ok: true; raw: string | null } | { ok: false; reason: "invalid" | "unreadable" | "conflict" | "unavailable" };

export function emptyPlans(): PracticePlans { return { version: 1, activeId: null, plans: [] }; }
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function validPlan(value: unknown): value is PracticePlan {
  return record(value) && typeof value.id === "string" && value.id.length > 0 && typeof value.title === "string"
    && typeof value.createdAt === "string" && typeof value.updatedAt === "string" && record(value.fields)
    && planFields.every(field => typeof (value.fields as Record<string, unknown>)[field.key] === "string")
    && (value.analysis === undefined || (validDecisionNotes(value.analysis)
      && value.title === value.analysis.title
      && planFields.every(field => (value.fields as Record<string, unknown>)[field.key] === (value.analysis as DecisionNotes).fields[field.key])));
}
export function validPlans(value: unknown): value is PracticePlans {
  if (!record(value) || value.version !== 1 || !Array.isArray(value.plans) || !value.plans.every(validPlan)) return false;
  const ids = value.plans.map(plan => plan.id);
  return new Set(ids).size === ids.length && (ids.length === 0 ? value.activeId === null : typeof value.activeId === "string" && ids.includes(value.activeId));
}
export function loadPlans(access: PlanStorageAccess): LoadedPlans {
  let raw: string | null;
  try { raw = access().getItem(PRACTICE_PLANS_KEY); } catch { return { ok: false, reason: "unavailable" }; }
  if (raw === null) return { ok: true, data: emptyPlans(), raw };
  try {
    const data: unknown = JSON.parse(raw);
    return validPlans(data) ? { ok: true, data, raw } : { ok: false, reason: "invalid" };
  } catch { return { ok: false, reason: "invalid" }; }
}
/** A failed read or a newer saved collection must never be silently replaced. */
export function savePlans(access: PlanStorageAccess, data: PracticePlans, expectedRaw: string | null | undefined): SavedPlans {
  if (expectedRaw === undefined) return { ok: false, reason: "unreadable" };
  if (!validPlans(data)) return { ok: false, reason: "invalid" };
  try {
    const storage = access();
    if (storage.getItem(PRACTICE_PLANS_KEY) !== expectedRaw) return { ok: false, reason: "conflict" };
    const raw = data.plans.length ? JSON.stringify(data) : null;
    if (raw === null) storage.removeItem(PRACTICE_PLANS_KEY);
    else storage.setItem(PRACTICE_PLANS_KEY, raw);
    return { ok: true, raw };
  } catch { return { ok: false, reason: "unavailable" }; }
}
export function planId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
function unusedPlanId(plans: readonly PracticePlan[], candidate: string): string {
  const ids = new Set(plans.map(plan => plan.id));
  let id = candidate;
  for (let suffix = 1; ids.has(id); suffix += 1) id = `${candidate}-${suffix}`;
  return id;
}
export function newPlan(title: string): PracticePlan {
  const now = new Date().toISOString();
  return { id: planId(), title, createdAt: now, updatedAt: now, fields: Object.fromEntries(planFields.map(field => [field.key, ""])) as PracticePlan["fields"] };
}
/** Explicit recovery keeps newer saved versions and copies conflicting local changes. */
export function keepPlanCopies(saved: PracticePlans, local: PracticePlans): PracticePlans {
  const plans = [...saved.plans];
  let activeId = local.activeId ?? saved.activeId;
  for (const plan of local.plans) {
    const existing = plans.find(item => item.id === plan.id);
    if (!existing) plans.push(plan);
    else if (JSON.stringify(existing) !== JSON.stringify(plan)) {
      const title = `${(plan.title.trim() || "Untitled plan").slice(0, 104)} — separate copy`;
      const copy = { ...plan, id: unusedPlanId(plans, planId()), title, ...(plan.analysis ? { analysis: { ...plan.analysis, title } } : {}) };
      plans.push(copy);
      if (activeId === plan.id) activeId = copy.id;
    }
  }
  return { version: 1, activeId, plans };
}
export function practicePlanSections(plan: PracticePlan): DecisionSection[] {
  return plan.analysis ? decisionNotesSections(plan.analysis) : [{ heading: "Your next step", entries: planFields.map(field => ({ label: field.label, text: plan.fields[field.key] || "Not yet recorded." })) }];
}
export function planText(plan: PracticePlan, scope: "dsd" | "dhs" = "dsd"): string {
  if (plan.analysis) return decisionNotesText(plan.analysis, scope);
  return [`One ${scope.toUpperCase()} People, Access and Culture`, plan.title.trim() || "Untitled plan",
    "Private working draft. This is not submitted, approved, or a completed official equity analysis.",
    ...planFields.map(field => `${field.label}\n${plan.fields[field.key] || "Not yet recorded."}`),
  ].join("\n\n") + "\n";
}

export type LoadedDecisionNotes = { ok: true; notes: DecisionNotes; planId: string | null; raw: string | null }
  | { ok: false; reason: "invalid" | "unavailable" | "not-found" };
export type SavedDecisionNotes = { ok: true; planId: string; raw: string }
  | { ok: false; reason: "invalid" | "unreadable" | "conflict" | "unavailable" | "not-found" };

/** Reading a new or existing draft never saves it or changes the current plan selection. */
export function loadDecisionNotes(access: PlanStorageAccess, id?: string | null): LoadedDecisionNotes {
  const loaded = loadPlans(access);
  if (!loaded.ok) return loaded;
  if (!id) return { ok: true, notes: emptyDecisionNotes(), planId: null, raw: loaded.raw };
  const plan = loaded.data.plans.find(candidate => candidate.id === id);
  if (!plan) return { ok: false, reason: "not-found" };
  const notes = plan.analysis ? JSON.parse(JSON.stringify(plan.analysis)) as DecisionNotes
    : { ...emptyDecisionNotes(), title: plan.title, fields: { ...emptyDecisionNotes().fields, ...plan.fields } };
  return { ok: true, notes, planId: plan.id, raw: loaded.raw };
}

/** Call only after an explicit save. The storage snapshot protects all plans, including other tabs. */
export function saveDecisionNotes(access: PlanStorageAccess, notes: DecisionNotes, expectedRaw: string | null | undefined, id?: string | null): SavedDecisionNotes {
  if (expectedRaw === undefined) return { ok: false, reason: "unreadable" };
  if (!validDecisionNotes(notes)) return { ok: false, reason: "invalid" };
  const loaded = loadPlans(access);
  if (!loaded.ok) return { ok: false, reason: loaded.reason === "invalid" ? "unreadable" : "unavailable" };
  if (loaded.raw !== expectedRaw) return { ok: false, reason: "conflict" };
  const existing = id ? loaded.data.plans.find(plan => plan.id === id) : undefined;
  if (id && !existing) return { ok: false, reason: "not-found" };
  const analysis = JSON.parse(JSON.stringify(notes)) as DecisionNotes;
  const plan: PracticePlan = {
    ...(existing ?? newPlan(analysis.title)), title: analysis.title, updatedAt: new Date().toISOString(),
    fields: Object.fromEntries(planFields.map(field => [field.key, analysis.fields[field.key]])) as PracticePlan["fields"], analysis,
  };
  if (!existing) plan.id = unusedPlanId(loaded.data.plans, plan.id);
  const data: PracticePlans = { version: 1, activeId: plan.id,
    plans: existing ? loaded.data.plans.map(candidate => candidate.id === plan.id ? plan : candidate) : [...loaded.data.plans, plan] };
  const saved = savePlans(access, data, expectedRaw);
  return saved.ok && saved.raw !== null ? { ok: true, planId: plan.id, raw: saved.raw } : saved.ok ? { ok: false, reason: "unavailable" } : saved;
}
