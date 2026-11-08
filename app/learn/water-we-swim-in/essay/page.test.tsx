import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, within } from '@testing-library/react';
import EssayContentsPage from './page';
import WholeEssayPage from './whole/page';
import EssayPartPage, { generateStaticParams } from './[part]/page';
import { WATER_ESSAY_PARTS } from '@/components/cl-water';

afterEach(cleanup);

describe('the essay in parts', () => {
  it('opens on a contents page with every part, a start link and the whole essay on one page', () => {
    const view = render(<EssayContentsPage />);
    expect(within(view.getByRole('navigation', { name: 'In this essay' })).getAllByRole('link')).toHaveLength(WATER_ESSAY_PARTS.length);
    expect(view.getByRole('link', { name: 'Read the whole essay on one page' }).getAttribute('href')).toBe('/learn/water-we-swim-in/essay/whole');
    expect(view.getByRole('link', { name: `Start reading: ${WATER_ESSAY_PARTS[0].heading}` })).toBeTruthy();
    expect(view.getByText('Download or share this essay')).toBeTruthy();
  });
  it('gives each part its own page with previous and next links', async () => {
    expect(generateStaticParams().map(param => param.part)).toEqual(WATER_ESSAY_PARTS.map(part => part.slug));
    const part = WATER_ESSAY_PARTS[3];
    const view = render(await EssayPartPage({ params: Promise.resolve({ part: part.slug }) }));
    expect(view.getByRole('heading', { level: 2, name: part.heading })).toBeTruthy();
    expect(view.getByText(`part 4 of ${WATER_ESSAY_PARTS.length}`, { exact: false })).toBeTruthy();
    const pager = view.getByRole('navigation', { name: 'Essay parts' });
    expect(within(pager).getByRole('link', { name: `Previous: ${WATER_ESSAY_PARTS[2].heading}` })).toBeTruthy();
    expect(within(pager).getByRole('link', { name: `Next: ${WATER_ESSAY_PARTS[4].heading}` })).toBeTruthy();
    expect(view.getByRole('link', { name: 'Read the whole essay on one page', hidden: true })).toBeTruthy();
  });
  it('keeps the whole essay on one page with a contents list of anchors', () => {
    const view = render(<WholeEssayPage />);
    const links = within(view.getByRole('navigation', { name: 'In this essay' })).getAllByRole('link');
    expect(links.map(link => link.getAttribute('href'))).toEqual(WATER_ESSAY_PARTS.map(part => `#${part.slug}`));
    for (const part of WATER_ESSAY_PARTS) expect(view.getByRole('heading', { level: 2, name: part.heading })).toBeTruthy();
  });
});
