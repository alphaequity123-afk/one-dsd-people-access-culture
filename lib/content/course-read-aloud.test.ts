import { describe, expect, it } from 'vitest';
import { courseReadAloudSections, lessonReadAloudSections } from './course-read-aloud';
import type { CoursePack, Lesson } from './courses/source-types';

describe('course read-aloud source boundaries', () => {
  it('includes the same objectives shown above the lesson', () => {
    const lesson = { id: 'one', title: 'A useful conversation', summary: 'Start by listening.', blocks: [] } as unknown as Lesson;
    const sections = lessonReadAloudSections('course', lesson, ['Ask a clear question.', 'Agree a next step.']);
    expect(sections[0].text).toContain('Ask a clear question.\n\nAgree a next step.');
  });
  it('keeps two-host podcast transcripts out of the solo course reading', () => {
    const pack = { course: { id: 'one', title: 'Course title', subtitle: 'A useful question', introTranscript: 'PODCAST DIALOGUE MUST STAY SEPARATE' }, jobAid: { title: 'A conversation guide', subtitle: 'Try a clear question', sections: [] } } as unknown as CoursePack;
    const sections = courseReadAloudSections(pack);
    expect(sections.map(section => section.text).join(' ')).not.toContain('PODCAST');
    expect(sections[0].readPurpose).toBe('introduction');
    expect(sections[1].readPurpose).toBe('job-aid');
  });
  it('includes authored teaching and reflection without revealing assessment answers or feedback', () => {
    const lesson: Lesson = {
      id: 'lesson-one', number: 1, title: 'A useful conversation', summary: 'Begin with a question.', minutes: 5,
      blocks: [
        { type: 'text', heading: 'Listen first', body: '<p>Ask what would help &amp; allow time.</p>' },
        { type: 'knowledgeCheck', id: 'quiz', question: 'Choose a response.', options: [{ text: 'SECRET ANSWER', correct: true }], feedbackCorrect: 'SECRET FEEDBACK', feedbackIncorrect: 'SECRET FEEDBACK' },
        { type: 'sorting', id: 'sort', categories: ['SECRET CATEGORY'], items: [{ text: 'SECRET SORT', category: 'SECRET CATEGORY' }] },
      ],
      scenario: { context: 'A team is choosing a meeting time.', prompt: 'What would you ask?', options: [{ label: 'SECRET SCENARIO CHOICE', response: 'SECRET SCENARIO FEEDBACK', recommended: true }] },
      transfer: { prompt: 'What might you try?', options: ['Reflect privately.'] },
    };
    const sections = lessonReadAloudSections('course-one', lesson);
    const text = sections.map(section => section.text).join('\n');
    expect(text).toContain('Ask what would help & allow time.');
    expect(text).toContain('A team is choosing a meeting time.');
    expect(text).toContain('Reflect privately.');
    expect(text).not.toContain('SECRET');
    expect(new Set(sections.map(section => section.id)).size).toBe(sections.length);
    expect(lessonReadAloudSections('course-one', lesson)).toEqual(sections);
  });
});


describe('short teaching alternatives', () => {
  it('keeps full sections intact and adds exact visible paragraphs with stable parent identities', () => {
    const body = 'Ask what the person needs to understand before choosing a response. A clear question gives them room to correct an assumption and explain the part of the task that matters.\n\nA useful follow-up names the next step and the person responsible. Check that the arrangement is actually available before promising it, and invite questions about anything that is still unclear.';
    const source = { id: 'short', title: 'Choosing a response', summary: 'Listen carefully.', blocks: [{ type: 'text', heading: 'A useful question', body }] } as unknown as Lesson;
    const sections = lessonReadAloudSections('sample', source);
    const full = sections.filter(section => !section.shortAlternative);
    const short = sections.filter(section => section.shortAlternative);
    expect(full).toHaveLength(2);
    expect(full[1].text).toBe('A useful question\n\n' + body);
    expect(short).toHaveLength(2);
    expect(short[0].text).toBe(body.split('\n\n')[0]);
    expect(short.every(section => section.parentId === full[1].id)).toBe(true);
    expect(lessonReadAloudSections('sample', source)).toEqual(sections);
  });
});


it('keeps a definition label with its exact visible explanation instead of narrating an unexplained fragment', () => {
  const definition = 'An ongoing willingness to examine assumptions, learn from others and attend to unequal influence in relationships.';
  const lesson = { id: 'labels', title: 'Understanding a concept', summary: 'Consider the meaning.', blocks: [{ type: 'flashcards', heading: 'Key terms', cards: [{ front: 'Cultural humility', back: '<p>' + definition + '</p>' }, { front: 'Another term', back: 'A short explanation.' }] }] } as unknown as Lesson;
  const source = lessonReadAloudSections('sample', lesson);
  const short = source.find(section => section.shortAlternative && section.title === 'Cultural humility');
  expect(short?.text).toBe('Cultural humility\n\n' + definition);
  expect(source.find(section => section.id === short?.parentId)?.text).toContain(short!.text);
});
