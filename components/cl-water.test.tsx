import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, within } from '@testing-library/react';
import { WATER_ESSAY_PARTS, WaterEssayContents, WaterEssayPager, WaterEssayPartBody, WaterModuleBody, waterPartHref } from './cl-water';
import { WATER_ESSAY, WATER_MODULES } from '@/lib/content/water-we-swim-in';
import { researchPlainText } from '@/lib/content/research-markdown';
import { ResearchMarkdown } from './research-markdown';

afterEach(cleanup);
const words = (text: string) => text.replace(/\s+/g, ' ').trim();

describe('essay part pages', () => {
  it('keeps every section, the limits and the sources, in order and unchanged', () => {
    const original = [...WATER_ESSAY.sections.map(section => section.body), WATER_ESSAY.limits, WATER_ESSAY.sources].filter(Boolean);
    expect(WATER_ESSAY_PARTS.map(part => part.body)).toEqual(original);
    expect(WATER_ESSAY_PARTS.slice(0, WATER_ESSAY.sections.length).map(part => part.heading)).toEqual(WATER_ESSAY.sections.map(section => section.heading));
    expect(new Set(WATER_ESSAY_PARTS.map(part => part.slug)).size).toBe(WATER_ESSAY_PARTS.length);
    for (const part of WATER_ESSAY_PARTS) expect(part.slug).toMatch(/^[a-z0-9-]+$/);
  });
  it('renders one part with its heading and all of its text', () => {
    const part = WATER_ESSAY_PARTS.find(item => item.body.includes('### '))!;
    const view = render(<WaterEssayPartBody part={part} />);
    expect(view.getByRole('heading', { level: 2, name: part.heading })).toBeTruthy();
    expect(view.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0);
    expect(words(view.container.textContent!)).toContain(words(researchPlainText(part.body)).slice(0, 200));
  });
  it('lists every part, links to its page and marks the current one', () => {
    const view = render(<WaterEssayContents mode="pages" current={WATER_ESSAY_PARTS[2].slug} />);
    const links = within(view.getByRole('navigation', { name: 'In this essay' })).getAllByRole('link');
    expect(links.map(link => link.getAttribute('href'))).toEqual(WATER_ESSAY_PARTS.map(waterPartHref));
    expect(links[2].getAttribute('aria-current')).toBe('page');
  });
  it('keeps old section anchors on the contents page and uses anchors on the whole-essay page', () => {
    const contents = render(<WaterEssayContents mode="pages" />);
    for (const section of WATER_ESSAY.sections) expect(contents.container.querySelector(`li#${section.id} a`)?.getAttribute('href')).toBe(`/learn/water-we-swim-in/essay/${section.id}`);
    cleanup();
    const whole = render(<WaterEssayContents mode="anchors" />);
    expect(whole.getAllByRole('link').map(link => link.getAttribute('href'))).toEqual(WATER_ESSAY_PARTS.map(part => `#${part.slug}`));
  });
  it('links to the previous and next parts', () => {
    const first = render(<WaterEssayPager index={0} />);
    expect(first.getByRole('link', { name: 'Essay contents' })).toBeTruthy();
    expect(first.getByRole('link', { name: `Next: ${WATER_ESSAY_PARTS[1].heading}` }).getAttribute('href')).toBe(waterPartHref(WATER_ESSAY_PARTS[1]));
    cleanup();
    const last = render(<WaterEssayPager index={WATER_ESSAY_PARTS.length - 1} />);
    expect(last.getByRole('link', { name: `Previous: ${WATER_ESSAY_PARTS.at(-2)!.heading}` })).toBeTruthy();
    expect(last.getByRole('link', { name: 'Course overview' })).toBeTruthy();
  });
});

describe('module contents', () => {
  it.each(WATER_MODULES.map(module => [module.slug, module] as const))('%s keeps every word and adds an anchored contents list', (_slug, module) => {
    const view = render(<WaterModuleBody markdown={module.body} />);
    const headings = [...module.body.matchAll(/^##\s+(.+)$/gm)].map(match => match[1]);
    const nav = view.getByRole('navigation', { name: 'In this module' });
    const links = within(nav).getAllByRole('link');
    expect(links.map(link => link.textContent)).toEqual(headings.map(heading => researchPlainText(heading).trim()));
    for (const link of links) expect(document.getElementById(link.getAttribute('href')!.slice(1))?.tagName).toBe('SECTION');
    expect(view.getAllByRole('heading', { level: 2 }).length).toBe(headings.length + 1);
    // Same text, in the same order, as the module rendered before the contents list was added.
    const before = render(<div data-testid="before"><ResearchMarkdown markdown={module.body} /></div>).getByTestId('before').textContent!;
    expect(view.container.textContent!.replace(nav.textContent!, '')).toBe(before);
  });
});
