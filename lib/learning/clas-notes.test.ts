import { afterEach, describe, expect, it } from 'vitest';
import curriculum from '@/lib/content/clas-curriculum.json';
import { assemblePlan, clearNotes, noteKey, planText, readAllNotes, readNote, writeNote } from './clas-notes';
import { walkthroughOf } from './clas-walkthrough';
import { positionKey, readPosition, readSpeed, resumable, SPEED_KEY, writePosition, writeSpeed } from './media-storage';

afterEach(() => localStorage.clear());
const ids = curriculum.modules.map(m => m.id);

describe('working notes on this device', () => {
  it('keeps one key per part and removes the key when the note is emptied', () => {
    expect(writeNote('03', 'My example is a form.')).toBe(true);
    expect(localStorage.getItem('one-dsd-clas-curriculum-note-v1:03')).toBe('My example is a form.');
    expect(readNote('03')).toBe('My example is a form.');
    expect(readNote('04')).toBe('');
    writeNote('03', '');
    expect(localStorage.getItem(noteKey('03'))).toBeNull();
  });
  it('clears only the curriculum notes', () => {
    writeNote('01', 'a'); writeNote('09', 'b');
    localStorage.setItem('one-dsd-clas-curriculum-progress-v1', '["01"]');
    expect(clearNotes(ids)).toBe(true);
    expect(readAllNotes(ids)).toEqual(Object.fromEntries(ids.map(id => [id, ''])));
    expect(localStorage.getItem('one-dsd-clas-curriculum-progress-v1')).toBe('["01"]');
  });
});

describe('assemblePlan', () => {
  it('builds nine sections with the lesson prompts as headings, in order', () => {
    const sections = assemblePlan(curriculum.modules, { '01': ' A notice. ', '09': 'Review in a month.' });
    expect(sections).toHaveLength(9);
    expect(sections[0]).toEqual({ id: '01', part: 1, title: curriculum.modules[0].title, prompt: curriculum.modules[0].practice.reflection, note: 'A notice.' });
    expect(sections[4].note).toBe('');
    expect(sections[8].note).toBe('Review in a month.');
  });
  it('writes the plan as text with a placeholder for missing notes', () => {
    const text = planText(curriculum.title, assemblePlan(curriculum.modules, { '02': 'Plain wording.' }));
    expect(text).toContain('MY IMPROVEMENT PLAN');
    expect(text).toContain(`Part 2: ${curriculum.modules[1].title}\n${curriculum.modules[1].practice.reflection}\n\nPlain wording.`);
    expect(text).toContain(`Part 1: ${curriculum.modules[0].title}\n${curriculum.modules[0].practice.reflection}\n\n(No note yet.)`);
    expect(text).toContain('Follow-up date:');
  });
});

describe('walkthroughOf', () => {
  it('is null until the module carries walkthrough fields', () => {
    expect(walkthroughOf(curriculum.modules[0] as unknown)).toSatisfy(v => v === null || typeof (v as { audio: string }).audio === 'string');
    expect(walkthroughOf({ id: '01' })).toBeNull();
    expect(walkthroughOf({ walkthrough: { audio: '' } })).toBeNull();
    expect(walkthroughOf(null)).toBeNull();
  });
  it('normalizes the fields and drops malformed chapters', () => {
    expect(walkthroughOf({ walkthrough: { audio: '/a.mp3', captions: '/a.vtt', chapters: [{ title: 'Opening', start: '0' }, { title: 7 }, { start: 3 }], durationSeconds: '540' } }))
      .toEqual({ audio: '/a.mp3', captions: '/a.vtt', transcript: null, chapters: [{ title: 'Opening', start: 0 }], durationSeconds: 540 });
  });
});

describe('media storage', () => {
  it('remembers whole-second positions and the speed under their own keys', () => {
    writePosition('video:01', 123.7);
    expect(localStorage.getItem(positionKey('video:01'))).toBe('123');
    expect(readPosition('video:01')).toBe(123);
    expect(readPosition('video:02')).toBeNull();
    writeSpeed(1.25);
    expect(localStorage.getItem(SPEED_KEY)).toBe('1.25');
    expect(readSpeed()).toBe(1.25);
    localStorage.setItem(SPEED_KEY, '3');
    expect(readSpeed()).toBe(1);
  });
  it('resumes only from a meaningful position', () => {
    expect(resumable(null, 300)).toBeNull();
    expect(resumable(3, 300)).toBeNull();
    expect(resumable(120, 300)).toBe(120);
    expect(resumable(298, 300)).toBeNull();
    expect(resumable(120, NaN)).toBe(120);
  });
});
