// Read-only real-storage comparison. Supply bucket settings in the environment;
// this script never obtains or writes credentials or changes stored objects.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const revision = process.argv[2];
if (!revision || !/^[a-f0-9]{7,40}$/.test(revision)) throw new Error('Pass the baseline commit SHA');
const directory = path.join(root, '.data', 'media-benchmark');
mkdirSync(directory, { recursive: true });
writeFileSync(path.join(directory, 'course-media-baseline.ts'),
  execFileSync('git', ['show', `${revision}:lib/content/course-media.ts`], { cwd: root, encoding: 'utf8' })
    .replace("from './geffen-volume'", "from '@/lib/content/geffen-volume'"));
writeFileSync(path.join(directory, 'comparison.test.ts'), `
import { it, expect } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { publishedCourseMedia } from '@/lib/content/course-media';
import { publishedCourseMedia as baseline } from './course-media-baseline';
import { configuredPublicMediaRoot } from '@/lib/storage/public-media-store';
it('compares current publications with read-only storage requests', async () => {
  const root = configuredPublicMediaRoot(process.env.PAC_GEFFEN_PUBLIC_MEDIA_ROOT, process.env.RAILWAY_VOLUME_MOUNT_PATH);
  expect(root).toBeDefined();
  const samples = [], originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (...args) => { calls++; return originalFetch(...args); };
  const measure = async (fn: typeof baseline) => {
    calls = 0; const start = performance.now(); const items = await fn(root, true);
    return {items, ms: Math.round(performance.now()-start), requests: calls};
  };
  try {
    for(let i=0;i<4;i++) {
      let before, after;
      if (i % 2) { after=await measure(publishedCourseMedia); before=await measure(baseline); }
      else { before=await measure(baseline); after=await measure(publishedCourseMedia); }
      expect(after.items).toEqual(before.items);
      expect(after.items.length).toBeGreaterThan(0);
      samples.push({baselineMs: before.ms, optimizedMs: after.ms, baselineRequests: before.requests, optimizedRequests: after.requests, items: after.items.length});
    }
    await writeFile('.data/media-benchmark/results.json', JSON.stringify(samples, null, 2));
  } finally { globalThis.fetch = originalFetch; }
}, 240000);
`);
const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '.data/media-benchmark/comparison.test.ts', '--maxWorkers=1'], {
  cwd: root, env: process.env, stdio: 'inherit', windowsHide: true,
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
