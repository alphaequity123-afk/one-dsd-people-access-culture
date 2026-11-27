// Read-only comparison against a Git revision. Supply runtime database/storage
// settings in the environment; this script never retrieves or writes credentials.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const revision = process.argv[2];
if (!revision || !/^[a-f0-9]{7,40}$/.test(revision)) throw new Error('Pass the baseline commit SHA');
const directory = path.join(root, '.data', 'search-benchmark');
mkdirSync(directory, { recursive: true });
const source = name => execFileSync('git', ['show', `${revision}:${name}`], { cwd: root, encoding: 'utf8' });
writeFileSync(path.join(directory, 'course-media-baseline.ts'), source('lib/content/course-media.ts')
  .replace("from './geffen-volume'", "from '@/lib/content/geffen-volume'"));
writeFileSync(path.join(directory, 'supplements-baseline.ts'), source('lib/intelligence/retrieval/published-resource-supplements.ts')
  .replaceAll('from "./', 'from "@/lib/intelligence/retrieval/')
  .replace('from "@/lib/content/course-media"', 'from "./course-media-baseline"'));
writeFileSync(path.join(directory, 'search-baseline.ts'), source('lib/search/site-search.ts')
  .replace('from "@/lib/intelligence/retrieval/published-resource-supplements"', 'from "./supplements-baseline"'));
writeFileSync(path.join(directory, 'comparison.test.ts'), `
import { it, expect } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { siteSearch, type SiteSearchResult } from '@/lib/search/site-search';
import { siteSearch as baseline } from './search-baseline';
it('returns the same results with less request-time work', async () => {
  const results = [];
  for (const [index, query] of ['leadership', 'accessibility'].entries()) {
    const stages: Record<string, number> = {};
    const measure = async (read: () => Promise<SiteSearchResult[]>) => { const start = performance.now(); const hits = await read(); return { hits, ms: Math.round(performance.now()-start) }; };
    let before, after;
    const optimized = () => siteSearch(query, 'dsd', 8, (stage, ms) => { stages[stage] = Math.round(ms); });
    if (index % 2) { after = await measure(optimized); before = await measure(() => baseline(query, 'dsd', 8)); }
    else { before = await measure(() => baseline(query, 'dsd', 8)); after = await measure(optimized); }
    expect(after.hits).toEqual(before.hits);
    results.push({ query, baselineMs: before.ms, optimizedMs: after.ms, resultCount: after.hits.length, stages });
  }
  await writeFile('.data/search-benchmark/results.json', JSON.stringify(results, null, 2));
}, 240000);
`);
const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '.data/search-benchmark/comparison.test.ts', '--maxWorkers=1'], {
  cwd: root, env: process.env, stdio: 'inherit', windowsHide: true,
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
