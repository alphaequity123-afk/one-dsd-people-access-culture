import { expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const search = vi.hoisted(() => vi.fn());
vi.mock('@/lib/search/site-search', () => ({siteSearch: search}));
vi.mock('@/lib/product/request-context', () => ({requestedContentScope: async () => 'dsd'}));
import { GET } from './route';

it('returns unchanged search results and exposes only named stage durations', async () => {
  const results = [{id:'example',title:'Example',href:'/example',excerpt:'Reviewed text',area:'learn',external:false}];
  search.mockImplementation(async (_query, _scope, _limit, timing) => {
    timing('library',12.34); timing('supplements',45.67); timing('ranking',3.21);
    return results;
  });
  const response = await GET(new NextRequest('https://example.org/api/search?q=private-question&limit=8'));
  expect(await response.json()).toEqual({results});
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('server-timing')).toBe('library;dur=12.3, supplements;dur=45.7, ranking;dur=3.2');
  expect(response.headers.get('server-timing')).not.toContain('private-question');
});
