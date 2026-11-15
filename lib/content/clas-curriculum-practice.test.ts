import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import fixture from '@/lib/content/__fixtures__/clas-curriculum-practice.fixture.json';
import curriculum from '@/lib/content/clas-curriculum.json';
import { loadCaptionCues, loadClasFrontPageData, loadClasLessonPageData, loadPracticeContent, PRACTICE_CONTENT_PATH } from './clas-curriculum-page-data';
import { checkOrdering, EMPTY_PRACTICE, jobAidText, normalizePracticeContent, practiceModule, recallForLesson } from './clas-curriculum-practice';

const content = normalizePracticeContent(fixture);
const ids = ['01', '02', '03'];

describe('normalizePracticeContent', () => {
  it('keeps a complete module intact', () => {
    const m = practiceModule(content, '01')!;
    expect(m.outcome).toMatch(/^After this part you can/);
    expect(m.recall).toHaveLength(2);
    expect(m.recall[0].id).toBe('01-r1');
    expect(m.decisions.map(d => d.id)).toEqual(['01-d1', '01-d2']);
    expect(m.ordering?.steps).toHaveLength(4);
    expect(m.ordering?.correctOrder).toEqual([1, 2, 0, 3]);
    expect(m.keyPoints).toHaveLength(3);
    expect(m.cardDescriptions).toHaveLength(2);
    expect(m.jobAid?.sections.map(s => s.heading)).toEqual(['Before', 'During', 'After']);
  });
  it('fills every missing field of an older module with an empty value', () => {
    const m = practiceModule(content, '02')!;
    expect(m).toEqual({ id: '02', outcome: '', recall: [expect.objectContaining({ id: '02-r1' })], decisions: [], ordering: null, keyPoints: [], cardDescriptions: [], jobAid: null });
  });
  it('drops malformed items instead of failing', () => {
    const m = practiceModule(content, '03')!;
    expect(m.decisions).toEqual([]);
    expect(m.ordering).toBeNull();
    expect(m.jobAid).toBeNull();
    expect(normalizePracticeContent(null)).toBe(EMPTY_PRACTICE);
    expect(normalizePracticeContent({ modules: [{ title: 'no id' }, 7] }).modules).toEqual([]);
    expect(normalizePracticeContent({ modules: [{ id: '04', ordering: { steps: ['a', 'b'], correctOrder: [0, 0] } }] }).modules[0].ordering).toBeNull();
  });
});

describe('recallForLesson', () => {
  it('shows nothing on part 1 and the previous part\'s recall afterwards', () => {
    expect(recallForLesson(content, ids, '01')).toEqual([]);
    expect(recallForLesson(content, ids, '02').map(q => q.id)).toEqual(['01-r1', '01-r2']);
    expect(recallForLesson(content, ids, '03').map(q => q.id)).toEqual(['02-r1']);
  });
  it('is empty when the previous module has no content yet or the lesson is unknown', () => {
    expect(recallForLesson(content, ['01', '02', '03', '04'], '04')).toEqual([]);
    expect(recallForLesson(content, ids, '09')).toEqual([]);
    expect(recallForLesson(EMPTY_PRACTICE, ids, '02')).toEqual([]);
  });
});

describe('checkOrdering', () => {
  it('matches a complete, correct order', () => { expect(checkOrdering([1, 2, 0, 3], [1, 2, 0, 3])).toEqual({ complete: true, correct: true, matches: [true, true, true, true] }); });
  it('marks each position separately', () => { expect(checkOrdering([2, 1, 0, 3], [1, 2, 0, 3])).toEqual({ complete: true, correct: false, matches: [false, false, true, true] }); });
  it('is incomplete until every step is chosen', () => { expect(checkOrdering([1], [1, 2, 0, 3])).toEqual({ complete: false, correct: false, matches: [true] }); });
});

describe('jobAidText', () => {
  it('writes the aid as headed plain text', () => {
    const text = jobAidText('Start with the person and the purpose', practiceModule(content, '01')!.jobAid!);
    expect(text).toContain('Start with the person: a one-page job aid\nStart with the person and the purpose');
    expect(text).toContain('BEFORE\n- Write the notice\'s purpose in one sentence.');
    expect(text).toContain('WHO TO ASK\n- The person or area responsible for the notice.');
  });
});

describe('page data loaders', () => {
  const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'clas-empty-'));
  const fullRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'clas-full-'));
  const brokenRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'clas-broken-'));
  fs.mkdirSync(path.join(fullRoot, 'lib/content'), { recursive: true });
  fs.mkdirSync(path.join(brokenRoot, 'lib/content'), { recursive: true });
  fs.writeFileSync(path.join(fullRoot, PRACTICE_CONTENT_PATH), JSON.stringify(fixture));
  fs.writeFileSync(path.join(brokenRoot, PRACTICE_CONTENT_PATH), '{"format": "clas-curriculum-practice-v1", "modules": [');
  afterAll(() => { for (const dir of [emptyRoot, fullRoot, brokenRoot]) fs.rmSync(dir, { recursive: true, force: true }); });

  it('returns empty content when the file is missing or half written', () => {
    expect(loadPracticeContent(emptyRoot)).toBe(EMPTY_PRACTICE);
    expect(loadPracticeContent(brokenRoot)).toBe(EMPTY_PRACTICE);
    expect(loadPracticeContent(fullRoot).modules).toHaveLength(3);
  });
  it('reads sentence cues from a captions file under public and nothing for other paths', () => {
    const cues = loadCaptionCues(curriculum.modules[0].captions);
    expect(cues.length).toBeGreaterThan(10);
    expect(cues[0].text).toMatch(/^Welcome\./);
    expect(loadCaptionCues('/learning/missing.vtt')).toEqual([]);
    expect(loadCaptionCues('https://media.example/walkthrough.vtt')).toEqual([]);
    expect(loadCaptionCues('/../package.json')).toEqual([]);
    expect(loadCaptionCues(null)).toEqual([]);
  });
  it('assembles a lesson page with and without practice content', () => {
    const without = loadClasLessonPageData('02', emptyRoot);
    // The walkthrough fields come from clas-curriculum.json itself, so they may or may not be present yet.
    expect(without).toMatchObject({ cues: [], practice: null, recall: [], walkthroughCues: [], jobAidAvailable: false });
    expect(without.walkthrough === null || typeof without.walkthrough.audio === 'string').toBe(true);
    const partTwo = loadClasLessonPageData('02', fullRoot);
    expect(partTwo.practice?.id).toBe('02');
    expect(partTwo.recall.map(q => q.id)).toEqual(['01-r1', '01-r2']);
    expect(partTwo.jobAidAvailable).toBe(false);
    const partOne = loadClasLessonPageData('01', fullRoot);
    expect(partOne.recall).toEqual([]);
    expect(partOne.jobAidAvailable).toBe(true);
    expect(loadClasLessonPageData('01').cues.length).toBeGreaterThan(10);
    // Once the media agent's walkthrough captions sit under public/, the server reads them too.
    const live = loadClasLessonPageData('02');
    if (live.walkthrough?.captions?.startsWith('/')) expect(live.walkthroughCues.length).toBeGreaterThan(5);
  });
  it('accepts the published content file, when present, without dropping any module', () => {
    const file = path.join(process.cwd(), PRACTICE_CONTENT_PATH);
    if (!fs.existsSync(file)) return;
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as { modules: { id: string; keyPoints?: { chapter: string }[]; cardDescriptions?: { chapter: string }[] }[] };
    const live = loadPracticeContent();
    expect(live.modules.map(m => m.id)).toEqual(raw.modules.map(m => m.id));
    for (const m of live.modules) {
      const lesson = curriculum.modules.find(l => l.id === m.id)!;
      expect(lesson, `module ${m.id} exists in the curriculum`).toBeTruthy();
      const chapterTitles = lesson.chapters.map(c => c.title);
      for (const k of m.keyPoints) expect(chapterTitles, `key points chapter "${k.chapter}" in part ${m.id}`).toContain(k.chapter);
      for (const d of m.cardDescriptions) expect(chapterTitles, `card description chapter "${d.chapter}" in part ${m.id}`).toContain(d.chapter);
      console.log(`part ${m.id}: outcome ${m.outcome ? 'yes' : 'NO'}, recall ${m.recall.length}, decisions ${m.decisions.length}, ordering ${m.ordering ? m.ordering.steps.length + ' steps' : 'NO'}, key points ${m.keyPoints.length}/${chapterTitles.length} chapters, cards ${m.cardDescriptions.length}, job aid ${m.jobAid ? 'yes' : 'NO'}`);
    }
  });
  it('lists job aids and any walkthrough chapters for the front page', () => {
    const front = loadClasFrontPageData(fullRoot);
    expect(front.jobAidIds).toEqual(['01']);
    expect(Array.isArray(front.walkthroughs)).toBe(true);
    for (const item of front.walkthroughs) expect(item.walkthrough.audio).toMatch(/\S/);
    expect(loadClasFrontPageData(emptyRoot).jobAidIds).toEqual([]);
  });
});
