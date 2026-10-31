import React from 'react';
import { webcrypto, createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { GeffenLessonReadAloud } from './geffen-course-read-aloud';
import { lessonReadAloudSections } from '@/lib/content/course-read-aloud';
import type { Lesson } from '@/lib/content/courses/source-types';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const lesson: Lesson = { id: 'one', number: 1, title: 'Welcome', summary: 'Take a moment to consider the question.', minutes: 3, blocks: [] };
function setup(voice: string, verified: boolean, textHash?: string) {
  vi.stubGlobal('crypto', webcrypto);
  const section = lessonReadAloudSections('sample', lesson)[0];
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ format: 'geffen-course-read-aloud-v1', recordings: [{ id: section.id, voice, verified, sourceTextHash: textHash ?? createHash('sha256').update(section.text).digest('hex'), audioSha256: 'a'.repeat(64), src: '/audio/geffen-read-aloud/sample.mp3' }] }) })));
}
describe('verified Geffen read-aloud availability', () => {
  it('offers only a passage when some teaching sections have not been recorded', async () => {
    setup('geffen', true);
    const view = render(<GeffenLessonReadAloud courseId="sample" lesson={{ ...lesson, blocks: [{ type: 'text', heading: 'A further explanation', body: 'Consider another perspective.' }] }} />);
    await waitFor(() => expect(view.container.querySelector('audio')).not.toBeNull());
    expect(view.getByRole('heading', { name: 'Listen to a passage' })).toBeTruthy();
    expect(view.queryByRole('button', { name: 'Listen through the lesson' })).toBeNull();
  });
  it('advances a complete lesson only after the learner explicitly starts continuous listening', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const completeLesson: Lesson = { ...lesson, blocks: [{ type: 'text', heading: 'A further explanation', body: 'Consider another perspective.' }] };
    const sections = lessonReadAloudSections('sample', completeLesson);
    const clips = sections.map((section, index) => ({ id: section.id, voice: 'geffen', verified: true, sourceTextHash: createHash('sha256').update(section.text).digest('hex'), audioSha256: 'a'.repeat(64), src: `/audio/geffen-read-aloud/part-${index}.mp3` }));
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ format: 'geffen-course-read-aloud-v1', recordings: clips }) })));
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const view = render(<GeffenLessonReadAloud courseId="sample" lesson={completeLesson} />);
    const start = await view.findByRole('button', { name: 'Listen through the lesson' });
    expect(play).not.toHaveBeenCalled();
    fireEvent.ended(view.container.querySelector('audio')!);
    expect(view.container.querySelector('audio')?.getAttribute('src')).toBe(clips[0].src);
    fireEvent.click(start);
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    fireEvent.ended(view.container.querySelector('audio')!);
    await waitFor(() => expect(view.container.querySelector('audio')?.getAttribute('src')).toBe(clips[1].src));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
  });
  it('shows a matching verified recording, but hides it immediately when the lesson text changes', async () => {
    setup('geffen', true);
    const view = render(<GeffenLessonReadAloud courseId="sample" lesson={lesson} />);
    await waitFor(() => expect(view.container.querySelector('audio')?.getAttribute('src')).toBe('/audio/geffen-read-aloud/sample.mp3'), { timeout: 15000 });
    expect(fetch).toHaveBeenCalledWith('/learning/geffen-read-aloud/courses/sample.json');
    expect(view.container.querySelector('audio')?.autoplay).toBe(false);
    view.rerender(<GeffenLessonReadAloud courseId="sample" lesson={{ ...lesson, summary: 'An updated learning passage.' }} />);
    expect(view.container.querySelector('audio')).toBeNull();
  }, 20000);
  it.each([['another-voice', true, undefined], ['geffen', false, undefined], ['geffen', true, 'b'.repeat(64)]])('does not offer an alternate, unverified or stale recording', async (voice, verified, textHash) => {
    setup(String(voice), Boolean(verified), textHash as string | undefined);
    const view = render(<GeffenLessonReadAloud courseId="sample" lesson={lesson} />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(view.container.querySelector('audio')).toBeNull();
  });
});


describe('short alternatives and full reading remain separate', () => {
  const paragraph = 'Ask what the person needs to understand before choosing a response. A clear question gives them room to correct an assumption and explain the part of the task that matters.';
  const source: Lesson = { ...lesson, blocks: [{ type: 'text', heading: 'A useful question', body: paragraph + '\n\nReturn with the agreed next step.' }] };
  const sections = lessonReadAloudSections('sample', source);
  const clip = (section: typeof sections[number], index: number) => ({ id: section.id, voice: 'geffen', verified: true, sourceTextHash: createHash('sha256').update(section.text).digest('hex'), ...(section.parentId ? { parentSourceTextHash: createHash('sha256').update(sections.find(item => item.id === section.parentId)!.text).digest('hex') } : {}), audioSha256: 'a'.repeat(64), src: `/audio/geffen-read-aloud/short-${index}.mp3` });
  function recordings(records: ReturnType<typeof clip>[]) {
    vi.stubGlobal('crypto', webcrypto);
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ format: 'geffen-course-read-aloud-v1', recordings: records }) })));
  }
  it('offers a verified short paragraph without claiming a complete lesson', async () => {
    recordings(sections.filter(section => section.shortAlternative).map(clip));
    const view = render(<GeffenLessonReadAloud courseId="sample" lesson={source} />);
    await view.findByRole('heading', { name: 'Listen to a passage' });
    expect(view.queryByRole('button', { name: 'Listen through the lesson' })).toBeNull();
    expect(view.container.querySelector('audio')?.autoplay).toBe(false);
    view.rerender(<GeffenLessonReadAloud courseId="sample" lesson={{ ...source, blocks: [{ type: 'text', heading: 'A useful question', body: paragraph + '\n\nThe surrounding explanation has changed.' }] }} />);
    expect(view.container.querySelector('audio')).toBeNull();
  });
  it('requires the whole parent hash for a short paragraph', async () => {
    const records = sections.filter(section => section.shortAlternative).map(clip).map(record => ({ ...record, parentSourceTextHash: '0'.repeat(64) }));
    recordings(records);
    const view = render(<GeffenLessonReadAloud courseId="sample" lesson={source} />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(view.container.querySelector('audio')).toBeNull();
  });
  it('does not require short alternatives for full readiness and never repeats them in the playlist', async () => {
    const full = sections.filter(section => !section.shortAlternative);
    recordings(sections.map(clip));
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const view = render(<GeffenLessonReadAloud courseId="sample" lesson={source} />);
    fireEvent.click(await view.findByRole('button', { name: 'Listen through the lesson' }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    fireEvent.ended(view.container.querySelector('audio')!);
    await waitFor(() => expect(view.container.querySelector('audio')?.getAttribute('src')).toBe(clip(full[1],1).src));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
    fireEvent.ended(view.container.querySelector('audio')!);
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(play).toHaveBeenCalledTimes(2);
    cleanup(); recordings(full.map(clip));
    const again = render(<GeffenLessonReadAloud courseId="sample" lesson={source} />);
    expect(await again.findByRole('button', { name: 'Listen through the lesson' })).toBeTruthy();
  });
});
