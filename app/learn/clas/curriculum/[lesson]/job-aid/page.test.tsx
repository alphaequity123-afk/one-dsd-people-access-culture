import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import fixture from '@/lib/content/__fixtures__/clas-curriculum-practice.fixture.json';
import { normalizePracticeContent, practiceModule } from '@/lib/content/clas-curriculum-practice';
import { EMPTY_LESSON_PAGE_DATA } from '@/lib/learning/clas-page-data';

const loadClasLessonPageData = vi.fn();
vi.mock('@/lib/content/clas-curriculum-page-data', () => ({ loadClasLessonPageData: (id: string) => loadClasLessonPageData(id) }));
const { default: Page, generateMetadata, generateStaticParams } = await import('./page');

const moduleOne = practiceModule(normalizePracticeContent(fixture), '01')!;
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('job-aid page', () => {
  it('renders the aid from the content file with print and text-download controls', async () => {
    loadClasLessonPageData.mockReturnValue({ ...EMPTY_LESSON_PAGE_DATA, practice: moduleOne, jobAidAvailable: true });
    const view = render(await Page({ params: Promise.resolve({ lesson: '01' }) }));
    expect(loadClasLessonPageData).toHaveBeenCalledWith('01');
    expect(view.getByRole('heading', { level: 1 }).textContent).toBe(moduleOne.jobAid!.title);
    expect(view.getByText(/PART 1: START WITH THE PERSON AND THE PURPOSE/)).toBeTruthy();
    for (const heading of ['Before', 'During', 'After', 'Remember', 'Who to ask']) expect(view.getByRole('heading', { name: heading })).toBeTruthy();
    expect(view.getByText('Read it as a recipient would.')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Download as .txt' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Print this page' })).toBeTruthy();
    expect(view.getByRole('link', { name: /Part 1: Start with the person/ }).getAttribute('href')).toBe('/learn/clas/curriculum/01');
    expect(view.getByText(/CLAS standard 1\./)).toBeTruthy();
  });
  it('explains when the aid has not been published and links back to the lesson', async () => {
    loadClasLessonPageData.mockReturnValue(EMPTY_LESSON_PAGE_DATA);
    const view = render(await Page({ params: Promise.resolve({ lesson: '02' }) }));
    expect(view.getByRole('heading', { level: 1 }).textContent).toBe('Job aid for Part 2 is not available yet');
    expect(view.getByRole('link', { name: /Open Part 2/ }).getAttribute('href')).toBe('/learn/clas/curriculum/02');
    expect(view.queryByRole('button')).toBeNull();
  });
  it('is a 404 for an unknown lesson and lists the nine lessons for static generation', async () => {
    await expect(Page({ params: Promise.resolve({ lesson: '99' }) })).rejects.toThrow();
    expect(generateStaticParams()).toHaveLength(9);
    expect((await generateMetadata({ params: Promise.resolve({ lesson: '01' }) })).title).toBe('Job aid: Start with the person and the purpose');
  });
});
