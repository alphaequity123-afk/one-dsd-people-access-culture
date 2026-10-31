import type { Block, CoursePack, Lesson } from './courses/source-types';

export type CourseReadAloudPurpose = 'teachable' | 'reflection' | 'example' | 'introduction' | 'job-aid';
export type CourseReadAloudSection = { id: string; title: string; text: string; readPurpose: CourseReadAloudPurpose; shortAlternative?: true; parentId?: string };

/** Read authored learning text only: never learner input, controls or quiz feedback. */
export function narrationText(value: string): string {
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…' };
  return value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/(?:p|div|li|h[1-6]|blockquote)>|<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, entity: string) => {
      if (entity.startsWith('#')) {
        const code = entity[1]?.toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
        return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
      }
      return entities[entity.toLowerCase()] ?? whole;
    }).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}


/** A short option is exact visible prose, not an additional part of the full reading. */
export function withShortPassages(sections: CourseReadAloudSection[]): CourseReadAloudSection[] {
  const alternatives: CourseReadAloudSection[] = [];
  for (const section of sections) {
    const lines = Array.from(section.text.matchAll(/[^\n]+/g));
    lines.forEach((line, index) => {
      const paragraph = line[0];
      if (paragraph === section.title || !/[.!?]/.test(paragraph)) return;
      const words = paragraph.match(/\b[\w]+(?:[’'-][\w]+)*/g) ?? [];
      const previous = lines[index - 1];
      const hasLabel = previous && previous[0] !== section.title && !/[.!?]/.test(previous[0]) && previous[0].split(/\s+/).length <= 10;
      const text = hasLabel ? section.text.slice(previous.index ?? 0, (line.index ?? 0) + paragraph.length) : paragraph;
      const count = text.match(/\b[\w]+(?:[’'-][\w]+)*/g)?.length ?? 0;
      if (words.length < (hasLabel ? 15 : 25) || count > 90 || text === section.text) return;
      alternatives.push({ id: `${section.id}/moment-${index + 1}`, title: hasLabel ? previous[0] : paragraph.split(/[.!?]/)[0].length <= 85 ? paragraph.split(/[.!?]/)[0] : paragraph.split(/\s+/).slice(0, 10).join(' ') + '…', text, readPurpose: section.readPurpose, shortAlternative: true, parentId: section.id });
    });
  }
  return [...sections, ...alternatives];
}

function blockText(block: Block): string[] {
  switch (block.type) {
    case 'text': return [block.body];
    case 'list': return block.items;
    case 'statement': return [block.body];
    case 'quote': return [block.text, block.cite ?? ''];
    case 'leaderMove': return [block.control, block.failure, block.next];
    case 'artifact': return [block.summary, ...block.fields.map(field => `${field.label}: ${field.value}`), block.action];
    case 'flashcards': return block.cards.flatMap(card => [card.front, card.back]);
    case 'accordion': return block.items.flatMap(item => [item.title, item.body]);
    case 'tabs': return block.tabs.flatMap(tab => [tab.label, tab.body]);
    case 'timeline': return block.events.flatMap(event => [event.year, event.title, event.body]);
    // Assessments stay interactive. Narration must not reveal answers or feedback.
    case 'knowledgeCheck': case 'sorting': case 'image': case 'audio': case 'video': return [];
  }
}

export function lessonReadAloudSections(courseId: string, lesson: Lesson, objectives: readonly string[] = lesson.learning?.objectives ?? []): CourseReadAloudSection[] {
  const sections: CourseReadAloudSection[] = [];
  const prefix = `course/${encodeURIComponent(courseId)}/lesson/${encodeURIComponent(lesson.id)}`;
  const add = (id: string, title: string, parts: string[], readPurpose: CourseReadAloudPurpose = 'teachable') => {
    const text = parts.map(narrationText).filter(Boolean).join('\n\n');
    if (text) sections.push({ id: `${prefix}/${id}`, title: narrationText(title), text, readPurpose });
  };
  add('introduction', 'About this lesson', [lesson.title, lesson.summary, ...objectives], 'introduction');
  lesson.blocks.forEach((block, index) => {
    const parts = blockText(block);
    if (!parts.length) return;
    const fallback = narrationText(parts[0]).split(/[.!?\n]/)[0];
    const title = 'heading' in block && block.heading ? block.heading : block.type === 'artifact' ? block.title : fallback.length > 0 && fallback.length <= 85 ? fallback : block.type === 'statement' ? 'A moment to reflect' : lesson.title;
    const purpose: CourseReadAloudPurpose = block.type === 'statement' ? 'reflection' : block.type === 'artifact' ? 'example' : block.type === 'leaderMove' ? 'job-aid' : 'teachable';
    add(`passage-${index + 1}`, title, [title, ...parts], purpose);
  });
  if (lesson.scenario) add('situation', 'Consider the situation', [lesson.scenario.context, lesson.scenario.prompt], 'example');
  if (lesson.learning?.takeaways.length) add('carry-forward', 'Carry this forward', lesson.learning.takeaways);
  if (lesson.transfer) add('reflection', 'A moment to reflect', [lesson.transfer.prompt, ...lesson.transfer.options], 'reflection');
  return withShortPassages(sections);
}

export function courseReadAloudSections(pack: CoursePack): CourseReadAloudSection[] {
  const id = `course/${encodeURIComponent(pack.course.id)}`;
  const result: CourseReadAloudSection[] = [];
  // introTranscript can be a two-host podcast. Keep that conversation separate.
  const introduction = [pack.course.title, pack.course.subtitle, ...(pack.course.learning?.objectives ?? [])].map(narrationText).filter(Boolean).join('\n\n');
  if (introduction) result.push({ id: `${id}/welcome`, title: 'About this course', text: introduction, readPurpose: 'introduction' });
  const aid = pack.jobAid;
  const text = [aid.title, aid.subtitle, ...(aid.use ? [aid.use.purpose, ...aid.use.remember, aid.use.doNext] : []), ...aid.sections.flatMap(section => [section.heading, ...section.items])].map(narrationText).filter(Boolean).join('\n\n');
  if (text) result.push({ id: `${id}/job-aid`, title: aid.title, text, readPurpose: 'job-aid' });
  return withShortPassages(result);
}
