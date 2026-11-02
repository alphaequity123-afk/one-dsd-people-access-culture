import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import ClasCurriculum from './clas-curriculum';
import fixture from '@/lib/content/__fixtures__/clas-curriculum-practice.fixture.json';
import curriculum from '@/lib/content/clas-curriculum.json';
import { normalizePracticeContent, practiceModule } from '@/lib/content/clas-curriculum-practice';
import type { Walkthrough } from '@/lib/learning/clas-walkthrough';
import { groupCuesIntoSentences, parseVtt } from '@/lib/learning/vtt';

const cues = groupCuesIntoSentences(parseVtt(fs.readFileSync(path.join(process.cwd(), 'public/learning/clas-curriculum/01/captions.vtt'), 'utf8')));
const content = normalizePracticeContent(fixture);
const moduleOne = practiceModule(content, '01')!;
const walkthrough: Walkthrough = { audio: '/learning/clas-walkthrough/01.mp3', captions: '/learning/clas-walkthrough/01.vtt', transcript: '/learning/clas-walkthrough/01.txt', chapters: [{ title: 'Opening the conversation', start: 0 }, { title: 'Going deeper', start: 60 }], durationSeconds: 540 };
const walkthroughCues = [{ start: 0, end: 5, text: 'Let us talk about the first part.' }, { start: 61, end: 70, text: 'Now a deeper question.' }];

let play: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:local'), configurable: true });
  Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

describe('lesson page without practice data (older content)', () => {
  it('renders the video, transcript and chapters, and none of the practice-only sections', () => {
    const view = render(<ClasCurriculum lessonId="01" data={{ cues }} />);
    expect(view.getByRole('heading', { level: 1 }).textContent).toBe(curriculum.modules[0].title);
    expect(view.container.querySelector('.clas-study-outcome')).toBeNull();
    expect(view.queryByText(/Before you watch/)).toBeNull();
    expect(view.queryByRole('heading', { name: 'Hear it discussed' })).toBeNull();
    expect(view.queryByRole('heading', { name: 'Key points from this lesson' })).toBeNull();
    expect(view.queryByText(/More decisions to practice/)).toBeNull();
    expect(view.queryByText(/job aid/i)).toBeNull();
    const video = view.container.querySelector('video')!;
    expect(video.autoplay).toBe(false);
    expect(video.querySelector('track')?.getAttribute('src')).toBe(curriculum.modules[0].captions);
    expect(view.getByText(/Playback does not begin automatically/)).toBeTruthy();
    expect(view.container.querySelectorAll('.clas-transcript-cue')).toHaveLength(cues.length);
    const chapterNav = view.getByRole('navigation', { name: `Chapters: ${curriculum.modules[0].title}` });
    expect(within(chapterNav).getAllByRole('button')).toHaveLength(curriculum.modules[0].chapters.length);
    expect(view.getByText(curriculum.modules[0].practice.question)).toBeTruthy();
    expect(view.getByRole('link', { name: 'Download captions' })).toBeTruthy();
  });
  it('still renders when no page data is passed at all', () => {
    const view = render(<ClasCurriculum lessonId="01" />);
    expect(view.container.querySelector('video')).not.toBeNull();
    expect(view.container.querySelector('.clas-transcript')).toBeNull();
    expect(view.getByLabelText(/Your working note for this part/)).toBeTruthy();
  });
  it('highlights the sentence being spoken, marks the chapter, and seeks when a sentence is chosen', () => {
    const view = render(<ClasCurriculum lessonId="01" data={{ cues }} />);
    const video = view.container.querySelector('video')!;
    video.currentTime = cues[3].start + 0.1;
    fireEvent.timeUpdate(video);
    const active = view.container.querySelectorAll('.clas-transcript-cue > button[aria-current="true"]');
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toContain(cues[3].text);
    const chapterNav = view.getByRole('navigation', { name: `Chapters: ${curriculum.modules[0].title}` });
    expect(within(chapterNav).getByRole('button', { current: true }).textContent).toContain('Welcome to your learning');
    fireEvent.click(view.container.querySelectorAll<HTMLButtonElement>('.clas-transcript-cue > button')[10]);
    expect(video.currentTime).toBeCloseTo(cues[10].start);
    expect(play).toHaveBeenCalledTimes(1);
    fireEvent.click(within(chapterNav).getByRole('button', { name: /The principal standard/ }));
    expect(video.currentTime).toBeCloseTo(curriculum.modules[0].chapters[2].start);
  });
  it('remembers the position and the playback speed on this device', () => {
    localStorage.setItem('one-dsd-clas-curriculum-position-v1:video:01', '120');
    const view = render(<ClasCurriculum lessonId="01" data={{ cues }} />);
    const video = view.container.querySelector('video')!;
    fireEvent.loadedMetadata(video);
    expect(video.currentTime).toBe(120);
    expect(view.getByText(/Resumed at 2:00/)).toBeTruthy();
    fireEvent.change(view.getByLabelText('Speed'), { target: { value: '1.5' } });
    expect(localStorage.getItem('one-dsd-clas-curriculum-speed-v1')).toBe('1.5');
    expect(video.playbackRate).toBe(1.5);
    video.currentTime = 130;
    fireEvent.timeUpdate(video);
    expect(localStorage.getItem('one-dsd-clas-curriculum-position-v1:video:01')).toBe('130');
    fireEvent.click(view.getByRole('button', { name: 'Start from the beginning' }));
    expect(localStorage.getItem('one-dsd-clas-curriculum-position-v1:video:01')).toBeNull();
    fireEvent.ended(video);
    expect(view.queryByText(/Resumed at/)).toBeNull();
  });
});

describe('lesson page with practice data', () => {
  it('shows the outcome line, key points, card descriptions, decisions, the ordering question and the job-aid link', () => {
    const view = render(<ClasCurriculum lessonId="01" data={{ cues, practice: moduleOne, jobAidAvailable: true }} />);
    expect(view.container.querySelector('.clas-study-outcome')?.textContent).toBe(moduleOne.outcome);
    expect(view.getByRole('link', { name: /one-page job aid/ }).getAttribute('href')).toBe('/learn/clas/curriculum/01/job-aid');
    expect(view.getByRole('heading', { name: 'Key points from this lesson' })).toBeTruthy();
    expect(view.container.querySelectorAll('.clas-keypoints-inline')).toHaveLength(3);
    const chapterNav = view.getByRole('navigation', { name: `Chapters: ${curriculum.modules[0].title}` });
    const welcome = within(chapterNav).getByRole('button', { name: /Welcome to your learning/ });
    expect(document.getElementById(welcome.getAttribute('aria-describedby')!)?.textContent).toBe('A photo of an open notebook on a desk beside a cup of tea.');
    expect(view.getByText('More decisions to practice')).toBeTruthy();
    expect(view.getAllByRole('group').filter(g => g.classList.contains('clas-question'))).toHaveLength(3);
    expect(view.getByText('What would you check first?')).toBeTruthy();
    expect(view.queryByText(/Before you watch/)).toBeNull();
  });
  it('gives feedback on a checked decision and allows a retry', () => {
    const view = render(<ClasCurriculum lessonId="01" data={{ practice: moduleOne }} />);
    const decision = view.getByRole('group', { name: moduleOne.decisions[0].question });
    fireEvent.click(within(decision).getByRole('button', { name: 'Check my answer' }));
    expect(within(decision).getByText('Choose one option, then check your answer.')).toBeTruthy();
    fireEvent.click(within(decision).getByLabelText('Resend it unchanged.'));
    fireEvent.click(within(decision).getByRole('button', { name: 'Check my answer' }));
    expect(within(decision).getByText('Not the strongest choice')).toBeTruthy();
    expect(within(decision).getByText('Repeating an unclear message can repeat the barrier.')).toBeTruthy();
    fireEvent.click(within(decision).getByRole('button', { name: 'Try again' }));
    expect(within(decision).queryByText('Not the strongest choice')).toBeNull();
    fireEvent.click(within(decision).getByLabelText('Examine the notice and the response routes first.'));
    fireEvent.click(within(decision).getByRole('button', { name: 'Check my answer' }));
    expect(within(decision).getByText('That is the stronger choice')).toBeTruthy();
    expect(localStorage.length).toBe(0);
  });
  it('builds the order with numbered buttons, checks it position by position and allows a retry', () => {
    const view = render(<ClasCurriculum lessonId="01" data={{ practice: moduleOne }} />);
    const ordering = view.getByRole('group', { name: moduleOne.ordering!.prompt });
    const steps = moduleOne.ordering!.steps;
    fireEvent.click(within(ordering).getByRole('button', { name: `Step 1: ${steps[2]}` }));
    fireEvent.click(within(ordering).getByRole('button', { name: `Step 2: ${steps[1]}` }));
    fireEvent.click(within(ordering).getByRole('button', { name: `Step 3: ${steps[0]}` }));
    fireEvent.click(within(ordering).getByRole('button', { name: `Step 4: ${steps[3]}` }));
    fireEvent.click(within(ordering).getByRole('button', { name: 'Check my order' }));
    expect(within(ordering).getByText('Not yet: 2 of 4 steps are in the suggested place')).toBeTruthy();
    expect(within(ordering).getAllByText('(not in the suggested place)')).toHaveLength(2);
    expect(within(ordering).getByText(moduleOne.ordering!.feedback)).toBeTruthy();
    fireEvent.click(within(ordering).getByRole('button', { name: 'Try again' }));
    expect(within(ordering).getByText('No steps chosen yet.')).toBeTruthy();
    for (const [position, step] of moduleOne.ordering!.correctOrder.entries()) fireEvent.click(within(ordering).getByRole('button', { name: `Step ${position + 1}: ${steps[step]}` }));
    fireEvent.click(within(ordering).getByRole('button', { name: 'Check my order' }));
    expect(within(ordering).getByText('That matches the suggested order')).toBeTruthy();
    expect(ordering.querySelector('[draggable="true"]')).toBeNull();
  });
  it('asks the previous part\'s recall questions before the video on part 2, with feedback', () => {
    const view = render(<ClasCurriculum lessonId="02" data={{ recall: moduleOne.recall }} />);
    const recall = view.getByRole('region', { name: /Before you watch: a quick recall from Part 1/ });
    expect(recall.compareDocumentPosition(view.container.querySelector('video')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const first = within(recall).getByRole('group', { name: moduleOne.recall[0].question });
    fireEvent.click(within(first).getByLabelText('The person\'s experience of the service.'));
    fireEvent.click(within(first).getByRole('button', { name: 'Check my answer' }));
    expect(within(first).getByText('Yes. A notice can be accurate and still be hard to use.')).toBeTruthy();
  });
  it('never shows recall on part 1 even if questions are passed', () => {
    const view = render(<ClasCurriculum lessonId="01" data={{ recall: moduleOne.recall }} />);
    expect(view.queryByText(/Before you watch/)).toBeNull();
  });
});

describe('walkthrough audio', () => {
  it('adds "Hear it discussed" with its own synced transcript, chapters and downloads when the fields exist', () => {
    const view = render(<ClasCurriculum lessonId="01" data={{ cues, walkthrough, walkthroughCues }} />);
    expect(view.getByRole('heading', { name: 'Hear it discussed' })).toBeTruthy();
    expect(view.getByText(/Discussion: about 9 minutes/)).toBeTruthy();
    const audio = view.container.querySelector('audio')!;
    expect(audio.getAttribute('src')).toBe(walkthrough.audio);
    expect(audio.autoplay).toBe(false);
    const nav = view.getByRole('navigation', { name: /Chapters: Walkthrough discussion/ });
    expect(within(nav).getAllByRole('button')).toHaveLength(2);
    expect(view.getAllByRole('link', { name: 'Download captions' })).toHaveLength(2);
    expect(view.getByRole('link', { name: 'Download the transcript' }).getAttribute('href')).toBe(walkthrough.transcript);
    audio.currentTime = 62;
    fireEvent.timeUpdate(audio);
    expect(within(nav).getByRole('button', { current: true }).textContent).toContain('Going deeper');
    const discussion = view.getByRole('region', { name: 'Transcript of the discussion' });
    expect(within(discussion).getByRole('button', { current: true }).textContent).toContain('Now a deeper question.');
    fireEvent.play(audio);
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });
  it('fetches captions in the browser when the server could not read them', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, text: async () => 'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nFetched sentence.\n' }));
    vi.stubGlobal('fetch', fetchMock);
    const view = render(<ClasCurriculum lessonId="01" data={{ cues, walkthrough: { ...walkthrough, captions: 'https://media.example/01.vtt' } }} />);
    expect(await view.findByText('Fetched sentence.')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('https://media.example/01.vtt');
    vi.unstubAllGlobals();
  });
});

describe('working notes and the improvement plan', () => {
  it('keeps each part\'s note on this device, shows it again and can clear every note', () => {
    const view = render(<ClasCurriculum lessonId="03" />);
    fireEvent.change(view.getByLabelText(/Your working note for this part/), { target: { value: 'Our intake form.' } });
    expect(localStorage.getItem('one-dsd-clas-curriculum-note-v1:03')).toBe('Our intake form.');
    expect(view.getByText('Saved on this computer.')).toBeTruthy();
    expect(view.getByText(/anyone else who uses this computer could see it/)).toBeTruthy();
    view.unmount();
    const again = render(<ClasCurriculum lessonId="03" />);
    expect((again.getByLabelText(/Your working note for this part/) as HTMLTextAreaElement).value).toBe('Our intake form.');
    expect(again.getByText(/earlier note for this part is shown from this computer/)).toBeTruthy();
    fireEvent.click(again.getByRole('button', { name: 'Clear my notes on this device' }));
    fireEvent.click(again.getByRole('button', { name: 'Keep my notes' }));
    expect(localStorage.getItem('one-dsd-clas-curriculum-note-v1:03')).toBe('Our intake form.');
    fireEvent.click(again.getByRole('button', { name: 'Clear my notes on this device' }));
    fireEvent.click(again.getByRole('button', { name: 'Yes, clear all my notes' }));
    expect(localStorage.getItem('one-dsd-clas-curriculum-note-v1:03')).toBeNull();
    expect((again.getByLabelText(/Your working note for this part/) as HTMLTextAreaElement).value).toBe('');
  });
  it('assembles all nine notes into the plan on part 9 with the prompts as headings', () => {
    localStorage.setItem('one-dsd-clas-curriculum-note-v1:01', 'A planning notice.');
    const view = render(<ClasCurriculum lessonId="09" />);
    expect(view.queryByRole('heading', { name: 'Your improvement plan' })).toBeTruthy();
    expect(view.getByText('A planning notice.')).toBeTruthy();
    expect(view.getByText(/1 of 9 parts have a note/)).toBeTruthy();
    expect(view.getAllByText(/No note yet\./)).toHaveLength(8);
    expect(view.getByRole('heading', { name: `Part 1: ${curriculum.modules[0].title}` })).toBeTruthy();
    expect(view.getByText(curriculum.modules[0].practice.reflection, { selector: '.clas-plan-prompt' })).toBeTruthy();
    fireEvent.change(view.getByLabelText(/Your working note for this part/), { target: { value: 'Follow up in a month.' } });
    expect(view.getByText(/2 of 9 parts have a note/)).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Download my plan (.txt)' }));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(view.getByRole('button', { name: 'Print my plan' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Download the full working-notes companion' })).toBeTruthy();
  });
  it('does not show the plan before part 9', () => {
    const view = render(<ClasCurriculum lessonId="08" />);
    expect(view.queryByRole('heading', { name: 'Your improvement plan' })).toBeNull();
  });
});

describe('front page', () => {
  const items = [{ id: '01', title: curriculum.modules[0].title, walkthrough }, { id: '02', title: curriculum.modules[1].title, walkthrough: { ...walkthrough, audio: '/learning/clas-walkthrough/02.mp3', durationSeconds: 600 } }];
  it('renders without walkthrough or job-aid data', () => {
    const view = render(<ClasCurriculum />);
    expect(view.queryByRole('heading', { name: 'Listen to the full walkthrough' })).toBeNull();
    expect(view.queryByRole('link', { name: /job aid/ })).toBeNull();
    expect(view.getAllByRole('link', { name: /^Part \d/ })).toHaveLength(9);
  });
  it('plays the chapters in sequence from one player and links the job aids that exist', () => {
    const view = render(<ClasCurriculum front={{ walkthroughs: items, jobAidIds: ['01'] }} />);
    expect(view.getByRole('heading', { name: 'Listen to the full walkthrough' })).toBeTruthy();
    expect(view.getByText(/runs about 19 minutes/)).toBeTruthy();
    const audio = () => view.container.querySelector('audio')!;
    expect(audio().getAttribute('src')).toBe('/learning/clas-walkthrough/01.mp3');
    expect(audio().autoplay).toBe(false);
    expect(play).not.toHaveBeenCalled();
    const nav = view.getByRole('navigation', { name: 'Walkthrough chapters' });
    expect(within(nav).getAllByRole('button')).toHaveLength(2);
    fireEvent.ended(audio());
    expect(audio().getAttribute('src')).toBe('/learning/clas-walkthrough/02.mp3');
    expect(play).toHaveBeenCalledTimes(1);
    expect(within(nav).getByRole('button', { current: true }).textContent).toContain('Part 2');
    expect(localStorage.getItem('one-dsd-clas-curriculum-position-v1:walkthrough-full-chapter')).toBe('2');
    fireEvent.ended(audio());
    expect(view.getByText('You have reached the end of the walkthrough.')).toBeTruthy();
    expect(view.getByRole('link', { name: 'One-page job aid for Part 1' }).getAttribute('href')).toBe('/learn/clas/curriculum/01/job-aid');
    expect(view.queryByRole('link', { name: 'One-page job aid for Part 2' })).toBeNull();
  });
  it('resumes at the remembered chapter', () => {
    localStorage.setItem('one-dsd-clas-curriculum-position-v1:walkthrough-full-chapter', '2');
    const view = render(<ClasCurriculum front={{ walkthroughs: items }} />);
    expect(view.container.querySelector('audio')?.getAttribute('src')).toBe('/learning/clas-walkthrough/02.mp3');
    expect(play).not.toHaveBeenCalled();
  });
});
