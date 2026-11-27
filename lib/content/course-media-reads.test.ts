import { beforeEach, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => ({ names: vi.fn(), open: vi.fn() }));
vi.mock('@/lib/storage/public-media-store', () => ({
  listStoredNames: storage.names, configuredPublicMediaRoot: vi.fn(), createStoredFolders: vi.fn(),
  storedCapacity: vi.fn(), storedFolderReady: vi.fn(), writeStoredFile: vi.fn(),
}));
vi.mock('./geffen-volume', () => ({ safeOpen: storage.open }));
import { publishedCourseMedia } from './course-media';

const manifest = (id: string) => ({ format: 'course-media-v1', id, title: id, kind: 'audio', pages: ['/courses/example'],
  media: 'a'.repeat(64)+'.mp3', captions: 'b'.repeat(64)+'.vtt', transcript: 'c'.repeat(64)+'.txt', durationSeconds: 20 });

beforeEach(() => { storage.names.mockReset(); storage.open.mockReset(); });

it('bounds concurrent storage reads, preserves sorted results and closes every opened handle', async () => {
  const names = Array.from({length: 24}, (_, i) => `item-${String(i).padStart(2, '0')}.json`);
  storage.names.mockResolvedValue([...names].reverse());
  let active = 0, peak = 0, opened = 0, closed = 0;
  const wait = async () => { active++; peak = Math.max(peak, active); await new Promise(resolve => setTimeout(resolve, 2)); active--; };
  storage.open.mockImplementation(async (_root: string, segments: string[]) => {
    await wait(); opened++;
    return {info: {size: 100}, file: {readFile: async () => { await wait(); return JSON.stringify(manifest(segments[2].slice(0,-5))); }, close: async () => {closed++;}}};
  });
  const result = await publishedCourseMedia('test:bounded', true);
  expect(result.map(item => item.id)).toEqual(names.map(name => name.slice(0,-5)));
  expect(peak).toBeGreaterThan(1);
  expect(peak).toBeLessThanOrEqual(8);
  expect(active).toBe(0);
  expect(closed).toBe(opened);
});

it('fresh reads honor removed manifests, missing assets, invalid files and retired media immediately', async () => {
  let missing = false;
  storage.names.mockResolvedValue(['good.json', 'broken.json', 'leadership-film-01-old.json']);
  storage.open.mockImplementation(async (_root: string, segments: string[]) => {
    if (missing && segments[2].endsWith('.vtt')) return null;
    return {info: {size: 100}, file: {readFile: async () => segments[2] === 'broken.json' ? '{broken' : JSON.stringify(manifest(segments[2].slice(0,-5))), close: async () => {}}};
  });
  expect((await publishedCourseMedia('test:fresh', true)).map(item => item.id)).toEqual(['good']);
  missing = true;
  expect(await publishedCourseMedia('test:fresh', true)).toEqual([]);
  missing = false;
  storage.names.mockResolvedValue([]);
  expect(await publishedCourseMedia('test:fresh', true)).toEqual([]);
});
