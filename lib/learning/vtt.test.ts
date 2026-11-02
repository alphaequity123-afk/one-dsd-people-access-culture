import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import curriculum from '@/lib/content/clas-curriculum.json';
import { activeIndex, chapterBoundaries, formatTime, groupCuesIntoSentences, parseTimestamp, parseVtt, type Cue } from './vtt';

const lessonOne = fs.readFileSync(path.join(process.cwd(), 'public/learning/clas-curriculum/01/captions.vtt'), 'utf8');

describe('parseTimestamp', () => {
  it('reads hours, minutes and bare seconds', () => {
    expect(parseTimestamp('00:00:03.656')).toBeCloseTo(3.656);
    expect(parseTimestamp('01:02.5')).toBeCloseTo(62.5);
    expect(parseTimestamp('01:00:00.000')).toBe(3600);
    expect(parseTimestamp('62')).toBe(62);
  });
  it('rejects text that is not a timestamp', () => {
    expect(parseTimestamp('abc')).toBeNaN();
    expect(parseTimestamp('1:2:3:4')).toBeNaN();
  });
});

describe('parseVtt', () => {
  it('reads every cue of the lesson 01 captions file in order', () => {
    const cues = parseVtt(lessonOne);
    expect(cues).toHaveLength(109);
    expect(cues[0]).toEqual({ start: 0.278, end: 3.656, text: 'Welcome. This learning is about making the work you' });
    expect(cues.every((cue, n) => n === 0 || cue.start >= cues[n - 1].start)).toBe(true);
  });
  it('ignores identifiers, notes, cue settings and voice tags, and accepts CRLF', () => {
    const cues = parseVtt('WEBVTT\r\n\r\nNOTE a comment\r\n\r\n7\r\n00:00:01.000 --> 00:00:02.000 line:0 align:start\r\n<v Geffen>Hello <b>there</b>.\r\nSecond line\r\n\r\nbad --> cue\r\ntext\r\n');
    expect(cues).toEqual([{ start: 1, end: 2, text: 'Hello there. Second line' }]);
  });
});

describe('groupCuesIntoSentences', () => {
  const cues: Cue[] = [
    { start: 0, end: 1, text: 'Welcome. This learning is about' },
    { start: 1, end: 2, text: 'the work you do.' },
    { start: 2, end: 3, text: 'Ask?' },
    { start: 3, end: 4, text: 'An unfinished' },
  ];
  it('joins fragments until a sentence ends and keeps the span of the group', () => {
    expect(groupCuesIntoSentences(cues)).toEqual([
      { start: 0, end: 2, text: 'Welcome. This learning is about the work you do.' },
      { start: 2, end: 3, text: 'Ask?' },
      { start: 3, end: 4, text: 'An unfinished' },
    ]);
  });
  it('produces far fewer, longer units for a real lesson', () => {
    const sentences = groupCuesIntoSentences(parseVtt(lessonOne));
    expect(sentences.length).toBeGreaterThan(10);
    expect(sentences.length).toBeLessThan(109);
    expect(sentences.at(-1)?.end).toBeCloseTo(parseVtt(lessonOne).at(-1)!.end);
  });
});

describe('activeIndex', () => {
  const items = [{ start: 1, end: 2 }, { start: 3, end: 4 }, { start: 5, end: 6 }];
  it('is -1 before the first item', () => { expect(activeIndex(items, 0.5)).toBe(-1); });
  it('finds the item whose range contains the time', () => { expect(activeIndex(items, 3.5)).toBe(1); });
  it('keeps the previous item during a gap and the last item after the end', () => {
    expect(activeIndex(items, 2.5)).toBe(0);
    expect(activeIndex(items, 99)).toBe(2);
  });
  it('works for chapters that have only a start', () => {
    expect(activeIndex(curriculum.modules[0].chapters, 70)).toBe(1);
    expect(activeIndex(curriculum.modules[0].chapters, 0)).toBe(-1);
  });
});

describe('chapterBoundaries', () => {
  it('maps each chapter of lesson 01 to the first sentence at or after its start', () => {
    const sentences = groupCuesIntoSentences(parseVtt(lessonOne));
    const map = chapterBoundaries(sentences, curriculum.modules[0].chapters);
    expect(map.size).toBe(curriculum.modules[0].chapters.length);
    expect(map.get(0)).toBe(0);
    for (const [cue, chapter] of map) expect(sentences[cue].start).toBeGreaterThanOrEqual(curriculum.modules[0].chapters[chapter].start - 0.05);
  });
});

describe('formatTime', () => {
  it('formats minutes and hours', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(68.9)).toBe('1:08');
    expect(formatTime(3725)).toBe('1:02:05');
    expect(formatTime(NaN)).toBe('0:00');
  });
});
