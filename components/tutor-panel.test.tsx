import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import TutorPanel, { GUIDANCE_COPY } from './tutor-panel';
import { passageGrade } from '@/lib/content/readability';
import { tutorItem, type TutorItem } from '@/lib/tutor/items';
import { normalizeRecord } from '@/lib/tutor/student-model';

/** Owner rule: never "AI" or "tutor" where a learner or leader can see it. */
export const BANNED_VISIBLE = /\bAI\b|\bA\.I\.\b|artificial intelligence|\btutor/i;

const item = tutorItem('01', '01')!;
const wrong = item.options.findIndex((_, n) => n !== item.correctIndex);
const right = item.correctIndex;
const REPLY = { restatement: 'You chose to send the notice again, which repeats the same message.', guidance: 'What would tell you whether the first notice was understood?', nextStep: 'Re-read the working example, then try again.' };
const grounding = [{ title: 'Job aid: Start with the person and the purpose', href: '/learn/clas/curriculum/01/job-aid' }];

let fetchMock: ReturnType<typeof vi.fn>;
function mockFetch(body: unknown, ok = true) {
  fetchMock = vi.fn(async () => ({ ok, json: async () => body }));
  vi.stubGlobal('fetch', fetchMock);
}
const sentBody = (call = 0) => JSON.parse(fetchMock.mock.calls[call][1].body as string) as Record<string, unknown>;
const flatStrings = (value: unknown): string[] => typeof value === 'string' ? [value] : typeof value === 'object' && value ? Object.values(value).flatMap(flatStrings) : [];

beforeEach(() => { localStorage.clear(); mockFetch({ correct: false, feedback: item.options[wrong].feedback, tutor: `${REPLY.restatement}\n\n${REPLY.guidance}\n\n${REPLY.nextStep}`, parts: REPLY, strategy: 'socratic-hint', grounding }); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });

describe('guided practice panel', () => {
  it('renders the question and an accessible radio group; asks for a choice before checking', () => {
    const view = render(<TutorPanel lessonId="01" />);
    expect(view.getByText(item.question)).toBeTruthy();
    const radios = view.getAllByRole('radio');
    expect(radios).toHaveLength(item.options.length);
    for (const option of item.options) expect(view.getByLabelText(option.text)).toBeTruthy();
    expect(view.getByRole('heading', { name: GUIDANCE_COPY.heading })).toBeTruthy();
    expect(view.getByText(GUIDANCE_COPY.before)).toBeTruthy();
    expect(view.queryByRole('button', { name: GUIDANCE_COPY.getGuidance })).toBeNull();
    fireEvent.click(view.getByRole('button', { name: GUIDANCE_COPY.check }));
    expect(view.getByText(GUIDANCE_COPY.needsChoice)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('wrong answer: deterministic feedback at once, then guidance from the server with the rule-chosen strategy, one follow-up, grounding links, and a retry', async () => {
    const view = render(<TutorPanel lessonId="01" />);
    fireEvent.click(view.getByLabelText(item.options[wrong].text));
    fireEvent.click(view.getByRole('button', { name: GUIDANCE_COPY.check }));
    expect(view.getByText(GUIDANCE_COPY.notStrongest)).toBeTruthy();
    expect(view.getByText(item.options[wrong].feedback)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(normalizeRecord(JSON.parse(localStorage.getItem('tutor:01')!))).toMatchObject({ attempts: { '01': 1 }, firstAttemptCorrect: { '01': false }, solved: {} });

    await act(async () => { fireEvent.click(view.getByRole('button', { name: GUIDANCE_COPY.getGuidance })); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/tutor');
    expect(sentBody()).toEqual({ lessonId: '01', itemId: '01', chosenIndex: wrong, attemptNumber: 1, strategy: 'socratic-hint' });
    await waitFor(() => expect(view.getByText(REPLY.restatement)).toBeTruthy());
    expect(view.getByText(REPLY.guidance)).toBeTruthy();
    expect(view.getByText(REPLY.nextStep)).toBeTruthy();
    expect(view.getByText(GUIDANCE_COPY.strategy['socratic-hint'])).toBeTruthy();
    expect(view.getByRole('link', { name: grounding[0].title }).getAttribute('href')).toBe(grounding[0].href);
    expect(normalizeRecord(JSON.parse(localStorage.getItem('tutor:01')!))).toMatchObject({ hintsUsed: 1, roundsPerItem: { '01': 1 } });

    const followUp = view.getByLabelText(GUIDANCE_COPY.followUpLabel);
    fireEvent.change(followUp, { target: { value: 'Why does the format matter?' } });
    await act(async () => { fireEvent.click(view.getByRole('button', { name: GUIDANCE_COPY.send })); });
    expect(sentBody(1)).toMatchObject({ chosenIndex: wrong, attemptNumber: 1, strategy: 'socratic-hint', learnerMessage: 'Why does the format matter?' });
    await waitFor(() => expect(view.getByText(GUIDANCE_COPY.followUpDone)).toBeTruthy());
    expect(view.queryByLabelText(GUIDANCE_COPY.followUpLabel)).toBeNull();

    fireEvent.click(view.getByRole('button', { name: GUIDANCE_COPY.tryAgain }));
    expect(view.queryByText(REPLY.restatement)).toBeNull();
    fireEvent.click(view.getByLabelText(item.options[wrong].text));
    fireEvent.click(view.getByRole('button', { name: GUIDANCE_COPY.check }));
    await act(async () => { fireEvent.click(view.getByRole('button', { name: GUIDANCE_COPY.getGuidance })); });
    expect(sentBody(2)).toMatchObject({ attemptNumber: 2, strategy: 'worked-example' });
  });

  it('correct answer: affirms, stops, shows the completion line on the last item, and asks for guidance with "stop"', async () => {
    const view = render(<TutorPanel lessonId="01" />);
    fireEvent.click(view.getByLabelText(item.options[right].text));
    fireEvent.click(view.getByRole('button', { name: GUIDANCE_COPY.check }));
    expect(view.getByText(GUIDANCE_COPY.strongerChoice)).toBeTruthy();
    expect(view.getByText(item.options[right].feedback)).toBeTruthy();
    expect(view.getByText(GUIDANCE_COPY.finished)).toBeTruthy();
    expect(view.queryByRole('button', { name: GUIDANCE_COPY.tryAgain })).toBeNull();
    expect(view.queryByRole('button', { name: GUIDANCE_COPY.nextQuestion })).toBeNull();
    await act(async () => { fireEvent.click(view.getByRole('button', { name: GUIDANCE_COPY.getGuidance })); });
    expect(sentBody()).toMatchObject({ chosenIndex: right, attemptNumber: 1, strategy: 'stop' });
    expect(normalizeRecord(JSON.parse(localStorage.getItem('tutor:01')!))).toMatchObject({ firstAttemptCorrect: { '01': true }, solved: { '01': true }, hintsUsed: 0 });
  });

  it('moves to the next question when the lesson has more items', () => {
    const second: TutorItem = { ...item, itemId: '02', question: 'A second practice question for this part?' };
    const view = render(<TutorPanel lessonId="01" items={[item, second]} />);
    fireEvent.click(view.getByLabelText(item.options[right].text));
    fireEvent.click(view.getByRole('button', { name: GUIDANCE_COPY.check }));
    expect(view.queryByText(GUIDANCE_COPY.finished)).toBeNull();
    fireEvent.click(view.getByRole('button', { name: GUIDANCE_COPY.nextQuestion }));
    expect(view.getByText(second.question)).toBeTruthy();
    expect(view.queryByText(item.question)).toBeNull();
    expect(view.getAllByRole('radio').every(radio => !(radio as HTMLInputElement).checked)).toBe(true);
  });

  it('shows that guidance is unavailable when the request fails, and keeps the lesson feedback', async () => {
    mockFetch({ error: 'down' }, false);
    const view = render(<TutorPanel lessonId="01" />);
    fireEvent.click(view.getByLabelText(item.options[wrong].text));
    fireEvent.click(view.getByRole('button', { name: GUIDANCE_COPY.check }));
    await act(async () => { fireEvent.click(view.getByRole('button', { name: GUIDANCE_COPY.getGuidance })); });
    await waitFor(() => expect(view.getByText(GUIDANCE_COPY.unavailable)).toBeTruthy());
    expect(view.getByText(item.options[wrong].feedback)).toBeTruthy();
  });

  it('keeps every static string at or below a 10.5 reading grade with no banned words', () => {
    const strings = flatStrings(GUIDANCE_COPY);
    expect(strings.length).toBeGreaterThan(15);
    for (const text of strings) {
      expect(passageGrade(text), text).toBeLessThanOrEqual(10.5);
      expect(text, text).not.toMatch(BANNED_VISIBLE);
    }
  });

  it('never shows a banned word in any rendered state', async () => {
    const view = render(<TutorPanel lessonId="01" />);
    expect(view.container.textContent).not.toMatch(BANNED_VISIBLE);
    fireEvent.click(view.getByLabelText(item.options[wrong].text));
    fireEvent.click(view.getByRole('button', { name: GUIDANCE_COPY.check }));
    expect(view.container.textContent).not.toMatch(BANNED_VISIBLE);
    await act(async () => { fireEvent.click(view.getByRole('button', { name: GUIDANCE_COPY.getGuidance })); });
    await waitFor(() => expect(view.getByText(REPLY.restatement)).toBeTruthy());
    expect(view.container.textContent).not.toMatch(BANNED_VISIBLE);
    expect(view.container.innerHTML).not.toMatch(/aria-label="[^"]*(tutor|\bAI\b)/i);
  });
});
