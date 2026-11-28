/**
 * Shape of lib/content/clas-curriculum-practice.json (format clas-curriculum-practice-v1) and a
 * normalizer that accepts partial or older content: every field is optional, and anything malformed
 * is dropped rather than failing the page.
 */
export type PracticeOption = { text: string; correct: boolean; feedback: string };
export type RecallQuestion = { id: string; question: string; options: PracticeOption[] };
export type Decision = { id: string; scenario: string; question: string; options: PracticeOption[] };
export type Ordering = { id: string; scenario: string; prompt: string; steps: string[]; correctOrder: number[]; feedback: string };
export type ChapterKeyPoints = { chapter: string; points: string[] };
export type CardDescription = { chapter: string; description: string };
export type JobAidSection = { heading: string; items: string[] };
export type JobAid = { title: string; useWhen: string; sections: JobAidSection[]; remember: string[]; askWho: string[] };
export type PracticeModule = {
  id: string;
  outcome: string;
  recall: RecallQuestion[];
  decisions: Decision[];
  ordering: Ordering | null;
  keyPoints: ChapterKeyPoints[];
  cardDescriptions: CardDescription[];
  jobAid: JobAid | null;
};
export type PracticeContent = { format: string; modules: PracticeModule[] };

export const PRACTICE_FORMAT = 'clas-curriculum-practice-v1';
export const EMPTY_PRACTICE: PracticeContent = { format: PRACTICE_FORMAT, modules: [] };

type Raw = Record<string, unknown>;
const isRecord = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

function option(raw: unknown): PracticeOption | null {
  if (!isRecord(raw) || !str(raw.text)) return null;
  return { text: str(raw.text), correct: raw.correct === true, feedback: str(raw.feedback) };
}
function options(raw: unknown): PracticeOption[] {
  return Array.isArray(raw) ? raw.map(option).filter((o): o is PracticeOption => o !== null) : [];
}
function recall(raw: unknown, moduleId: string): RecallQuestion[] {
  if (!Array.isArray(raw)) return [];
  const questions: RecallQuestion[] = [];
  for (const item of raw) {
    if (!isRecord(item) || !str(item.question)) continue;
    const opts = options(item.options);
    if (opts.length >= 2 && opts.some(o => o.correct)) questions.push({ id: `${moduleId}-r${questions.length + 1}`, question: str(item.question), options: opts });
  }
  return questions;
}
function decisions(raw: unknown, moduleId: string): Decision[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item, n) => {
    if (!isRecord(item) || !str(item.question)) return [];
    const opts = options(item.options);
    if (opts.length < 2 || !opts.some(o => o.correct)) return [];
    return [{ id: str(item.id) || `${moduleId}-d${n + 1}`, scenario: str(item.scenario), question: str(item.question), options: opts }];
  });
}
function ordering(raw: unknown, moduleId: string): Ordering | null {
  if (!isRecord(raw)) return null;
  const steps = strings(raw.steps);
  const order = Array.isArray(raw.correctOrder) ? raw.correctOrder.map(Number) : [];
  const permutation = steps.length >= 2 && order.length === steps.length && order.every(n => Number.isInteger(n) && n >= 0 && n < steps.length) && new Set(order).size === steps.length;
  if (!permutation) return null;
  return { id: str(raw.id) || `${moduleId}-o1`, scenario: str(raw.scenario), prompt: str(raw.prompt) || 'Put these in the order you would do them.', steps, correctOrder: order, feedback: str(raw.feedback) };
}
function keyPoints(raw: unknown): ChapterKeyPoints[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(item => (isRecord(item) && str(item.chapter) && strings(item.points).length ? [{ chapter: str(item.chapter), points: strings(item.points) }] : []));
}
function cardDescriptions(raw: unknown): CardDescription[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(item => (isRecord(item) && str(item.chapter) && str(item.description) ? [{ chapter: str(item.chapter), description: str(item.description) }] : []));
}
function jobAid(raw: unknown): JobAid | null {
  if (!isRecord(raw) || !str(raw.title)) return null;
  const sections = Array.isArray(raw.sections) ? raw.sections.flatMap(s => (isRecord(s) && str(s.heading) && strings(s.items).length ? [{ heading: str(s.heading), items: strings(s.items) }] : [])) : [];
  return { title: str(raw.title), useWhen: str(raw.useWhen), sections, remember: strings(raw.remember), askWho: strings(raw.askWho) };
}

export function normalizePracticeModule(raw: unknown): PracticeModule | null {
  if (!isRecord(raw) || !str(raw.id)) return null;
  const id = str(raw.id);
  return { id, outcome: str(raw.outcome), recall: recall(raw.recall, id), decisions: decisions(raw.decisions, id), ordering: ordering(raw.ordering, id), keyPoints: keyPoints(raw.keyPoints), cardDescriptions: cardDescriptions(raw.cardDescriptions), jobAid: jobAid(raw.jobAid) };
}

export function normalizePracticeContent(raw: unknown): PracticeContent {
  if (!isRecord(raw) || !Array.isArray(raw.modules)) return EMPTY_PRACTICE;
  const modules = raw.modules.map(normalizePracticeModule).filter((m): m is PracticeModule => m !== null);
  return { format: str(raw.format) || PRACTICE_FORMAT, modules };
}

export function practiceModule(content: PracticeContent, id: string): PracticeModule | null {
  return content.modules.find(m => m.id === id) ?? null;
}

/** Recall questions shown at the start of `lessonId`: the previous lesson's recall. Part 1 has none. */
export function recallForLesson(content: PracticeContent, orderedIds: string[], lessonId: string): RecallQuestion[] {
  const index = orderedIds.indexOf(lessonId);
  if (index <= 0) return [];
  return practiceModule(content, orderedIds[index - 1])?.recall ?? [];
}

/** Compares a learner's chosen step order with the suggested one, position by position. */
export function checkOrdering(chosen: number[], correctOrder: number[]): { complete: boolean; correct: boolean; matches: boolean[] } {
  const matches = chosen.map((step, position) => correctOrder[position] === step);
  const complete = chosen.length === correctOrder.length;
  return { complete, correct: complete && matches.every(Boolean), matches };
}

/** Plain-text version of a job aid for the .txt download. */
export function jobAidText(lessonTitle: string, aid: JobAid): string {
  const lines = [aid.title, lessonTitle, ''];
  if (aid.useWhen) lines.push(`Use when: ${aid.useWhen}`, '');
  for (const section of aid.sections) { lines.push(section.heading.toUpperCase()); section.items.forEach(item => lines.push(`- ${item}`)); lines.push(''); }
  if (aid.remember.length) { lines.push('REMEMBER'); aid.remember.forEach(item => lines.push(`- ${item}`)); lines.push(''); }
  if (aid.askWho.length) { lines.push('WHO TO ASK'); aid.askWho.forEach(item => lines.push(`- ${item}`)); lines.push(''); }
  lines.push('When you act, follow the current procedures for your role and program.');
  return lines.join('\n');
}
