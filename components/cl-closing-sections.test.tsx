import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import EquityDecisionsCurriculum from './equity-decisions-curriculum';
import InterculturalCurriculum from './intercultural-curriculum';
import equity from '@/lib/content/equity-everyday-decisions.json';
import intercultural from '@/lib/content/intercultural-curriculum.json';

afterEach(cleanup);
const closed = (container: HTMLElement) => [...container.querySelectorAll<HTMLDetailsElement>('details.course-more-item')].map(item => ({ heading: item.querySelector('summary > h2')?.textContent, open: item.open }));

describe('closing sections sit in closed panels, with nothing removed', () => {
  it('equity toolkit lessons', () => {
    const lesson = equity.modules[0];
    const view = render(<EquityDecisionsCurriculum lessonId={lesson.id} />);
    expect(closed(view.container)).toEqual([
      ...(lesson.resources?.length ? [{ heading: 'Resources for this part', open: false }] : []),
      { heading: 'Your next step', open: false },
      { heading: 'Sources and further guidance', open: false },
    ]);
    expect(view.getByRole('button', { name: 'Mark this lesson complete', hidden: true })).toBeTruthy();
    expect(view.getByText(`Next: ${equity.modules[1].title}`)).toBeTruthy();
    for (const resource of lesson.resources ?? []) expect(view.getAllByText(resource.title).length).toBeGreaterThan(0);
    for (const section of lesson.sections) expect(view.getByRole('heading', { name: section.title })).toBeTruthy();
  });
  it('intercultural lessons', () => {
    const resources = [{ title: 'A related reading', href: '/learn/readings' }];
    const view = render(<InterculturalCurriculum lessonId="02" communities={[]} resources={resources} curriculum={intercultural} mediaData={{ status: 'none', lessons: [] }} />);
    expect(closed(view.container)).toEqual([{ heading: 'Continue learning', open: false }, { heading: 'Your next step', open: false }]);
    expect(view.getByText('A related reading')).toBeTruthy();
    expect(view.getByText(`Previous: ${intercultural.modules[0].title}`)).toBeTruthy();
    expect(view.getByText(/Progress is kept in this browser/)).toBeTruthy();
    expect(view.getByRole('heading', { name: 'Read and reflect' })).toBeTruthy();
  });
});
