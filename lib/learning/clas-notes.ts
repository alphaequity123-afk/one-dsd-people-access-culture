/** Per-part working notes kept in this browser only, and the plan assembled from them on part 9. */
export const NOTE_KEY_PREFIX = 'one-dsd-clas-curriculum-note-v1:';
export const noteKey = (moduleId: string) => `${NOTE_KEY_PREFIX}${moduleId}`;

export function readNote(moduleId: string): string {
  try { return localStorage.getItem(noteKey(moduleId)) ?? ''; } catch { return ''; }
}
/** False when the browser refuses storage (private mode, quota); the note still works for this visit. */
export function writeNote(moduleId: string, text: string): boolean {
  try {
    if (text) localStorage.setItem(noteKey(moduleId), text); else localStorage.removeItem(noteKey(moduleId));
    return true;
  } catch { return false; }
}
export function readAllNotes(moduleIds: string[]): Record<string, string> {
  return Object.fromEntries(moduleIds.map(id => [id, readNote(id)]));
}
export function clearNotes(moduleIds: string[]): boolean {
  try { moduleIds.forEach(id => localStorage.removeItem(noteKey(id))); return true; } catch { return false; }
}

export type PlanModule = { id: string; title: string; practice: { reflection: string } };
export type PlanSection = { id: string; part: number; title: string; prompt: string; note: string };

/** One section per lesson, in order, with the lesson's reflection prompt as the heading. */
export function assemblePlan(modules: PlanModule[], notes: Record<string, string>): PlanSection[] {
  return modules.map((m, n) => ({ id: m.id, part: n + 1, title: m.title, prompt: m.practice.reflection, note: (notes[m.id] ?? '').trim() }));
}

export function planText(title: string, sections: PlanSection[]): string {
  const body = sections.map(s => `Part ${s.part}: ${s.title}\n${s.prompt}\n\n${s.note || '(No note yet.)'}\n`).join('\n');
  return `${title}\n\nMY IMPROVEMENT PLAN\n\nAssembled from my working notes for the nine parts. These notes are for my own use; no names, case details or other private information belong here.\n\n${body}\nFollow-up date:\nWhat changed?\nWhat evidence do I have?\nWhat remains?\n`;
}
